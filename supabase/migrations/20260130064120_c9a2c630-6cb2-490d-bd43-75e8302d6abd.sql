-- Add rejected_at column to access_requests table
ALTER TABLE public.access_requests
ADD COLUMN rejected_at timestamp with time zone DEFAULT NULL;

-- Create function to get all parties with member counts (admin only)
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
  host_display_name text
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
    (SELECT pl2.display_name FROM players pl2 WHERE pl2.party_code = p.code AND pl2.user_id = p.host_user_id LIMIT 1)::text as host_display_name
  FROM public.parties p
  LEFT JOIN public.players pl ON pl.party_code = p.code
  GROUP BY p.code, p.host_session_id, p.host_user_id, p.status, p.created_at, p.event_started_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to get party members (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_party_members(p_party_code text)
RETURNS TABLE(
  id uuid,
  display_name text,
  email text,
  points integer,
  joined_at timestamptz,
  user_id uuid
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
    pl.id,
    pl.display_name,
    pl.email,
    pl.points,
    pl.joined_at,
    pl.user_id
  FROM public.players pl
  WHERE pl.party_code = p_party_code
  ORDER BY pl.joined_at ASC;
END;
$$;

-- Create function to remove a player from a party (admin only)
CREATE OR REPLACE FUNCTION public.admin_remove_player(p_player_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Delete all picks for this player first
  DELETE FROM public.picks WHERE player_id = p_player_id;
  
  -- Delete the player
  DELETE FROM public.players WHERE id = p_player_id;
  
  RETURN true;
END;
$$;

-- Create function to create a party directly (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_party(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Create party with admin as host
  INSERT INTO public.parties (code, host_session_id, host_user_id, status)
  VALUES (p_code, 'admin-created', auth.uid(), 'pre_event');
  
  RETURN true;
END;
$$;