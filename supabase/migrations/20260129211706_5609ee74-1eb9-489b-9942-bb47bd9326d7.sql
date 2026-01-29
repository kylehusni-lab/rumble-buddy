-- Allow reading solo_players_public without RLS restriction on the base table
-- The view only exposes non-PII fields (id, display_name, created_at, updated_at)
-- So we can allow SELECT on the view without the user_id check

-- First, recreate the view WITHOUT security_invoker so it doesn't inherit RLS
DROP VIEW IF EXISTS public.solo_players_public;
CREATE VIEW public.solo_players_public AS
  SELECT id, display_name, created_at, updated_at
  FROM public.solo_players;

-- Grant access to the view
GRANT SELECT ON public.solo_players_public TO authenticated;
GRANT SELECT ON public.solo_players_public TO anon;