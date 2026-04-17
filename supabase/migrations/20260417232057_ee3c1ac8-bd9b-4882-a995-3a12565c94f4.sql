
-- RPC: Allow any authenticated user to create a party as the host
CREATE OR REPLACE FUNCTION public.create_party_as_host(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.parties WHERE code = p_code) THEN
    RAISE EXCEPTION 'Party code already exists';
  END IF;

  INSERT INTO public.parties (code, host_session_id, host_user_id, status)
  VALUES (p_code, 'self-service-' || auth.uid()::text, auth.uid(), 'pre_event');

  RETURN true;
END;
$$;

-- RPC: Public-readable global leaderboard for an event (no PII)
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(p_event_id text DEFAULT 'mania_42', p_limit int DEFAULT 100)
RETURNS TABLE(
  solo_player_id uuid,
  display_name text,
  total_points int,
  picks_made int,
  rank int
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH player_scores AS (
    SELECT
      sp.id AS solo_player_id,
      sp.display_name,
      COALESCE((
        SELECT COUNT(*)::int FROM solo_picks pk
        WHERE pk.solo_player_id = sp.id AND pk.event_id = p_event_id
      ), 0) AS picks_made,
      COALESCE((
        SELECT COUNT(*)::int * 10
        FROM solo_picks pk
        JOIN solo_results sr ON sr.solo_player_id = pk.solo_player_id AND sr.match_id = pk.match_id
        WHERE pk.solo_player_id = sp.id AND pk.event_id = p_event_id AND pk.prediction = sr.result
      ), 0) AS total_points
    FROM solo_players sp
  )
  SELECT
    ps.solo_player_id,
    ps.display_name,
    ps.total_points,
    ps.picks_made,
    ROW_NUMBER() OVER (ORDER BY ps.total_points DESC, ps.picks_made DESC, ps.display_name ASC)::int AS rank
  FROM player_scores ps
  WHERE ps.picks_made > 0
  ORDER BY ps.total_points DESC, ps.picks_made DESC, ps.display_name ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_party_as_host(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(text, int) TO anon, authenticated;
