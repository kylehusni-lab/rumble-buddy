-- Drop and recreate the admin function with is_demo
DROP FUNCTION IF EXISTS public.admin_get_all_parties();

CREATE OR REPLACE FUNCTION public.admin_get_all_parties()
RETURNS TABLE(
  code text,
  host_session_id text,
  host_user_id uuid,
  status text,
  created_at timestamptz,
  event_started_at timestamptz,
  member_count bigint,
  host_email text,
  host_display_name text,
  is_demo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    p.is_demo
  FROM public.parties p
  LEFT JOIN public.players pl ON pl.party_code = p.code
  GROUP BY p.code, p.host_session_id, p.host_user_id, p.status, p.created_at, p.event_started_at, p.is_demo
  ORDER BY p.created_at DESC;
END;
$$;