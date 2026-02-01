
# Multi-Event Platform with Demo Mode Preserved for Royal Rumble

## Overview

Transform the app into a multi-event platform for WrestleMania 41 and future PLEs, while **keeping Demo Mode permanently tied to the Royal Rumble configuration** to showcase the full feature set.

---

## Why Keep Demo on Royal Rumble?

Demo Mode showcases the app's most impressive features:
- 30-entry number distribution with dramatic reveal
- Real-time elimination tracking with +5 score popups
- Iron Man / Final Four bonus calculations
- Complete guided tour explaining Rumble mechanics

WrestleMania matches don't have these features, so Demo stays on Royal Rumble to give users the best first impression.

---

## Architecture Design

```text
src/lib/events/
  types.ts              # Event type definitions
  index.ts              # Event registry + getActiveEvent()
  rumble-2026.ts        # Royal Rumble config (used by Demo)
  mania-41.ts           # WrestleMania 41 (active event)
  
src/lib/
  constants.ts          # Re-exports active event config
  demo-seeder.ts        # Updated: imports from rumble-2026 directly
```

---

## Technical Implementation

### Phase 1: Event Type System

**New file: `src/lib/events/types.ts`**

```typescript
export type EventType = 'rumble' | 'mania' | 'standard_ple';

export interface EventNight {
  id: string;
  label: string;
  date: Date;
}

export interface MatchConfig {
  id: string;
  title: string;
  options: string[];
  matchType?: 'singles' | 'tag' | 'rumble' | 'ladder' | 'other';
}

export interface PropConfig {
  id: string;
  title: string;
  question: string;
  shortName: string;
  category: 'chaos' | 'rumble' | 'general';
}

export interface ScoringConfig {
  matchWinner: number;
  propBet: number;
  rumbleWinner?: number;
  rumbleNumber?: number;
  elimination?: number;
  // ... etc
}

export interface EventConfig {
  id: string;
  title: string;
  type: EventType;
  nights: EventNight[];
  venue: string;
  location: string;
  matches: MatchConfig[];
  props: PropConfig[];
  scoring: ScoringConfig;
  // Rumble-specific (optional)
  mensEntrants?: string[];
  womensEntrants?: string[];
  rumbleProps?: PropConfig[];
  chaosProps?: PropConfig[];
}
```

### Phase 2: Royal Rumble Configuration (Preserved)

**New file: `src/lib/events/rumble-2026.ts`**

Move all current Royal Rumble configuration here:
- `EVENT_CONFIG` (date, venue, location)
- `UNDERCARD_MATCHES`
- `CHAOS_PROPS`
- `RUMBLE_PROPS`
- `DEFAULT_MENS_ENTRANTS` / `DEFAULT_WOMENS_ENTRANTS`
- `SCORING` values
- `CARD_CONFIG` for pick flow
- All `MATCH_IDS`

This file becomes the **source of truth for Royal Rumble** and is imported by Demo Mode.

### Phase 3: WrestleMania 41 Configuration

**New file: `src/lib/events/mania-41.ts`**

```typescript
export const MANIA_41_CONFIG: EventConfig = {
  id: 'mania_41',
  title: 'WrestleMania 41',
  type: 'mania',
  nights: [
    {
      id: 'night_1',
      label: 'Night 1',
      date: new Date('2026-04-18T19:00:00-04:00'), // 7pm ET
    },
    {
      id: 'night_2',
      label: 'Night 2', 
      date: new Date('2026-04-19T19:00:00-04:00'), // 7pm ET
    }
  ],
  venue: 'Allegiant Stadium',
  location: 'Las Vegas, Nevada',
  matches: [
    // Placeholder matches - to be updated as card is announced
    { id: 'mania_match_1', title: 'Match 1 (TBD)', options: ['TBD', 'TBD'] },
    { id: 'mania_match_2', title: 'Match 2 (TBD)', options: ['TBD', 'TBD'] },
    // ... more as announced
  ],
  props: [
    { id: 'mania_prop_1', title: 'Main Event Length', question: 'Main event runs over 30 minutes?', shortName: 'Main Event O/U', category: 'general' },
    { id: 'mania_prop_2', title: 'Title Changes', question: 'More than 3 title changes across both nights?', shortName: 'Title Changes O/U', category: 'general' },
    { id: 'mania_prop_3', title: 'Surprise Return', question: 'A legend or surprise return happens?', shortName: 'Surprise Return', category: 'general' },
    { id: 'mania_prop_4', title: 'Celebrity Appearance', question: 'A celebrity appears in a match?', shortName: 'Celebrity', category: 'general' },
  ],
  scoring: {
    matchWinner: 25,
    propBet: 10,
  }
};
```

### Phase 4: Event Registry

**New file: `src/lib/events/index.ts`**

```typescript
import { EventConfig } from './types';
import { RUMBLE_2026_CONFIG } from './rumble-2026';
import { MANIA_41_CONFIG } from './mania-41';

// All available events
export const EVENT_REGISTRY: Record<string, EventConfig> = {
  'rumble_2026': RUMBLE_2026_CONFIG,
  'mania_41': MANIA_41_CONFIG,
};

// Current active event (can be database-driven in future)
const ACTIVE_EVENT_ID = 'mania_41';

export function getActiveEvent(): EventConfig {
  return EVENT_REGISTRY[ACTIVE_EVENT_ID];
}

export function getEventById(id: string): EventConfig | undefined {
  return EVENT_REGISTRY[id];
}

// For Demo Mode - always returns Royal Rumble
export function getDemoEvent(): EventConfig {
  return RUMBLE_2026_CONFIG;
}

export { RUMBLE_2026_CONFIG, MANIA_41_CONFIG };
```

### Phase 5: Update Demo Seeder

**Update: `src/lib/demo-seeder.ts`**

```typescript
// Change import from constants to rumble-2026 directly
import { RUMBLE_2026_CONFIG } from './events/rumble-2026';

// Use Rumble-specific matches and props for demo picks
const { matches, chaosProps } = RUMBLE_2026_CONFIG;
```

This ensures Demo Mode **always generates Rumble-style picks** regardless of the active event.

### Phase 6: Update Constants for Active Event

**Update: `src/lib/constants.ts`**

```typescript
import { getActiveEvent } from './events';

const activeEvent = getActiveEvent();

// Dynamic exports based on active event
export const EVENT_CONFIG = {
  DATE: activeEvent.nights[0].date,
  DATES: activeEvent.nights.map(n => n.date),
  VENUE: activeEvent.venue,
  LOCATION: activeEvent.location,
  TITLE: activeEvent.title,
  TYPE: activeEvent.type,
  NIGHTS: activeEvent.nights,
  IS_MULTI_NIGHT: activeEvent.nights.length > 1,
};

export const UNDERCARD_MATCHES = activeEvent.matches;
export const CHAOS_PROPS = activeEvent.props.filter(p => p.category === 'chaos');
// ... etc

// Keep static exports for backward compatibility where needed
export { SCORING, MATCH_IDS } from './events/rumble-2026';
```

### Phase 7: UI Updates

**Update: `src/components/home/HeroSection.tsx`**

- Show "April 18-19, 2026" date range for multi-night events
- Countdown to Night 1, then switch to Night 2 after Night 1 passes
- Display "Night 1" / "Night 2" labels

**Update: `src/pages/Index.tsx`**

- Event-aware title and branding
- Multi-night support in countdown

**Update: Pick Flow Components**

- Generate card config dynamically from event type
- Skip Rumble-specific cards (Winner, Entry Props) for non-Rumble events
- WrestleMania uses simpler match-only card flow

### Phase 8: Conditional Rumble Features

Add event type checks to disable Rumble-specific features for WrestleMania:

| Feature | Rumble | WrestleMania |
|---------|--------|--------------|
| Entry Number Distribution | Yes | No |
| Elimination Tracking | Yes | No |
| +5 Score Popups | Yes | No |
| Iron Man / Final Four | Yes | No |
| 30-Number Grid | Yes | No |
| Match Winner Picks | Yes | Yes |
| Prop Bets | Rumble-style | Mania-style |

**Files to update with conditional logic:**
- `src/pages/HostSetup.tsx` - Skip number distribution for non-Rumble
- `src/pages/HostControl.tsx` - Hide Rumble tabs for non-Rumble
- `src/pages/TvDisplay.tsx` - Simplified view for non-Rumble
- `src/components/dashboard/*` - Event-aware rendering

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/lib/events/types.ts` | TypeScript interfaces |
| `src/lib/events/index.ts` | Event registry with `getDemoEvent()` |
| `src/lib/events/rumble-2026.ts` | Preserved Royal Rumble config |
| `src/lib/events/mania-41.ts` | WrestleMania 41 config |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/constants.ts` | Dynamic exports from active event |
| `src/lib/demo-seeder.ts` | Import from rumble-2026 directly |
| `src/components/home/HeroSection.tsx` | Multi-night countdown |
| `src/pages/Index.tsx` | Event-aware branding |
| `src/pages/HostSetup.tsx` | Conditional Rumble features |
| `src/pages/HostControl.tsx` | Event type checks |
| `src/pages/TvDisplay.tsx` | Conditional views |
| Pick flow components | Dynamic card generation |

### Unchanged
| File | Reason |
|------|--------|
| `src/pages/DemoMode.tsx` | Still creates demo party normally |
| `src/lib/demo-tour-steps.ts` | Tour content stays Rumble-focused |
| Database schema | Existing tables work for all events |

---

## Implementation Order

1. Create event type definitions
2. Build Royal Rumble config (migrate from constants.ts)
3. Build WrestleMania 41 config
4. Create event registry with `getDemoEvent()`
5. Update demo-seeder to use rumble-2026 directly
6. Update constants.ts to use active event
7. Update HeroSection for multi-night countdown
8. Add conditional rendering for Rumble-specific features
9. Test Demo Mode still works with full Rumble experience
10. Test WrestleMania flow works without Rumble features
