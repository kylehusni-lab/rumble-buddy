
# Fix: TV Display Infinite Reload Loop

## Problem Identified

The `useEffect` hook in `TvDisplay.tsx` (line 72-333) has problematic dependencies that cause an infinite loop:

```typescript
}, [code, players, partyStatus, mensNumbers, womensNumbers]);
```

**What happens:**
1. `useEffect` runs, sets up realtime subscriptions
2. Realtime callback fires (e.g., player update)
3. Callback updates state: `setPlayers(data)` 
4. `players` is a dependency, so `useEffect` re-runs
5. Effect cleanup removes the subscription
6. Effect runs again, re-fetches ALL data including picks
7. New subscription set up, fires again
8. Infinite loop → constant loading/resetting

---

## Solution

Split the `useEffect` into two separate effects:

### Effect 1: Initial Data Fetch (runs once)
- Fetch party status, players, numbers, picks, match results
- Dependencies: `[code]` only

### Effect 2: Realtime Subscriptions (stable reference)
- Set up all realtime channels
- Use refs to access current state values in callbacks
- Dependencies: `[code]` only (or stable function refs)

---

## Technical Changes

### File: `src/pages/TvDisplay.tsx`

**Current problematic code (lines 72-333):**

Single massive `useEffect` with state dependencies that cause re-runs.

**Fixed approach:**

```typescript
// Refs to hold current state for use in callbacks
const playersRef = useRef<Player[]>([]);
const mensNumbersRef = useRef<RumbleNumber[]>([]);
const womensNumbersRef = useRef<RumbleNumber[]>([]);
const partyStatusRef = useRef<string>("pre_event");

// Keep refs in sync with state
useEffect(() => {
  playersRef.current = players;
}, [players]);

useEffect(() => {
  mensNumbersRef.current = mensNumbers;
}, [mensNumbers]);

useEffect(() => {
  womensNumbersRef.current = womensNumbers;
}, [womensNumbers]);

useEffect(() => {
  partyStatusRef.current = partyStatus;
}, [partyStatus]);

// Effect 1: Initial data fetch (runs once per code change)
useEffect(() => {
  if (!code) return;

  const fetchData = async () => {
    // ... fetch party, players, numbers, picks, results
  };

  fetchData();
}, [code]); // Only re-run when party code changes

// Effect 2: Realtime subscriptions (stable, no state deps)
useEffect(() => {
  if (!code) return;

  // Helper functions that read from refs, not state
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return "Vacant";
    const player = playersRef.current.find(p => p.id === playerId);
    return player?.display_name || "Unknown";
  };

  const checkForFinalFour = (numbers: RumbleNumber[], type: "mens" | "womens") => {
    // Uses shownCelebrations ref (already exists)
    // ...
  };

  const channel = supabase
    .channel(`tv-display-${code}`)
    .on("postgres_changes", { ... }, (payload) => {
      // Update state, but DON'T trigger effect re-run
      setPlayers(data);
    })
    // ... other subscriptions
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [code]); // Only code as dependency
```

---

## Changes Summary

| Location | Change |
|----------|--------|
| Lines 50-66 | Add refs for players, mensNumbers, womensNumbers, partyStatus |
| Lines 67-80 | Add 4 small useEffect hooks to sync refs with state |
| Lines 72-118 | Extract initial fetch into separate useEffect with `[code]` only |
| Lines 120-333 | Keep realtime subscriptions in separate useEffect with `[code]` only |
| Line 178-182 | Update `getPlayerName` to use `playersRef.current` |
| Line 184-203 | Update `checkForFinalFour` to use refs |
| Lines 277-291 | Update winner celebration to use refs |

---

## Root Cause Fix

The key insight is that realtime callbacks should:
- ✅ Update state (triggers re-render)
- ❌ NOT cause the subscription effect to re-run

By using refs to access current state values inside callbacks, we break the dependency cycle while still having access to up-to-date data.

---

## Testing Checklist

After fix:
- [ ] TV Display loads once without constant reloading
- [ ] Picks panel shows data and stays stable
- [ ] Realtime updates still work (player joins, match results)
- [ ] Celebrations still trigger correctly
- [ ] Navigation between views still works

