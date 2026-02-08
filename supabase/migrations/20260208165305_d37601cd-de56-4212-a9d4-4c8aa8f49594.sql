-- Create events table for dynamic event configuration
CREATE TABLE public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('rumble', 'mania', 'standard_ple')),
  venue text,
  location text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  nights jsonb NOT NULL DEFAULT '[]'::jsonb,
  scoring jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create event_matches table
CREATE TABLE public.event_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  title text NOT NULL,
  match_type text NOT NULL DEFAULT 'singles' CHECK (match_type IN ('singles', 'tag', 'triple_threat', 'fatal_four', 'ladder', 'rumble', 'battle_royal', 'other')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  night text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, match_id)
);

-- Create event_props table
CREATE TABLE public.event_props (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prop_id text NOT NULL,
  title text NOT NULL,
  question text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('chaos', 'rumble', 'general')),
  prop_type text NOT NULL DEFAULT 'yesno' CHECK (prop_type IN ('yesno', 'wrestler', 'custom')),
  options jsonb DEFAULT NULL,
  gender text CHECK (gender IN ('mens', 'womens') OR gender IS NULL),
  night text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, prop_id)
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_props ENABLE ROW LEVEL SECURITY;

-- Events policies: Anyone can read, only admins can modify
CREATE POLICY "Anyone can read events"
ON public.events FOR SELECT
USING (true);

CREATE POLICY "Admins can insert events"
ON public.events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Event matches policies
CREATE POLICY "Anyone can read event matches"
ON public.event_matches FOR SELECT
USING (true);

CREATE POLICY "Admins can insert event matches"
ON public.event_matches FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event matches"
ON public.event_matches FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event matches"
ON public.event_matches FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Event props policies
CREATE POLICY "Anyone can read event props"
ON public.event_props FOR SELECT
USING (true);

CREATE POLICY "Admins can insert event props"
ON public.event_props FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event props"
ON public.event_props FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event props"
ON public.event_props FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_matches_updated_at
  BEFORE UPDATE ON public.event_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_props_updated_at
  BEFORE UPDATE ON public.event_props
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();