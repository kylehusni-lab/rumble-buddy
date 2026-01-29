-- Recreate solo_players_public view with security_invoker for proper RLS
DROP VIEW IF EXISTS public.solo_players_public;
CREATE VIEW public.solo_players_public
WITH (security_invoker = true) AS
  SELECT id, display_name, created_at, updated_at
  FROM public.solo_players;

-- Grant access to the view
GRANT SELECT ON public.solo_players_public TO authenticated;
GRANT SELECT ON public.solo_players_public TO anon;