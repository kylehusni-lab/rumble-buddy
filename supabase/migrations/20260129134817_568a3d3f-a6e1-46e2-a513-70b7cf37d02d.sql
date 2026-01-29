-- Phase 1: Add user_id columns to key tables (nullable for migration)

-- Add host_user_id to parties table
ALTER TABLE public.parties 
ADD COLUMN host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to players table
ALTER TABLE public.players 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to solo_players table
ALTER TABLE public.solo_players 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create helper function to check if user is a party member
CREATE OR REPLACE FUNCTION public.is_party_member(p_party_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players
    WHERE party_code = p_party_code
      AND user_id = auth.uid()
  )
$$;

-- Create helper function to check if user is party host
CREATE OR REPLACE FUNCTION public.is_party_host(p_party_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parties
    WHERE code = p_party_code
      AND host_user_id = auth.uid()
  )
$$;

-- Update parties_public view with security_invoker
DROP VIEW IF EXISTS public.parties_public;
CREATE VIEW public.parties_public
WITH (security_invoker = on)
AS SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  status,
  womens_rumble_entrants
FROM public.parties;

-- Update players_public view with security_invoker
DROP VIEW IF EXISTS public.players_public;
CREATE VIEW public.players_public
WITH (security_invoker = on)
AS SELECT 
  id,
  display_name,
  joined_at,
  party_code,
  points
FROM public.players;

-- Update solo_players_public view with security_invoker
DROP VIEW IF EXISTS public.solo_players_public;
CREATE VIEW public.solo_players_public
WITH (security_invoker = on)
AS SELECT 
  id,
  display_name,
  created_at,
  updated_at
FROM public.solo_players;

-- Drop old RLS policies on parties
DROP POLICY IF EXISTS "Anyone can create parties" ON public.parties;
DROP POLICY IF EXISTS "Anyone can update parties" ON public.parties;
DROP POLICY IF EXISTS "No direct read access to parties table" ON public.parties;

-- New RLS policies for parties using auth.uid()
CREATE POLICY "Hosts can read their own party"
ON public.parties FOR SELECT
USING (auth.uid() = host_user_id);

CREATE POLICY "Authenticated users can create parties"
ON public.parties FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their own party"
ON public.parties FOR UPDATE
USING (auth.uid() = host_user_id);

-- Drop old RLS policies on players
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;
DROP POLICY IF EXISTS "Anyone can insert players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "No direct read access to players table" ON public.players;

-- New RLS policies for players using auth.uid()
CREATE POLICY "Players can read party members"
ON public.players FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_party_member(party_code)
  OR public.is_party_host(party_code)
);

CREATE POLICY "Authenticated users can create their player record"
ON public.players FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Players can update their own record"
ON public.players FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can delete players from their party"
ON public.players FOR DELETE
USING (public.is_party_host(party_code));

-- Drop old RLS policies on picks
DROP POLICY IF EXISTS "Anyone can create picks" ON public.picks;
DROP POLICY IF EXISTS "Anyone can read picks" ON public.picks;
DROP POLICY IF EXISTS "Anyone can update picks" ON public.picks;

-- New RLS policies for picks
CREATE POLICY "Players can read picks in their party"
ON public.picks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = picks.player_id
      AND (p.user_id = auth.uid() OR public.is_party_member(p.party_code) OR public.is_party_host(p.party_code))
  )
);

CREATE POLICY "Players can create their own picks"
ON public.picks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = picks.player_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their own picks"
ON public.picks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = picks.player_id AND p.user_id = auth.uid()
  )
  AND points_awarded IS NULL
);

-- Drop old RLS policies on rumble_numbers
DROP POLICY IF EXISTS "Anyone can create rumble_numbers" ON public.rumble_numbers;
DROP POLICY IF EXISTS "Anyone can delete rumble_numbers" ON public.rumble_numbers;
DROP POLICY IF EXISTS "Anyone can read rumble_numbers" ON public.rumble_numbers;
DROP POLICY IF EXISTS "Anyone can update rumble_numbers" ON public.rumble_numbers;

-- New RLS policies for rumble_numbers
CREATE POLICY "Party members can read rumble numbers"
ON public.rumble_numbers FOR SELECT
USING (public.is_party_member(party_code) OR public.is_party_host(party_code));

CREATE POLICY "Hosts can manage rumble numbers"
ON public.rumble_numbers FOR INSERT
WITH CHECK (public.is_party_host(party_code));

CREATE POLICY "Hosts can update rumble numbers"
ON public.rumble_numbers FOR UPDATE
USING (public.is_party_host(party_code));

CREATE POLICY "Hosts can delete rumble numbers"
ON public.rumble_numbers FOR DELETE
USING (public.is_party_host(party_code));

-- Drop old RLS policies on solo_players
DROP POLICY IF EXISTS "Anyone can create solo_players" ON public.solo_players;
DROP POLICY IF EXISTS "Anyone can update solo_players" ON public.solo_players;
DROP POLICY IF EXISTS "No direct read access to solo_players" ON public.solo_players;

-- New RLS policies for solo_players
CREATE POLICY "Users can read their own solo player"
ON public.solo_players FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create solo player"
ON public.solo_players FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own solo player"
ON public.solo_players FOR UPDATE
USING (auth.uid() = user_id);

-- Drop old RLS policies on solo_picks
DROP POLICY IF EXISTS "Anyone can create solo_picks" ON public.solo_picks;
DROP POLICY IF EXISTS "Anyone can read solo_picks" ON public.solo_picks;
DROP POLICY IF EXISTS "No direct update access to solo_picks" ON public.solo_picks;

-- New RLS policies for solo_picks
CREATE POLICY "Users can read their own solo picks"
ON public.solo_picks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_picks.solo_player_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own solo picks"
ON public.solo_picks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_picks.solo_player_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own solo picks"
ON public.solo_picks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_picks.solo_player_id AND sp.user_id = auth.uid()
  )
);

-- Update match_results - keep permissive for now (host-controlled)
-- These are scored by hosts, so we need host check

DROP POLICY IF EXISTS "Anyone can create match_results" ON public.match_results;
DROP POLICY IF EXISTS "Anyone can delete match_results" ON public.match_results;
DROP POLICY IF EXISTS "Anyone can read match_results" ON public.match_results;
DROP POLICY IF EXISTS "Anyone can update match_results" ON public.match_results;

CREATE POLICY "Party members can read match results"
ON public.match_results FOR SELECT
USING (public.is_party_member(party_code) OR public.is_party_host(party_code));

CREATE POLICY "Hosts can create match results"
ON public.match_results FOR INSERT
WITH CHECK (public.is_party_host(party_code));

CREATE POLICY "Hosts can update match results"
ON public.match_results FOR UPDATE
USING (public.is_party_host(party_code));

CREATE POLICY "Hosts can delete match results"
ON public.match_results FOR DELETE
USING (public.is_party_host(party_code));

-- Update solo_results policies
DROP POLICY IF EXISTS "Anyone can create solo_results" ON public.solo_results;
DROP POLICY IF EXISTS "Anyone can read solo_results" ON public.solo_results;
DROP POLICY IF EXISTS "Anyone can update solo_results" ON public.solo_results;

CREATE POLICY "Users can read their own solo results"
ON public.solo_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_results.solo_player_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own solo results"
ON public.solo_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_results.solo_player_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own solo results"
ON public.solo_results FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.solo_players sp
    WHERE sp.id = solo_results.solo_player_id AND sp.user_id = auth.uid()
  )
);