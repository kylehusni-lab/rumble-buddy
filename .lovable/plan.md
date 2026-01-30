
# Fix Pick Flow Issues: Count Logic, Auto-Advance, and Winner Footer Visibility

## Issues Identified

### Issue 1: Count Logic Mismatch ("7/6" in Chaos Props)
The ChaosPropsCard uses inconsistent match ID formats between:
- **Card handler**: `${gender}_chaos_${prop.id}` (e.g., `mens_chaos_prop_1`)
- **Count logic**: `${gender}_chaos_prop_${index + 1}` (e.g., `mens_chaos_prop_1`)

The actual mismatch is that CHAOS_PROPS has **7 items** (prop_1 through prop_7), but the card's counter is hardcoded to show `/6`:
- Line 34 in ChaosPropsCard: `counter={answeredCount}/6`
- But CHAOS_PROPS actually contains 7 props

Additionally, the `cardCompletionStatus` in PickCardStack checks for 6 props (line 74) instead of using `CHAOS_PROPS.length`.

### Issue 2: Auto-Advance Too Fast (300ms)
The current 300ms delay before advancing to the next card is too quick. Users don't have time to:
- See their selection confirmed
- Enjoy the confetti animation on winner selection
- Mentally register what they picked

### Issue 3: Winner Footer Not Visible
The sticky footer in RumbleWinnerCard uses `absolute bottom-0` positioning, but on mobile the footer may be cut off because:
- The card is inside a flex container with `overflow-hidden`
- The grid has `pb-24` padding to make room for the footer, but this may not be enough
- The footer needs proper z-index and safe area handling

---

## Technical Solution

### Fix 1: Correct Chaos Props Count
**File: `src/components/picks/cards/ChaosPropsCard.tsx`**
- Change counter from hardcoded `/6` to dynamic `/${CHAOS_PROPS.length}`
- Update count to use `CHAOS_PROPS.length` as reference

**File: `src/components/picks/PickCardStack.tsx`**
- Update cardCompletionStatus check to use `CHAOS_PROPS.length` instead of hardcoded `6`

### Fix 2: Disable Auto-Advance on Match/Winner Cards
**File: `src/components/picks/PickCardStack.tsx`**
- Remove the auto-advance behavior entirely for rumble-winner and match cards
- Let users manually navigate using Next/Back buttons or swipe gestures
- This gives time to appreciate the confetti animation and see the selection

### Fix 3: Improve Winner Footer Visibility
**File: `src/components/picks/cards/RumbleWinnerCard.tsx`**
- Increase bottom padding on the grid from `pb-24` to `pb-28` for more breathing room
- Add `safe-area-inset-bottom` padding to account for mobile navigation bars
- Ensure the glassmorphism footer has proper contrast and visibility

---

## Implementation Details

### ChaosPropsCard.tsx Changes
```typescript
// Line 24: Fix count to use dynamic CHAOS_PROPS length
const answeredCount = Object.values(values).filter(v => v !== null && v !== undefined).length;
const totalProps = CHAOS_PROPS.length;

// Line 34-35: Update counter prop
counter={`${answeredCount}/${totalProps}`}
```

### PickCardStack.tsx Changes
```typescript
// Lines 68-74: Use CHAOS_PROPS.length
if (card.type === "chaos-props") {
  const gender = card.gender;
  const propCount = CHAOS_PROPS.filter((_, index) => {
    const matchId = `${gender}_chaos_prop_${index + 1}`;
    return picks[matchId] !== null && picks[matchId] !== undefined;
  }).length;
  return propCount === CHAOS_PROPS.length; // Was hardcoded 6
}

// Lines 118-122: Remove auto-advance entirely
const handlePickUpdate = useCallback((cardId: string, value: any) => {
  if (isLocked) return;
  setPicks(prev => ({ ...prev, [cardId]: value }));
  // REMOVED: Auto-advance logic
}, [isLocked]);
```

### RumbleWinnerCard.tsx Changes
```typescript
// Line 96: Increase grid bottom padding
<div className="grid ... pb-28"> // Was pb-24

// Line 166: Add safe-area handling to footer
<motion.div 
  className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 glass-panel pb-safe"
>
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `ChaosPropsCard.tsx` | Dynamic counter using `CHAOS_PROPS.length` | Fix "7/6" display bug |
| `PickCardStack.tsx` | Use `CHAOS_PROPS.length` in completion check | Fix completion status accuracy |
| `PickCardStack.tsx` | Remove auto-advance after pick | Allow time to see selection |
| `RumbleWinnerCard.tsx` | Increase grid padding + safe-area inset | Ensure footer is visible |

---

## Expected Behavior After Fix

1. **Chaos Props counter** will show "0/7", "1/7", etc. correctly based on actual CHAOS_PROPS count
2. **Card navigation** will be fully manual - users swipe or tap Next/Back to move between cards
3. **Winner selection footer** will be visible on all devices, with proper spacing from the bottom of the screen and mobile safe areas
