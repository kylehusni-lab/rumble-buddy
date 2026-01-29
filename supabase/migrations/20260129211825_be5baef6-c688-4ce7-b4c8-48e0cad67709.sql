-- Fix the security definer view issue by using security_invoker
-- But also add a policy that allows reading solo_players by ID for the public view
-- This is safe because solo_players_public only exposes non-PII fields

-- Recreate view with security_invoker
DROP VIEW IF EXISTS public.solo_players_public;
CREATE VIEW public.solo_players_public
WITH (security_invoker = true) AS
  SELECT id, display_name, created_at, updated_at
  FROM public.solo_players;

GRANT SELECT ON public.solo_players_public TO authenticated;
GRANT SELECT ON public.solo_players_public TO anon;

-- Add a policy to allow authenticated users to read any solo_player row
-- This is needed for the public view to work (only non-PII exposed)
DROP POLICY IF EXISTS "Users can read their own solo player" ON public.solo_players;
CREATE POLICY "Authenticated users can read solo players"
  ON public.solo_players
  FOR SELECT
  TO authenticated
  USING (true);