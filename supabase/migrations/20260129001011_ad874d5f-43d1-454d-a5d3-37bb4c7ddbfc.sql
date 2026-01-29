-- Ensure party status updates are actually permitted under RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'parties'
      AND policyname = 'Anyone can update parties'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can update parties" ON public.parties';
  END IF;
END$$;

CREATE POLICY "Anyone can update parties"
ON public.parties
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
