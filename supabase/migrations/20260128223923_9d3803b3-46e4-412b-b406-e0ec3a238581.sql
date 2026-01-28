-- Add unique constraint for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'solo_picks_player_match_unique'
  ) THEN
    ALTER TABLE solo_picks 
    ADD CONSTRAINT solo_picks_player_match_unique UNIQUE (solo_player_id, match_id);
  END IF;
END $$;

-- Create secure RPC function to save solo picks with ownership validation
CREATE OR REPLACE FUNCTION save_solo_pick(
  p_player_id UUID,
  p_match_id TEXT,
  p_prediction TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Upsert the pick (ownership enforced by player_id match)
  INSERT INTO solo_picks (solo_player_id, match_id, prediction)
  VALUES (p_player_id, p_match_id, p_prediction)
  ON CONFLICT (solo_player_id, match_id)
  DO UPDATE SET prediction = p_prediction, updated_at = now()
  WHERE solo_picks.solo_player_id = p_player_id;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

-- Restrict direct UPDATE access to solo_picks
DROP POLICY IF EXISTS "Anyone can update solo_picks" ON solo_picks;
CREATE POLICY "No direct update access to solo_picks"
ON solo_picks FOR UPDATE
USING (false);