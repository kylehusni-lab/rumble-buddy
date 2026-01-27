-- Create platform_config table for global settings
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Read-only policy for everyone
CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_config;

-- Seed initial data
INSERT INTO public.platform_config (key, value) VALUES 
  ('mens_rumble_entrants', '["Roman Reigns", "Cody Rhodes", "Gunther", "Jey Uso", "Solo Sikoa", "Jacob Fatu", "Rey Mysterio", "Dragon Lee", "Penta", "CM Punk", "Drew McIntyre", "Randy Orton", "Trick Williams", "Surprise/Other Entrant"]'),
  ('womens_rumble_entrants', '["Liv Morgan", "Rhea Ripley", "IYO SKY", "Charlotte Flair", "Bayley", "Asuka", "Giulia", "Jordynne Grace", "Alexa Bliss", "Nia Jax", "Roxanne Perez", "Raquel Rodriguez", "Lyra Valkyria", "Lash Legend", "Chelsea Green", "Surprise/Other Entrant"]')
ON CONFLICT (key) DO NOTHING;