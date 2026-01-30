-- Create RPC function for atomic solo player creation/retrieval
-- This function checks for existing solo player by user_id, or creates one if not found

CREATE OR REPLACE FUNCTION public.get_or_create_solo_player(
  p_display_name text DEFAULT 'Me'
)
RETURNS TABLE(id uuid, display_name text, created_at timestamptz, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_display_name text;
  v_created_at timestamptz;
  v_is_new boolean := false;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check for existing record
  SELECT sp.id, sp.display_name, sp.created_at
  INTO v_id, v_display_name, v_created_at
  FROM public.solo_players sp
  WHERE sp.user_id = v_user_id;
  
  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO public.solo_players (email, pin, display_name, user_id)
    VALUES (
      COALESCE((SELECT email FROM auth.users WHERE auth.users.id = v_user_id), 'unknown'),
      '', -- Empty PIN for password-auth users
      COALESCE(NULLIF(trim(p_display_name), ''), 'Me'),
      v_user_id
    )
    RETURNING solo_players.id, solo_players.display_name, solo_players.created_at
    INTO v_id, v_display_name, v_created_at;
    v_is_new := true;
  END IF;
  
  RETURN QUERY SELECT v_id, v_display_name, v_created_at, v_is_new;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_solo_player(text) TO authenticated;