// Session management utilities
// Now integrates with Supabase Auth for proper user identity

import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = 'rumble_session_id';
const PLAYER_KEY = 'rumble_player_data';

export interface PlayerSession {
  sessionId: string; // Legacy - kept for backward compatibility
  authUserId?: string; // New - Supabase auth user ID
  playerId?: string;
  partyCode?: string;
  displayName?: string;
  email?: string;
  isHost?: boolean;
  isSolo?: boolean;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Legacy function - kept for backward compatibility during migration
export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Get current auth user ID from Supabase session
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function getPlayerSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(PLAYER_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as PlayerSession;
  } catch {
    return null;
  }
}

export function setPlayerSession(session: PlayerSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYER_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, session.sessionId);
}

export function clearPlayerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAYER_KEY);
}

export function isHostSession(partyHostSessionId: string): boolean {
  return getSessionId() === partyHostSessionId;
}
