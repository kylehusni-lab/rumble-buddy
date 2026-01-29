-- TV display snapshot: safe, read-only data for public TV viewing
-- This avoids relying on direct table SELECT policies (which may block TVs on separate devices).

CREATE OR REPLACE FUNCTION public.get_tv_snapshot(p_party_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_event_started_at timestamptz;
  v_players jsonb;
  v_numbers jsonb;
  v_results jsonb;
  v_picks jsonb;
BEGIN
  SELECT status, event_started_at
    INTO v_status, v_event_started_at
  FROM public.parties
  WHERE code = p_party_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.points DESC, p.joined_at ASC), '[]'::jsonb)
    INTO v_players
  FROM (
    SELECT id, display_name, points, joined_at
    FROM public.players
    WHERE party_code = p_party_code
  ) p;

  SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.rumble_type, n.number), '[]'::jsonb)
    INTO v_numbers
  FROM (
    SELECT number, wrestler_name, assigned_to_player_id, entry_timestamp, elimination_timestamp, rumble_type
    FROM public.rumble_numbers
    WHERE party_code = p_party_code
  ) n;

  SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
    INTO v_results
  FROM (
    SELECT match_id, result
    FROM public.match_results
    WHERE party_code = p_party_code
  ) r;

  -- Picks are already non-PII; limit to players in this party
  SELECT COALESCE(jsonb_agg(to_jsonb(pk)), '[]'::jsonb)
    INTO v_picks
  FROM (
    SELECT p.player_id, p.match_id, p.prediction
    FROM public.picks p
    WHERE p.player_id IN (
      SELECT id FROM public.players WHERE party_code = p_party_code
    )
  ) pk;

  RETURN jsonb_build_object(
    'found', true,
    'status', v_status,
    'event_started_at', v_event_started_at,
    'players', v_players,
    'numbers', v_numbers,
    'match_results', v_results,
    'picks', v_picks
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tv_snapshot(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_tv_snapshot(text) TO authenticated;
