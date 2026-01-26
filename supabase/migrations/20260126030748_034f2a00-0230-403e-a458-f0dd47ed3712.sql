-- Create parties table
CREATE TABLE public.parties (
  code TEXT PRIMARY KEY CHECK (code ~ '^\d{4}$'),
  host_session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pre_event' CHECK (status IN ('pre_event', 'live', 'completed')),
  event_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mens_rumble_entrants JSONB NOT NULL DEFAULT '[]'::jsonb,
  womens_rumble_entrants JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_parties_code ON public.parties(code);
CREATE INDEX idx_parties_status ON public.parties(status);

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code TEXT NOT NULL REFERENCES public.parties(code) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_code, email)
);

CREATE INDEX idx_players_party ON public.players(party_code);
CREATE INDEX idx_players_session ON public.players(session_id);

-- Create picks table
CREATE TABLE public.picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  prediction TEXT NOT NULL,
  points_awarded INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

CREATE INDEX idx_picks_player ON public.picks(player_id);

-- Create rumble_numbers table
CREATE TABLE public.rumble_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code TEXT NOT NULL REFERENCES public.parties(code) ON DELETE CASCADE,
  rumble_type TEXT NOT NULL CHECK (rumble_type IN ('mens', 'womens')),
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 30),
  assigned_to_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  wrestler_name TEXT,
  eliminated_by_number INTEGER CHECK (eliminated_by_number BETWEEN 1 AND 30),
  entry_timestamp TIMESTAMPTZ,
  elimination_timestamp TIMESTAMPTZ,
  UNIQUE(party_code, rumble_type, number)
);

CREATE INDEX idx_rumble_numbers_party ON public.rumble_numbers(party_code, rumble_type);

-- Create match_results table
CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code TEXT NOT NULL REFERENCES public.parties(code) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  result TEXT NOT NULL,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_code, match_id)
);

CREATE INDEX idx_match_results_party ON public.match_results(party_code);

-- Enable Realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.picks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rumble_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;

-- Disable RLS for MVP (no auth required)
ALTER TABLE public.parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rumble_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results DISABLE ROW LEVEL SECURITY;