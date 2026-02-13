

## Fix: Demo Mode Missing `event_id`

### Problem
The demo seeder correctly uses Royal Rumble config for picks, matches, and chaos props (imported from `rumble-2026.ts`). However, when the demo party is created in `DemoMode.tsx` (line 79), the `event_id` column is **not set**. This means the `EventContext` resolves the party to the current active event (WrestleMania 41) instead of Royal Rumble, causing a mismatch between the seeded picks and the displayed configuration.

### Fix

**File: `src/pages/DemoMode.tsx`** (1 change)
- Add `event_id: 'rumble_2026'` to the party insert on line 79, so the demo party is explicitly tagged as a Royal Rumble event.

```typescript
// Line 79-85 - add event_id
const { error: partyError } = await supabase.from("parties").insert({
  code: demoCode,
  host_session_id: sessionId,
  host_user_id: currentUser.id,
  status: "pre_event",
  is_demo: true,
  event_id: "rumble_2026",  // <-- add this
});
```

This is a one-line fix. Everything else in the demo pipeline (seeder imports, pick generation, wrestler fetching) is already correctly locked to Royal Rumble.

