

# Fix Score Popup Showing Wrong Player Name

## Problem Identified

The "+5" score popup is showing the wrong player name when eliminations occur on the TV display. This is caused by a **stale data race condition** in the realtime callback.

### Root Cause

When an elimination event fires via realtime:
1. The code receives `eliminated_by_number` (the entry number of the wrestler who did the elimination)
2. It looks up the eliminator in `mensNumbersRef.current` or `womensNumbersRef.current`
3. **Problem**: These refs may contain stale `assigned_to_player_id` mappings from initial load or previous polls
4. The numbers are only refreshed AFTER the popup is triggered (lines 387-395), so the popup uses outdated data

### Why Wrong Name Appears

If the refs haven't been updated since the TV display loaded, the `assigned_to_player_id` for a given entry number might be outdated or missing, causing the lookup to find the wrong player (or no player at all, and silently fail).

## Solution

Fetch fresh eliminator data directly when the elimination event occurs, rather than relying on potentially stale refs.

### Technical Changes

**File: `src/pages/TvDisplay.tsx`**

Update the elimination handling in the realtime subscription (around lines 370-385):

```typescript
// Current buggy code:
if (updated.eliminated_by_number) {
  const numbersToCheck = updated.rumble_type === "mens" ? mensNumbersRef.current : womensNumbersRef.current;
  const eliminator = numbersToCheck.find(n => n.number === updated.eliminated_by_number);
  if (eliminator?.assigned_to_player_id) {
    const eliminatorOwner = playersRef.current.find(p => p.id === eliminator.assigned_to_player_id);
    if (eliminatorOwner) {
      addScoreEventRef.current(5, eliminatorOwner.display_name);
    }
  }
}

// Fixed code - fetch fresh data for the eliminator:
if (updated.eliminated_by_number) {
  // Fetch fresh eliminator data to avoid stale ref issues
  const { data: eliminatorData } = await supabase
    .from("rumble_numbers")
    .select("assigned_to_player_id")
    .eq("party_code", code)
    .eq("rumble_type", updated.rumble_type)
    .eq("number", updated.eliminated_by_number)
    .single();
  
  if (eliminatorData?.assigned_to_player_id) {
    // Fetch the player name to ensure accuracy
    const { data: playerData } = await supabase
      .from("players_public")
      .select("display_name")
      .eq("id", eliminatorData.assigned_to_player_id)
      .single();
    
    if (playerData?.display_name) {
      addScoreEventRef.current(5, playerData.display_name);
    }
  }
}
```

### Key Changes

1. **Fetch fresh eliminator data**: Query the database directly for the eliminator's `assigned_to_player_id` instead of using stale refs
2. **Fetch fresh player name**: Query `players_public` for the correct display name
3. **Make callback async**: The realtime callback needs to be async to await the queries

### Benefits

- Eliminates the stale data race condition
- Always shows the correct player who earned the +5 elimination points
- Minimal performance impact (two small single-row queries per elimination)

