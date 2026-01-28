-- Recreate parties_public view with definer permissions (default)
-- This allows the view to bypass RLS on the base table while only exposing safe columns

DROP VIEW IF EXISTS parties_public;

CREATE VIEW parties_public AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  womens_rumble_entrants,
  status
FROM parties;

-- Note: Without security_invoker=on, the view uses definer permissions
-- This bypasses the USING(false) RLS policy on parties table
-- Sensitive columns (host_session_id, host_pin) remain hidden