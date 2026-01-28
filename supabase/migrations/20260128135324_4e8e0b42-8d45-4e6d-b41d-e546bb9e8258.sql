-- Enable RLS on players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create a public-safe view that excludes sensitive columns (email, session_id)
-- This view is for leaderboards and public display purposes
CREATE VIEW public.players_public
WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  party_code,
  points,
  joined_at
FROM public.players;

-- CRITICAL: Deny direct SELECT access to the base players table
-- This prevents email addresses from being scraped
CREATE POLICY "No direct read access to players table"
ON public.players
FOR SELECT
USING (false);

-- Allow anyone to insert new players (joining a party)
CREATE POLICY "Anyone can insert players"
ON public.players
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update players (for session recovery, points updates)
-- In a session-based app without auth.uid(), we allow updates
CREATE POLICY "Anyone can update players"
ON public.players
FOR UPDATE
USING (true);

-- Allow anyone to delete players (cleanup)
CREATE POLICY "Anyone can delete players"
ON public.players
FOR DELETE
USING (true);

-- Grant SELECT on the public view
GRANT SELECT ON public.players_public TO anon, authenticated;