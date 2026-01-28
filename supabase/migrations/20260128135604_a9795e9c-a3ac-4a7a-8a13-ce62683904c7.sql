-- Create a secure RPC function for player email lookup
-- This allows checking if a player exists without exposing all player data
CREATE OR REPLACE FUNCTION public.lookup_player_by_email(
  p_party_code TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT players.id, players.display_name
  FROM public.players
  WHERE players.party_code = p_party_code
    AND lower(players.email) = lower(trim(p_email));
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.lookup_player_by_email(TEXT, TEXT) TO anon, authenticated;