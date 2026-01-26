// Session management utilities

const SESSION_KEY = 'rumble_session_id';
const PLAYER_KEY = 'rumble_player_data';

export interface PlayerSession {
  sessionId: string;
  playerId?: string;
  partyCode?: string;
  displayName?: string;
  email?: string;
  isHost?: boolean;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
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
