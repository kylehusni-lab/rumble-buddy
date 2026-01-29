-- Create a SECURITY DEFINER function for seeding demo picks
-- This bypasses RLS for controlled demo data creation

CREATE OR REPLACE FUNCTION public.seed_demo_picks(
  p_picks jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.picks (player_id, match_id, prediction)
  SELECT 
    (pick->>'player_id')::uuid,
    pick->>'match_id',
    pick->>'prediction'
  FROM jsonb_array_elements(p_picks) AS pick;
  
  RETURN true;
END;
$$;