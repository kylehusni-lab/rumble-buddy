-- Add new columns for unified wrestler management
ALTER TABLE public.wrestlers 
  ADD COLUMN IF NOT EXISTS is_rumble_participant boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT true;

-- Add index for faster participant queries
CREATE INDEX IF NOT EXISTS idx_wrestlers_rumble_participant 
  ON public.wrestlers (is_rumble_participant, division) 
  WHERE is_rumble_participant = true;