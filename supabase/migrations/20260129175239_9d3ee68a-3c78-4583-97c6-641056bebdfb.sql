-- Create wrestlers table
CREATE TABLE public.wrestlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  division TEXT NOT NULL CHECK (division IN ('mens', 'womens')),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on name (case-insensitive)
CREATE UNIQUE INDEX idx_wrestlers_name_lower ON wrestlers (LOWER(name));

-- Performance indexes
CREATE INDEX idx_wrestlers_division ON wrestlers(division);
CREATE INDEX idx_wrestlers_active ON wrestlers(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE wrestlers ENABLE ROW LEVEL SECURITY;

-- Anyone can read active wrestlers
CREATE POLICY "Anyone can read wrestlers"
ON wrestlers FOR SELECT
TO authenticated
USING (true);

-- Create storage bucket for wrestler images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('wrestler-images', 'wrestler-images', true, 5242880);

-- RLS for public read access
CREATE POLICY "Public can view wrestler images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wrestler-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated can upload wrestler images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wrestler-images');

CREATE POLICY "Authenticated can update wrestler images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wrestler-images');

CREATE POLICY "Authenticated can delete wrestler images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wrestler-images');