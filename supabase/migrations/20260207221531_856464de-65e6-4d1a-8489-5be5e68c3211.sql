-- Add event_id to parties table
ALTER TABLE parties 
ADD COLUMN event_id TEXT NOT NULL DEFAULT 'mania_41';

-- Add event_id to picks table
ALTER TABLE picks 
ADD COLUMN event_id TEXT DEFAULT 'mania_41';

-- Backfill existing picks
UPDATE picks SET event_id = 'mania_41' WHERE event_id IS NULL;

-- Make it NOT NULL
ALTER TABLE picks ALTER COLUMN event_id SET NOT NULL;

-- Update unique constraint to include event_id
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_player_id_match_id_key;
ALTER TABLE picks ADD CONSTRAINT picks_player_match_event_unique 
  UNIQUE (player_id, match_id, event_id);

-- Add event_id to solo_picks table  
ALTER TABLE solo_picks 
ADD COLUMN event_id TEXT DEFAULT 'mania_41';

-- Backfill existing solo_picks
UPDATE solo_picks SET event_id = 'mania_41' WHERE event_id IS NULL;

-- Make it NOT NULL
ALTER TABLE solo_picks ALTER COLUMN event_id SET NOT NULL;

-- Update unique constraint for solo_picks
ALTER TABLE solo_picks DROP CONSTRAINT IF EXISTS solo_picks_solo_player_id_match_id_key;
ALTER TABLE solo_picks ADD CONSTRAINT solo_picks_player_match_event_unique 
  UNIQUE (solo_player_id, match_id, event_id);