-- Drop existing SELECT policy on players table
DROP POLICY IF EXISTS "Players can read party members" ON public.players;

-- Create new restrictive SELECT policy - users can only read their OWN row directly
-- For viewing other party members, use players_public view (which excludes email)
CREATE POLICY "Players can read own record only"
  ON public.players
  FOR SELECT
  USING (user_id = auth.uid());

-- Recreate players_public view with security_invoker for proper RLS
DROP VIEW IF EXISTS public.players_public;
CREATE VIEW public.players_public
WITH (security_invoker = true) AS
  SELECT id, display_name, joined_at, party_code, points
  FROM public.players;

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.players_public TO authenticated;
GRANT SELECT ON public.players_public TO anon;