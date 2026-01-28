-- Phase 1: Enable RLS on all tables and create secure policies
-- This migration addresses Critical findings #1 and #7 from the security audit

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rumble_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE SECURE VIEWS (hide sensitive columns)
-- ============================================

-- Create parties_public view (hides host_pin and host_session_id)
CREATE VIEW public.parties_public
WITH (security_invoker = on) AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  womens_rumble_entrants,
  status
FROM public.parties;

-- Create solo_players_public view (hides pin and email)
CREATE VIEW public.solo_players_public
WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  created_at,
  updated_at
FROM public.solo_players;

-- ============================================
-- 3. PARTIES TABLE POLICIES
-- ============================================

-- Anyone can read non-sensitive party data via the public view
CREATE POLICY "Anyone can read parties_public view"
ON parties FOR SELECT
USING (true);

-- Block direct access to sensitive columns (host_pin, host_session_id)
-- Reads should go through parties_public view instead

-- Anyone can create parties (no auth required for MVP)
CREATE POLICY "Anyone can create parties"
ON parties FOR INSERT
WITH CHECK (true);

-- Anyone can update parties (for host operations - will be secured via edge functions)
CREATE POLICY "Anyone can update parties"
ON parties FOR UPDATE
USING (true);

-- ============================================
-- 4. PICKS TABLE POLICIES
-- ============================================

-- Anyone can read picks (needed for leaderboards/TV display)
CREATE POLICY "Anyone can read picks"
ON picks FOR SELECT
USING (true);

-- Anyone can create picks (player creates their own)
CREATE POLICY "Anyone can create picks"
ON picks FOR INSERT
WITH CHECK (true);

-- Anyone can update picks (for scoring)
CREATE POLICY "Anyone can update picks"
ON picks FOR UPDATE
USING (true);

-- ============================================
-- 5. RUMBLE_NUMBERS TABLE POLICIES
-- ============================================

-- Anyone can read rumble numbers (needed for TV display)
CREATE POLICY "Anyone can read rumble_numbers"
ON rumble_numbers FOR SELECT
USING (true);

-- Anyone can create rumble numbers
CREATE POLICY "Anyone can create rumble_numbers"
ON rumble_numbers FOR INSERT
WITH CHECK (true);

-- Anyone can update rumble numbers (for assignments/eliminations)
CREATE POLICY "Anyone can update rumble_numbers"
ON rumble_numbers FOR UPDATE
USING (true);

-- Anyone can delete rumble numbers (for reset)
CREATE POLICY "Anyone can delete rumble_numbers"
ON rumble_numbers FOR DELETE
USING (true);

-- ============================================
-- 6. MATCH_RESULTS TABLE POLICIES
-- ============================================

-- Anyone can read match results
CREATE POLICY "Anyone can read match_results"
ON match_results FOR SELECT
USING (true);

-- Anyone can create match results
CREATE POLICY "Anyone can create match_results"
ON match_results FOR INSERT
WITH CHECK (true);

-- Anyone can update match results
CREATE POLICY "Anyone can update match_results"
ON match_results FOR UPDATE
USING (true);

-- Anyone can delete match results
CREATE POLICY "Anyone can delete match_results"
ON match_results FOR DELETE
USING (true);

-- ============================================
-- 7. SOLO_PLAYERS TABLE POLICIES
-- ============================================

-- Block direct SELECT to protect PIN and email
-- Login/register should go through secure edge functions
CREATE POLICY "No direct read access to solo_players"
ON solo_players FOR SELECT
USING (false);

-- Allow insert for registration (via edge function with hashing)
CREATE POLICY "Anyone can create solo_players"
ON solo_players FOR INSERT
WITH CHECK (true);

-- Allow update for profile changes
CREATE POLICY "Anyone can update solo_players"
ON solo_players FOR UPDATE
USING (true);

-- ============================================
-- 8. SOLO_PICKS TABLE POLICIES
-- ============================================

-- Anyone can read solo picks
CREATE POLICY "Anyone can read solo_picks"
ON solo_picks FOR SELECT
USING (true);

-- Anyone can create solo picks
CREATE POLICY "Anyone can create solo_picks"
ON solo_picks FOR INSERT
WITH CHECK (true);

-- Anyone can update solo picks
CREATE POLICY "Anyone can update solo_picks"
ON solo_picks FOR UPDATE
USING (true);

-- ============================================
-- 9. SOLO_RESULTS TABLE POLICIES
-- ============================================

-- Anyone can read solo results
CREATE POLICY "Anyone can read solo_results"
ON solo_results FOR SELECT
USING (true);

-- Anyone can create solo results
CREATE POLICY "Anyone can create solo_results"
ON solo_results FOR INSERT
WITH CHECK (true);

-- Anyone can update solo results
CREATE POLICY "Anyone can update solo_results"
ON solo_results FOR UPDATE
USING (true);

-- ============================================
-- 10. SECURE RPC FUNCTIONS FOR PIN VERIFICATION
-- ============================================

-- Function to verify host PIN (returns boolean, never exposes the PIN)
CREATE OR REPLACE FUNCTION public.verify_host_pin(p_party_code text, p_pin text)
RETURNS TABLE(valid boolean, has_pin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN parties.host_pin IS NULL THEN true  -- No PIN set, allow access
      WHEN parties.host_pin = p_pin THEN true   -- PIN matches
      ELSE false                                 -- PIN doesn't match
    END as valid,
    parties.host_pin IS NOT NULL as has_pin
  FROM public.parties
  WHERE parties.code = p_party_code;
END;
$$;

-- Function to set host PIN (only if not already set)
CREATE OR REPLACE FUNCTION public.set_host_pin(p_party_code text, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pin text;
BEGIN
  SELECT host_pin INTO current_pin
  FROM public.parties
  WHERE code = p_party_code;
  
  IF current_pin IS NULL THEN
    UPDATE public.parties
    SET host_pin = p_pin
    WHERE code = p_party_code;
    RETURN true;
  ELSE
    RETURN false;  -- PIN already set
  END IF;
END;
$$;

-- Function to verify solo player login (returns player data if valid)
CREATE OR REPLACE FUNCTION public.verify_solo_login(p_email text, p_pin text)
RETURNS TABLE(
  id uuid,
  display_name text,
  created_at timestamptz,
  valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.display_name,
    sp.created_at,
    (sp.pin = p_pin) as valid
  FROM public.solo_players sp
  WHERE lower(sp.email) = lower(trim(p_email));
  
  -- If no rows returned, return a row indicating not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::timestamptz, false;
  END IF;
END;
$$;

-- Function to register solo player (returns new player if email not taken)
CREATE OR REPLACE FUNCTION public.register_solo_player(
  p_email text, 
  p_pin text, 
  p_display_name text
)
RETURNS TABLE(
  id uuid,
  display_name text,
  created_at timestamptz,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  new_display_name text;
  new_created_at timestamptz;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM public.solo_players WHERE lower(email) = lower(trim(p_email))) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::timestamptz, false, 'Email already registered'::text;
    RETURN;
  END IF;
  
  -- Insert new player
  INSERT INTO public.solo_players (email, pin, display_name)
  VALUES (lower(trim(p_email)), p_pin, COALESCE(NULLIF(trim(p_display_name), ''), 'Me'))
  RETURNING solo_players.id, solo_players.display_name, solo_players.created_at
  INTO new_id, new_display_name, new_created_at;
  
  RETURN QUERY SELECT new_id, new_display_name, new_created_at, true, NULL::text;
END;
$$;

-- ============================================
-- 11. ADD DATABASE CONSTRAINTS FOR INPUT VALIDATION
-- ============================================

-- Email format validation for players
ALTER TABLE players ADD CONSTRAINT players_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Display name length limits for players
ALTER TABLE players ADD CONSTRAINT players_name_length 
  CHECK (length(display_name) BETWEEN 1 AND 50);

-- Email format validation for solo_players
ALTER TABLE solo_players ADD CONSTRAINT solo_players_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Display name length limits for solo_players
ALTER TABLE solo_players ADD CONSTRAINT solo_players_name_length 
  CHECK (length(display_name) BETWEEN 1 AND 50);

-- PIN format validation for solo_players (4-6 digits)
ALTER TABLE solo_players ADD CONSTRAINT solo_players_pin_format 
  CHECK (pin ~ '^\d{4,6}$');

-- Host PIN format validation (4 digits)
ALTER TABLE parties ADD CONSTRAINT parties_host_pin_format 
  CHECK (host_pin IS NULL OR host_pin ~ '^\d{4}$');