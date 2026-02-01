// Active Event Constants
// This file re-exports from the event system for backward compatibility

import { 
  getActiveEvent, 
  isRumbleEvent, 
  isMultiNightEvent,
  RUMBLE_2026_SCORING,
  RUMBLE_2026_MATCH_IDS,
  RUMBLE_2026_CHAOS_PROPS,
  RUMBLE_2026_PROPS,
  RUMBLE_2026_MENS_ENTRANTS,
  RUMBLE_2026_WOMENS_ENTRANTS,
  RUMBLE_2026_CARD_CONFIG,
} from './events';

const activeEvent = getActiveEvent();

// Dynamic EVENT_CONFIG based on active event
export const EVENT_CONFIG = {
  DATE: activeEvent.nights[0].date,
  DATES: activeEvent.nights.map(n => n.date),
  VENUE: activeEvent.venue,
  LOCATION: activeEvent.location,
  TITLE: activeEvent.title,
  TYPE: activeEvent.type,
  NIGHTS: activeEvent.nights,
  IS_MULTI_NIGHT: activeEvent.nights.length > 1,
  IS_RUMBLE: activeEvent.type === 'rumble',
} as const;

// Dynamic exports from active event
export const UNDERCARD_MATCHES = activeEvent.matches;
export const CARD_CONFIG = activeEvent.cardConfig;
export const TOTAL_CARDS = activeEvent.cardConfig.length;
export const TOTAL_PICKS = activeEvent.totalPicks;

// For Rumble events, use Rumble-specific props; for others, use general props
export const CHAOS_PROPS = activeEvent.type === 'rumble' 
  ? RUMBLE_2026_CHAOS_PROPS 
  : activeEvent.props.filter(p => p.category === 'general');

export const RUMBLE_PROPS = activeEvent.type === 'rumble'
  ? RUMBLE_2026_PROPS
  : [];

// Scoring - use event-specific or fall back to Rumble scoring for full set
export const SCORING = activeEvent.scoring;

// Match IDs - use Rumble's for backward compatibility
export const MATCH_IDS = RUMBLE_2026_MATCH_IDS;

// Entrant lists - only used for Rumble events, but kept for Demo Mode compatibility
export const DEFAULT_MENS_ENTRANTS = RUMBLE_2026_MENS_ENTRANTS;
export const DEFAULT_WOMENS_ENTRANTS = RUMBLE_2026_WOMENS_ENTRANTS;

// Final Four slots - Rumble-specific
export const FINAL_FOUR_SLOTS = 4;

// Legacy EVENT_INFO for backward compatibility
export const EVENT_INFO = {
  name: activeEvent.title,
  venue: activeEvent.venue,
  location: activeEvent.location,
  date: activeEvent.nights.length > 1 
    ? `${activeEvent.nights[0].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${activeEvent.nights[1].date.getDate()}, ${activeEvent.nights[0].date.getFullYear()}`
    : activeEvent.nights[0].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
} as const;

// Re-export helper functions
export { isRumbleEvent, isMultiNightEvent, getActiveEvent };
