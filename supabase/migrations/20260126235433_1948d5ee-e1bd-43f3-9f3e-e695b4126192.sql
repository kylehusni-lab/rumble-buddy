-- Add host_pin column for PIN-based authentication
ALTER TABLE public.parties ADD COLUMN host_pin TEXT;