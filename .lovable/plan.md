
## Plan: Event-Driven Configuration System

### Problem Summary

The Royal Rumble party (code `X629M5`) is displaying WrestleMania 41 matches ("Match 1 TBD", "Match 2 TBD", etc.) because:

1. All dashboard components import match/prop configurations from `@/lib/constants`
2. `constants.ts` uses `getActiveEvent()` which returns the globally active event (`mania_41`)
3. Parties store their own `event_id` in the database, but this is never used to load event-specific config
4. The `parties_public` view does not expose `event_id`, so dashboards cannot access it

### Solution Overview

Create an **event context system** that:
1. Loads the correct `EventConfig` based on the party's `event_id`
2. Provides this config to all dashboard components via React Context
3. Falls back to the global active event for new parties

---

### Part 1: Database - Expose event_id in parties_public View

The `parties_public` view needs to include `event_id` so dashboards can access it without querying the private `parties` table.

**Migration SQL:**
```sql
-- Drop and recreate parties_public view to include event_id
CREATE OR REPLACE VIEW parties_public AS
SELECT 
  code,
  created_at,
  event_started_at,
  is_demo,
  status,
  mens_rumble_entrants,
  womens_rumble_entrants,
  event_id
FROM parties;
```

---

### Part 2: Create Event Context System

Create a React Context that provides event-specific configuration based on the party's `event_id`.

#### New File: `src/contexts/EventContext.tsx`

```text
+----------------------------------+
|  EventProvider                   |
|  - Fetches party event_id        |
|  - Loads EventConfig from        |
|    EVENT_REGISTRY                |
|  - Provides: eventConfig,        |
|    isRumble, matches, props,     |
|    cardConfig, scoring           |
+----------------------------------+
        |
        v
+----------------------------------+
|  useEventConfig() hook           |
|  - Returns typed EventConfig     |
|  - Used by dashboard components  |
+----------------------------------+
```

**Key exports:**
- `EventProvider` - Wraps party/solo dashboard routes
- `useEventConfig()` - Hook to access current event configuration
- Returns: `eventConfig`, `matches`, `cardConfig`, `chaosProps`, `rumbleProps`, `scoring`, `isRumble`, `isLoading`

---

### Part 3: Update Dashboard Components

Update all components that import from `@/lib/constants` to use the new context when inside a party context.

| Component | Current Import | New Approach |
|-----------|----------------|--------------|
| `PlayerDashboard.tsx` | `CARD_CONFIG, CHAOS_PROPS` from constants | Use `useEventConfig()` |
| `UnifiedMatchesTab.tsx` | `CARD_CONFIG, SCORING` from constants | Accept props or use context |
| `UnifiedRumblePropsTab.tsx` | `RUMBLE_PROPS, FINAL_FOUR_SLOTS` from constants | Accept props or use context |
| `UnifiedChaosTab.tsx` | `CHAOS_PROPS, SCORING` from constants | Accept props or use context |
| `HostControl.tsx` | `UNDERCARD_MATCHES, CHAOS_PROPS` from constants | Use `useEventConfig()` |
| `TvDisplay.tsx` | Various constants | Use `useEventConfig()` |

---

### Part 4: Update Route Structure

Wrap party-related routes with `EventProvider`:

```typescript
// App.tsx
<Route path="/party/:code/*" element={
  <EventProvider>
    <PartyRoutes />
  </EventProvider>
} />
```

The provider will:
1. Read `code` from URL params
2. Fetch `event_id` from `parties_public`
3. Load the correct `EventConfig` from `EVENT_REGISTRY`
4. Provide it to all child components

---

### Part 5: Conditional Rumble Features

Components should conditionally render Rumble-specific features based on `eventConfig.type`:

| Feature | Condition |
|---------|-----------|
| Men's/Women's tabs | `isRumble === true` |
| Numbers section | `isRumble === true` |
| Rumble Props | `isRumble === true` |
| Chaos Props | `isRumble === true` (or if event has chaosProps) |
| Multi-night indicators | `eventConfig.nights.length > 1` |

---

### Implementation Files

| File | Action |
|------|--------|
| Database | Add `event_id` to `parties_public` view |
| `src/contexts/EventContext.tsx` | **Create** - Event context provider and hook |
| `src/pages/PlayerDashboard.tsx` | **Update** - Use `useEventConfig()` instead of constants |
| `src/pages/HostControl.tsx` | **Update** - Use `useEventConfig()` instead of constants |
| `src/pages/TvDisplay.tsx` | **Update** - Use `useEventConfig()` instead of constants |
| `src/components/dashboard/UnifiedMatchesTab.tsx` | **Update** - Accept config via props or context |
| `src/components/dashboard/UnifiedRumblePropsTab.tsx` | **Update** - Accept config via props or context |
| `src/components/dashboard/UnifiedChaosTab.tsx` | **Update** - Accept config via props or context |
| `src/components/dashboard/UnifiedTabNavigation.tsx` | **Update** - Conditionally show tabs based on event type |
| `src/App.tsx` | **Update** - Wrap party routes with EventProvider |

---

### Technical Details

**EventContext Interface:**
```typescript
interface EventContextValue {
  eventConfig: EventConfig | null;
  eventId: string;
  isRumble: boolean;
  isMultiNight: boolean;
  matches: MatchConfig[];
  cardConfig: CardConfig[];
  chaosProps: PropConfig[];
  rumbleProps: RumblePropConfig[];
  scoring: ScoringConfig;
  isLoading: boolean;
}
```

**Usage Example:**
```typescript
// In PlayerDashboard.tsx
const { 
  cardConfig, 
  chaosProps, 
  rumbleProps, 
  isRumble, 
  scoring 
} = useEventConfig();

// Only show Rumble tabs if it's a Rumble event
{isRumble && <UnifiedRumblePropsTab ... />}
```

---

### Summary

| Area | Description |
|------|-------------|
| **Root Cause** | Dashboards use global active event config instead of party-specific config |
| **Database** | Expose `event_id` in `parties_public` view |
| **Context** | New `EventProvider` loads correct config based on party's event_id |
| **Components** | Update 10+ components to use context instead of static constants |
| **Conditional UI** | Rumble-specific tabs/features only shown for Rumble events |
