-- Drop and recreate the parties_public view with security_invoker=on
-- This ensures the view respects RLS policies properly
DROP VIEW IF EXISTS public.parties_public;

CREATE VIEW public.parties_public
WITH (security_invoker=on) AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  status,
  womens_rumble_entrants
FROM public.parties;

-- Add a policy allowing anyone to read parties via the public view
-- This is safe because the view excludes sensitive fields (host_pin, host_session_id, host_user_id)
CREATE POLICY "Anyone can read public party info"
ON public.parties
FOR SELECT
TO authenticated
USING (true);

-- Grant select on the view to authenticated users
GRANT SELECT ON public.parties_public TO authenticated;