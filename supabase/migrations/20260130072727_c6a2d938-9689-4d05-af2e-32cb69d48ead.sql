-- Update parties_public view to expose is_demo column
DROP VIEW IF EXISTS public.parties_public;

CREATE VIEW public.parties_public
WITH (security_invoker=on) AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  status,
  womens_rumble_entrants,
  is_demo
FROM public.parties;

GRANT SELECT ON public.parties_public TO authenticated;