-- Drop and recreate parties_public view with event_id in correct column order
DROP VIEW IF EXISTS parties_public;
CREATE VIEW parties_public AS
SELECT 
  code,
  created_at,
  event_started_at,
  is_demo,
  status,
  mens_rumble_entrants,
  womens_rumble_entrants,
  event_id
FROM parties;