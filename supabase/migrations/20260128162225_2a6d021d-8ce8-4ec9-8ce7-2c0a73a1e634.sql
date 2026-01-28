-- Fix players_public view so it can read from players despite players SELECT being blocked by RLS
DROP VIEW IF EXISTS public.players_public;

CREATE VIEW public.players_public AS
SELECT
  id,
  party_code,
  display_name,
  points,
  joined_at
FROM public.players;

GRANT SELECT ON public.players_public TO anon, authenticated;