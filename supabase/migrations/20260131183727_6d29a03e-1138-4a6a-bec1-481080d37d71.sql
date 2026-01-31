-- Add email_sent column to parties table for tracking host communication
ALTER TABLE public.parties 
ADD COLUMN email_sent boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.parties.email_sent IS 
  'Tracks whether the party code has been emailed to the host';