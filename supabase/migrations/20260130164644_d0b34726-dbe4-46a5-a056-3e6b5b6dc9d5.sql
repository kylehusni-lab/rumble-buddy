-- Security Hardening Migration: Remove Legacy PIN System
-- Part A: Create new secure function for party status updates
CREATE OR REPLACE FUNCTION public.update_party_status_by_host(
  p_party_code text,
  p_status text,
  p_event_started_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is the host (verified via auth.uid())
  IF NOT is_party_host(p_party_code) THEN
    RETURN false;
  END IF;
  
  UPDATE public.parties
  SET 
    status = p_status,
    event_started_at = COALESCE(p_event_started_at, event_started_at)
  WHERE code = p_party_code;
  
  RETURN true;
END;
$$;

-- Part B: Drop legacy PIN-based functions
DROP FUNCTION IF EXISTS public.verify_host_pin(text, text);
DROP FUNCTION IF EXISTS public.set_host_pin(text, text);
DROP FUNCTION IF EXISTS public.update_party_status_with_pin(text, text, text, timestamptz);

-- Part C: Drop legacy solo player PIN functions
DROP FUNCTION IF EXISTS public.verify_solo_login(text, text);
DROP FUNCTION IF EXISTS public.register_solo_player(text, text, text);

-- Part D: Remove host_pin column from parties table
ALTER TABLE public.parties DROP COLUMN IF EXISTS host_pin;

-- Part E: Make solo_players.pin column nullable (keep for legacy data)
ALTER TABLE public.solo_players ALTER COLUMN pin DROP NOT NULL;

-- Part F: Recreate parties_public view without any PIN references
DROP VIEW IF EXISTS public.parties_public;
CREATE VIEW public.parties_public AS
SELECT code, created_at, event_started_at, mens_rumble_entrants, status, womens_rumble_entrants, is_demo
FROM public.parties;
GRANT SELECT ON public.parties_public TO anon, authenticated;