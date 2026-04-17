ALTER TABLE public.wrestlers
ADD COLUMN IF NOT EXISTS image_position TEXT NOT NULL DEFAULT 'center center';