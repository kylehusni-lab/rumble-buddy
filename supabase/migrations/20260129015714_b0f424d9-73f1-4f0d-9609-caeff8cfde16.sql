-- Create secure function to update party status (bypasses SELECT RLS restriction)
CREATE OR REPLACE FUNCTION public.update_party_status_with_pin(
  p_party_code text,
  p_pin text,
  p_status text,
  p_event_started_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin text;
BEGIN
  -- Get the stored PIN for verification
  SELECT host_pin INTO stored_pin
  FROM public.parties
  WHERE code = p_party_code;
  
  -- Party not found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verify PIN (allow if no PIN set OR if PIN matches)
  IF stored_pin IS NOT NULL AND stored_pin != p_pin THEN
    RETURN false;
  END IF;
  
  -- Update the party status
  UPDATE public.parties
  SET 
    status = p_status,
    event_started_at = COALESCE(p_event_started_at, event_started_at)
  WHERE code = p_party_code;
  
  RETURN true;
END;
$$;