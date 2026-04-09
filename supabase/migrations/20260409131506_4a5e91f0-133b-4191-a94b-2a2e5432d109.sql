ALTER TABLE public.event_matches
  ADD COLUMN is_title_match boolean NOT NULL DEFAULT false,
  ADD COLUMN championship_name text DEFAULT NULL;