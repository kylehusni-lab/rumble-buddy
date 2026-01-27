
# Improve Pick Editing & Rejoin Experience

## Overview
Two UX improvements to make editing picks more efficient and make the rejoin experience feel more natural.

---

## Problem 1: Editing Individual Picks

**Current Behavior:**
- When editing picks, users have to navigate through all 9 cards using "Skip" buttons to exit
- The "Skip" button implies the user is skipping that pick, not navigating
- There's no clear "I'm done" escape hatch without reaching the last card

**Solution:**
- Replace "Skip" with "Next" for clearer navigation intent
- Add a persistent "Done" button that saves current picks and returns to dashboard
- Allow users to exit at any point after making their desired changes

---

## Problem 2: Rejoin Experience

**Current Behavior:**
- In `PlayerJoin.tsx`, returning players are redirected to picks page (`/player/picks/${partyCode}`) unless the party is live
- This feels jarring - users expect to land on a hub/dashboard first

**Solution:**
- Always redirect returning players to the dashboard (`/player/dashboard/${partyCode}`)
- The dashboard already has an "Edit Picks" button for pre-event status
- New players (first-time join) still go to picks to complete their initial submission

---

## Implementation Details

### Changes to PickCardStack.tsx

1. **Rename "Skip" to "Next"** - More accurate for sequential navigation
2. **Add "Done" button in bottom navigation** - Always visible, allows exit at any point
3. **Auto-save on navigation** - Save picks as user moves between cards (already happening via state)
4. **"Done" behavior:**
   - If `hasSubmitted` is true (returning to edit): Save changes and go to dashboard
   - If first-time: Show reminder that not all picks are complete, but allow exit anyway

```text
+----------------------------------+
| [Back]    3/9      [Next] [Done] |
+----------------------------------+
                      ^       ^
                  navigate   exit & save
```

### Changes to PlayerJoin.tsx

Update the redirect logic for returning players:

```
Current logic:
- Host → /host/setup
- Party live → /player/dashboard
- Else → /player/picks  ← Problem here

New logic:
- Host → /host/setup
- Returning player (existingPlayer) → /player/dashboard
- New player → /player/picks
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/picks/PickCardStack.tsx` | Rename "Skip" to "Next", add "Done" button for early exit |
| `src/pages/PlayerJoin.tsx` | Redirect returning players to dashboard instead of picks |
| `src/pages/SoloPicks.tsx` | Apply same "Skip" → "Next" + "Done" changes for consistency |

---

## UI Changes

### PickCardStack Bottom Navigation (Before)
```
[← Back]     3 / 9     [Skip →]
         (last card)   [Submit All]
```

### PickCardStack Bottom Navigation (After)
```
[← Back]     3 / 9     [Next →]  [Done ✓]
         (last card)   [Save]    [Done ✓]
```

The "Done" button:
- Appears on all cards (not just the last)
- Saves any changes made so far
- Returns to dashboard with a success toast
- Uses a subtle style (ghost/outline) so "Next" remains the primary action

---

## Edge Cases

1. **First-time user hitting "Done" early:**
   - Show toast: "Picks saved! You can finish the rest anytime."
   - Still navigate to dashboard
   
2. **No changes made:**
   - "Done" simply navigates back without saving
   
3. **Returning user with complete picks:**
   - They land on dashboard, can tap "Edit Picks" to modify specific ones
   - Changed picks auto-save as they navigate
   - "Done" returns them to dashboard

---

## Summary

These changes align with the "stack overflow" guidance to make editing more granular and the rejoin experience more intuitive:
- **Skip → Next**: Clearer navigation intent
- **Add Done button**: Exit at any point without going through all cards
- **Returning players → Dashboard**: Natural hub-based entry point
