-- Function to mark a party as ended (host-only or auto-expire)
CREATE OR REPLACE FUNCTION public.mark_party_ended(p_party_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_host_id UUID;
BEGIN
  -- Get host user id
  SELECT host_user_id INTO v_host_id 
  FROM parties 
  WHERE code = p_party_code;
  
  -- Allow if caller is the host OR if called as a service (for auto-expire)
  IF v_host_id = auth.uid() OR auth.uid() IS NOT NULL THEN
    UPDATE parties 
    SET status = 'ended' 
    WHERE code = p_party_code AND status = 'live';
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;