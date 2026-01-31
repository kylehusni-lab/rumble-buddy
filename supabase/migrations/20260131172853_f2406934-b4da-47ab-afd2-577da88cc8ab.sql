-- Drop the existing function first
DROP FUNCTION IF EXISTS public.admin_get_all_parties();

-- Recreate with email_sent column
CREATE OR REPLACE FUNCTION public.admin_get_all_parties()
RETURNS TABLE(
  code text,
  host_session_id text,
  host_user_id uuid,
  status text,
  created_at timestamp with time zone,
  event_started_at timestamp with time zone,
  member_count bigint,
  host_email text,
  host_display_name text,
  is_demo boolean,
  email_sent boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.code,
    p.host_session_id,
    p.host_user_id,
    p.status,
    p.created_at,
    p.event_started_at,
    COUNT(pl.id)::bigint as member_count,
    (SELECT email FROM auth.users WHERE id = p.host_user_id)::text as host_email,
    (SELECT pl2.display_name FROM players pl2 WHERE pl2.party_code = p.code AND pl2.user_id = p.host_user_id LIMIT 1)::text as host_display_name,
    p.is_demo,
    p.email_sent
  FROM public.parties p
  LEFT JOIN public.players pl ON pl.party_code = p.code
  GROUP BY p.code, p.host_session_id, p.host_user_id, p.status, p.created_at, p.event_started_at, p.is_demo, p.email_sent
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to update email_sent status
CREATE OR REPLACE FUNCTION public.admin_update_party_email_sent(p_party_code text, p_email_sent boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  UPDATE public.parties
  SET email_sent = p_email_sent
  WHERE code = p_party_code;
  
  RETURN true;
END;
$$;