-- Create a SECURITY DEFINER function for seeding demo players
-- This bypasses RLS for controlled demo data creation

CREATE OR REPLACE FUNCTION public.seed_demo_player(
  p_party_code text,
  p_email text,
  p_display_name text,
  p_session_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.players (party_code, email, display_name, session_id)
  VALUES (p_party_code, p_email, p_display_name, p_session_id)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;