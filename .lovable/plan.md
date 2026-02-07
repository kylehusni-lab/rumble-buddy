

## Plan: Remove Rumble Winner Cards for WrestleMania and Add Event-Based Pick History

### Overview
This plan addresses two related improvements:
1. Ensure WrestleMania 41 (and future non-Rumble events) do not show the Men's/Women's Rumble Winner picker cards
2. Add proper event tracking so each user's picks are tied to a specific event, enabling historical data

---

### Part 1: Event-Aware Pick Cards (No Rumble Winners for Mania)

The current WrestleMania 41 card configuration already excludes `rumble-winner` type cards. However, I'll verify the pick flow components properly skip rendering these when the card type isn't present.

**Files to Update:**
- `src/lib/events/mania-41.ts` - Confirm no `rumble-winner` cards are in `MANIA_41_CARD_CONFIG` (already verified - looks correct)
- `src/components/picks/PickCardStack.tsx` - Ensure `rumble-winner` card type handling is conditional (only renders if that card type exists)
- `src/pages/SoloPicks.tsx` - Same conditional rendering check
- `src/lib/pick-validation.ts` - Make Rumble-specific validation conditional on event type
- `src/lib/constants.ts` - Verify `RUMBLE_PROPS` and `FINAL_FOUR_SLOTS` are empty arrays for non-Rumble events

**Current State (Already Correct):**
The `MANIA_41_CARD_CONFIG` uses only:
- `type: 'match'` for the 10 match cards
- `type: 'prop'` for the 3 prop cards

This means the `PickCardStack` will never encounter a `rumble-winner` type for Mania, and the conditionals already handle this gracefully.

---

### Part 2: Add Event ID Tracking to Database

**Goal:** Each pick should be associated with a specific event (e.g., `mania_41`, `rumble_2026`) so users can:
- View their historical picks from past events
- Not have picks from one event conflict with another
- Support recurring events (Rumble 2026, Rumble 2027, etc.)

**Database Changes (Migration):**

1. **Add `event_id` column to `parties` table:**
```sql
ALTER TABLE parties 
ADD COLUMN event_id TEXT NOT NULL DEFAULT 'mania_41';
```

2. **Add `event_id` column to `picks` table:**
```sql
ALTER TABLE picks 
ADD COLUMN event_id TEXT;

-- Update existing picks to have the current event
UPDATE picks SET event_id = 'mania_41' WHERE event_id IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE picks ALTER COLUMN event_id SET NOT NULL;

-- Update unique constraint to include event_id
-- (so same player can have picks for multiple events)
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_player_id_match_id_key;
ALTER TABLE picks ADD CONSTRAINT picks_player_match_event_unique 
  UNIQUE (player_id, match_id, event_id);
```

3. **Add `event_id` column to `solo_picks` table:**
```sql
ALTER TABLE solo_picks 
ADD COLUMN event_id TEXT;

-- Backfill
UPDATE solo_picks SET event_id = 'mania_41' WHERE event_id IS NULL;

-- Make NOT NULL
ALTER TABLE solo_picks ALTER COLUMN event_id SET NOT NULL;

-- Update unique constraint
ALTER TABLE solo_picks DROP CONSTRAINT IF EXISTS solo_picks_solo_player_id_match_id_key;
ALTER TABLE solo_picks ADD CONSTRAINT solo_picks_player_match_event_unique 
  UNIQUE (solo_player_id, match_id, event_id);
```

**Code Changes:**

| File | Change |
|------|--------|
| `src/lib/events/index.ts` | Export `getActiveEventId()` function |
| `src/components/picks/PickCardStack.tsx` | Include `event_id` in pick records when saving |
| `src/pages/SoloPicks.tsx` | Include `event_id` when saving solo picks |
| `src/pages/PlayerPicks.tsx` | Filter existing picks by current event_id |
| `src/hooks/useSoloCloud.ts` | Add event_id to cloud sync logic |
| `src/pages/HostSetup.tsx` | Include event_id when creating party |

---

### Part 3: Updated Save Flow

**When saving picks (Party Mode):**
```typescript
const pickRecords = CARD_CONFIG.map(card => ({
  player_id: playerId,
  match_id: card.id,
  prediction: picks[card.id],
  event_id: getActiveEventId(), // NEW: 'mania_41'
}));
```

**When fetching picks:**
```typescript
const { data: picksData } = await supabase
  .from("picks")
  .select("match_id, prediction")
  .eq("player_id", session.playerId)
  .eq("event_id", getActiveEventId()); // Only fetch for current event
```

---

### Summary of Changes

| Area | Description |
|------|-------------|
| Database | Add `event_id` column to `parties`, `picks`, `solo_picks` tables |
| Constraints | Update unique constraints to allow per-event picks |
| Save Logic | Include `event_id` in all pick insert/upsert operations |
| Fetch Logic | Filter picks by `event_id` when loading |
| Event System | Add `getActiveEventId()` helper for consistency |

---

### Technical Notes

- The default `event_id` will be `'mania_41'` (the current active event)
- When switching to a new event (e.g., Rumble 2027), the `ACTIVE_EVENT_ID` constant in `src/lib/events/index.ts` changes
- Existing picks remain in the database, queryable by their `event_id` for historical views
- The `match_id` format already encodes Rumble-specific picks (e.g., `mens_rumble_winner`) vs Mania picks (e.g., `mania_n1_match_1`), so there's no collision risk even without `event_id`, but adding it makes queries cleaner and future-proofs the system

