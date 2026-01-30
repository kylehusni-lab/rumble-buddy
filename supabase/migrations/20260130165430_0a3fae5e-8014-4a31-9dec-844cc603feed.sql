-- Fix: Restrict access_requests SELECT to admins only
-- Currently there's no SELECT policy, allowing anonymous access

-- Drop any existing permissive SELECT policies that might exist
DROP POLICY IF EXISTS "Admins can view access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Admins can read access requests" ON public.access_requests;

-- Create proper admin-only SELECT policy
CREATE POLICY "Only admins can read access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));