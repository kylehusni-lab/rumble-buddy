-- Drop the PIN format check constraint since we're now using password auth
-- PINs are no longer required for solo players

ALTER TABLE public.solo_players DROP CONSTRAINT IF EXISTS solo_players_pin_format;