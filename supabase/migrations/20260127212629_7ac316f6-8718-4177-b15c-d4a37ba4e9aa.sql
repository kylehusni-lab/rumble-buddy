-- Create table for solo mode players
CREATE TABLE public.solo_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  pin TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create table for solo mode picks
CREATE TABLE public.solo_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_player_id UUID NOT NULL REFERENCES public.solo_players(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  prediction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(solo_player_id, match_id)
);

-- Create table for solo mode results (scored by the player themselves)
CREATE TABLE public.solo_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_player_id UUID NOT NULL REFERENCES public.solo_players(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  result TEXT NOT NULL,
  scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(solo_player_id, match_id)
);

-- Enable realtime for auto-sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_picks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_results;

-- RLS is disabled for MVP (matching party mode approach)
-- These tables don't contain sensitive data beyond email