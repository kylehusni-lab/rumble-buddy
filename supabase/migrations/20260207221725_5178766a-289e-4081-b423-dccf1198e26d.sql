-- Update save_solo_pick function to include event_id
CREATE OR REPLACE FUNCTION public.save_solo_pick(p_player_id uuid, p_match_id text, p_prediction text, p_event_id text DEFAULT 'mania_41')
 RETURNS TABLE(success boolean, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify player exists
  IF NOT EXISTS (SELECT 1 FROM solo_players WHERE id = p_player_id) THEN
    RETURN QUERY SELECT false, 'Player not found'::TEXT;
    RETURN;
  END IF;

  -- Check if match already has a result (prevent changing picks after scoring)
  IF EXISTS (
    SELECT 1 FROM solo_results 
    WHERE solo_player_id = p_player_id AND match_id = p_match_id
  ) THEN
    RETURN QUERY SELECT false, 'Cannot change pick after match is scored'::TEXT;
    RETURN;
  END IF;

  -- Upsert the pick with event_id (ownership enforced by player_id match)
  INSERT INTO solo_picks (solo_player_id, match_id, prediction, event_id)
  VALUES (p_player_id, p_match_id, p_prediction, p_event_id)
  ON CONFLICT (solo_player_id, match_id, event_id)
  DO UPDATE SET prediction = p_prediction, updated_at = now()
  WHERE solo_picks.solo_player_id = p_player_id;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$function$;