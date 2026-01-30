
# Fix Demo Mode: Points, Final Four Display, and Winner Auto-Declaration

## Problems Identified

### 1. Leaderboard Shows 0 Points
**Root Cause**: The RLS UPDATE policy on `players` table is `auth.uid() = user_id`. Demo players have `user_id = NULL`, so the host cannot update their points even though they're the party host.

**Evidence**: Database shows all 6 players with `points: 0` despite `match_results` containing scored matches.

### 2. Final Four Props Show "Not enough data yet"
**Root Cause**: The `getDerivedPropValues()` function only populates Final Four values when exactly 4 wrestlers are active. Once the winner is declared (1 active), the derived values become null.

**Evidence**: Screenshot shows all 4 Final Four slots saying "Not enough data yet" even though the `mens_final_four` event was recorded in `match_results`.

### 3. Winner Not Auto-Declared on Page Load
**Current Behavior**: Winner modal only appears during live elimination flow inside `handleElimination()`. If you reload the page or miss the modal, there's no way to re-trigger it.

**Expected**: When all 30 entrants are in and exactly 1 is active (not eliminated), automatically show the winner declaration modal.

---

## Solution

### Fix 1: Add Host UPDATE Policy for Players (Database Migration)
Add a new RLS policy allowing hosts to update player records in their party:

```sql
CREATE POLICY "Hosts can update players in their party"
ON public.players FOR UPDATE
TO authenticated
USING (is_party_host(party_code));
```

This uses the existing `is_party_host()` SECURITY DEFINER function to verify the current user owns the party.

### Fix 2: Persist Final Four Detection from Match Results
Modify `getDerivedPropValues()` to check for a recorded `{type}_final_four` result in `match_results` and parse the wrestler names from the active wrestlers at that time.

**Alternative approach**: Store the Final Four wrestler names (not just numbers) when the event is recorded, then use those as derived values.

**Implementation**:
- Update the Final Four event recording to store wrestler names instead of just numbers
- In `getDerivedPropValues()`, check for existing Final Four results and parse them
- Pass `matchResults` to the derivation function so it can detect past Final Four events

### Fix 3: Auto-Detect Winner on Page Load
Add a `useEffect` hook that checks on mount/state change:
- All 30 entries have wrestler names
- Exactly 1 wrestler has no `elimination_timestamp`
- No winner has been declared yet (no `{type}_rumble_winner` in match_results)

If conditions met, open the winner declaration modal.

---

## Technical Details

### Database Changes (Migration)

```sql
-- Add policy for hosts to update player points
CREATE POLICY "Hosts can update players in their party"
ON public.players FOR UPDATE
TO authenticated
USING (is_party_host(party_code));
```

### Code Changes

**File: `src/pages/HostControl.tsx`**

1. **Pass matchResults to getDerivedPropValues**:
```typescript
const getDerivedPropValues = (numbers: RumbleNumber[], type: "mens" | "womens", results: MatchResult[]) => {
  // ... existing code ...
  
  // Check if Final Four was already recorded
  const finalFourResult = results.find(r => r.match_id === `${type}_final_four`);
  if (finalFourResult) {
    // Parse the stored result (format: "#1,#16,#26,#30")
    const numberStrings = finalFourResult.result.split(",");
    const finalFourWrestlers = numberStrings.map(numStr => {
      const num = parseInt(numStr.replace("#", ""));
      return numbers.find(n => n.number === num)?.wrestler_name || null;
    }).filter(Boolean) as string[];
    
    return {
      // ... other props ...
      [`${type}_final_four_1`]: finalFourWrestlers[0] || null,
      [`${type}_final_four_2`]: finalFourWrestlers[1] || null,
      [`${type}_final_four_3`]: finalFourWrestlers[2] || null,
      [`${type}_final_four_4`]: finalFourWrestlers[3] || null,
    };
  }
  
  // Fall back to live detection when exactly 4 active
  // ... existing logic ...
};
```

2. **Add winner auto-detection on page load**:
```typescript
// Auto-detect winner when page loads with completed match
useEffect(() => {
  const checkForUnclaimedWinner = async (type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const entered = numbers.filter(n => n.wrestler_name);
    const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
    const matchId = type === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
    const alreadyDeclared = getMatchResult(matchId);
    
    if (entered.length === 30 && active.length === 1 && !alreadyDeclared && !winnerData) {
      // Calculate Iron Man and trigger winner modal
      const winner = active[0];
      // ... same logic as handleElimination ...
      setWinnerData({ type, number: winner, ironPerson, correctPredictionCount });
    }
  };
  
  checkForUnclaimedWinner("mens");
  checkForUnclaimedWinner("womens");
}, [mensNumbers, womensNumbers, matchResults]);
```

---

## Files to Change

| File | Change |
|------|--------|
| Database Migration | Add "Hosts can update players in their party" policy |
| `src/pages/HostControl.tsx` | Pass matchResults to getDerivedPropValues, add winner auto-detect useEffect |

---

## Testing Checklist

After implementation:
1. Create a new demo party and start the event
2. Score an undercard match - verify points update on leaderboard
3. Simulate a full rumble with Final Four reached
4. Reload the page when exactly 4 wrestlers remain - verify Final Four props show the wrestlers
5. Eliminate down to 1 wrestler, reload the page - verify winner modal appears
6. Confirm winner - verify all points are awarded correctly
