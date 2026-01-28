
# Fix Demo Mode - RLS Policy Conflict

## Problem
Demo mode fails with a 401 error when creating players because:
1. The `players` table has an INSERT policy that allows inserts ✓
2. BUT the SELECT policy has `qual: false` blocking ALL reads ✗
3. The demo seeder uses `.select("id")` after insert, which triggers a read operation
4. This read operation is blocked by RLS, causing the entire request to fail

## Solution
Use the existing `lookup_player_by_email` database function (SECURITY DEFINER) to retrieve player IDs after insert instead of using `.select()`.

## File to Modify

| File | Changes |
|------|---------|
| `src/lib/demo-seeder.ts` | Remove `.select()` from inserts, use `lookup_player_by_email` to get IDs |

## Technical Changes

### `src/lib/demo-seeder.ts`

**Before (lines 134-145):**
```typescript
const { data: hostPlayer, error: hostError } = await supabase
  .from("players")
  .insert({...})
  .select("id")
  .single();
```

**After:**
```typescript
// Insert without .select()
const { error: hostError } = await supabase
  .from("players")
  .insert({
    party_code: partyCode,
    email: "kyle.husni@gmail.com",
    display_name: "Kyle",
    session_id: hostSessionId,
  });

if (hostError) throw hostError;

// Use lookup function to get ID
const { data: hostLookup, error: lookupError } = await supabase
  .rpc('lookup_player_by_email', {
    p_party_code: partyCode,
    p_email: "kyle.husni@gmail.com"
  });

if (lookupError || !hostLookup?.[0]) throw lookupError || new Error("Failed to lookup host player");
const hostPlayerId = hostLookup[0].id;
```

**For guests (lines 155-160):**
```typescript
// Insert all guests without .select()
const { error: guestsError } = await supabase
  .from("players")
  .insert(guestInserts);

if (guestsError) throw guestsError;

// Lookup each guest by email to get IDs
const guestIds: string[] = [];
for (const guest of DEMO_GUESTS) {
  const { data: guestLookup } = await supabase
    .rpc('lookup_player_by_email', {
      p_party_code: partyCode,
      p_email: guest.email
    });
  if (guestLookup?.[0]?.id) {
    guestIds.push(guestLookup[0].id);
  }
}
```

## Result
- Demo mode will successfully create all 6 players (Kyle + 5 guests)
- Player IDs retrieved via secure database function instead of blocked SELECT
- All 222 picks generated correctly for the demo party
