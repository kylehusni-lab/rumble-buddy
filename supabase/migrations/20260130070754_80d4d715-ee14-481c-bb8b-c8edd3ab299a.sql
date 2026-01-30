-- Drop the old 4-digit only constraint
ALTER TABLE public.parties DROP CONSTRAINT parties_code_check;

-- Add new constraint that allows both old 4-digit codes AND new 6-char alphanumeric codes
ALTER TABLE public.parties ADD CONSTRAINT parties_code_check 
  CHECK (code ~ '^[A-Z0-9]{4,6}$');