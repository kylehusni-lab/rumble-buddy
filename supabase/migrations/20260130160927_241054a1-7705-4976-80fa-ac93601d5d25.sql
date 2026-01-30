-- Allow anonymous users to check party existence via parties_public view
-- This is needed for the join flow where unauthenticated users verify a party code

-- Drop the view and recreate without security_invoker to allow anonymous access
DROP VIEW IF EXISTS public.parties_public;

CREATE VIEW public.parties_public AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  status,
  womens_rumble_entrants,
  is_demo
FROM public.parties;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.parties_public TO anon, authenticated;