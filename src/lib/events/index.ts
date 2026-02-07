// Event Registry and Active Event Management

import type { EventConfig } from './types';
import { RUMBLE_2026_CONFIG } from './rumble-2026';
import { MANIA_41_CONFIG } from './mania-41';

// Re-export types for convenience
export * from './types';

// All available events in the registry
export const EVENT_REGISTRY: Record<string, EventConfig> = {
  'rumble_2026': RUMBLE_2026_CONFIG,
  'mania_41': MANIA_41_CONFIG,
};

// Current active event ID - change this to switch events
// In the future, this could be database-driven via platform_config
const ACTIVE_EVENT_ID = 'mania_41';

/**
 * Get the currently active event ID
 * This should be used when storing/fetching event-specific data
 */
export function getActiveEventId(): string {
  return ACTIVE_EVENT_ID;
}

/**
 * Get the currently active event configuration
 * This is what the main app uses for live parties
 */
export function getActiveEvent(): EventConfig {
  return EVENT_REGISTRY[ACTIVE_EVENT_ID];
}

/**
 * Get a specific event by ID (for historical lookup or specific loading)
 */
export function getEventById(id: string): EventConfig | undefined {
  return EVENT_REGISTRY[id];
}

/**
 * Get the demo event configuration
 * Always returns Royal Rumble to showcase full feature set
 */
export function getDemoEvent(): EventConfig {
  return RUMBLE_2026_CONFIG;
}

/**
 * Check if the active event is a Rumble-type event
 */
export function isRumbleEvent(event?: EventConfig): boolean {
  const e = event || getActiveEvent();
  return e.type === 'rumble';
}

/**
 * Check if the event is a multi-night event
 */
export function isMultiNightEvent(event?: EventConfig): boolean {
  const e = event || getActiveEvent();
  return e.nights.length > 1;
}

/**
 * Get the estimated end time of an event
 * Assumes 4 hours after the last night's start time
 */
export function getEventEndTime(eventId: string): Date | null {
  const event = EVENT_REGISTRY[eventId];
  if (!event || event.nights.length === 0) return null;
  
  // Get the last night
  const lastNight = event.nights[event.nights.length - 1];
  // Assume 4-hour event duration after start time
  const endTime = new Date(lastNight.date);
  endTime.setHours(endTime.getHours() + 4);
  return endTime;
}

/**
 * Check if an event has expired (ended + buffer hours passed)
 * @param eventId The event ID to check
 * @param hoursBuffer Hours after event end before it's considered expired (default: 5)
 */
export function isEventExpired(eventId: string, hoursBuffer: number = 5): boolean {
  const endTime = getEventEndTime(eventId);
  if (!endTime) return false;
  
  const expiryTime = new Date(endTime);
  expiryTime.setHours(expiryTime.getHours() + hoursBuffer);
  
  return new Date() > expiryTime;
}

// Export individual event configs
export { RUMBLE_2026_CONFIG } from './rumble-2026';
export { MANIA_41_CONFIG } from './mania-41';

// Export Rumble-specific items for Demo Mode and backward compatibility
export {
  RUMBLE_2026_MATCHES,
  RUMBLE_2026_CHAOS_PROPS,
  RUMBLE_2026_PROPS,
  RUMBLE_2026_MENS_ENTRANTS,
  RUMBLE_2026_WOMENS_ENTRANTS,
  RUMBLE_2026_SCORING,
  RUMBLE_2026_MATCH_IDS,
  RUMBLE_2026_CARD_CONFIG,
} from './rumble-2026';
