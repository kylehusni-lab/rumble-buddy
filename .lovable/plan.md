

## Fix: Match Card Interface Alignment + Final Four Duplicate Prevention

### Issues Identified

**Issue 1: Solo Mode Using Old Match Interface**
- `SoloPicks.tsx` imports and uses the old `MatchCard` component (simple stacked layout)
- `PickCardStack.tsx` (party mode) correctly uses the updated `FaceOffMatchCard` (VS badge design)
- Solo mode needs to be updated to use `FaceOffMatchCard` for consistency

**Issue 2: Final Four Allows Duplicate Picks**
- When using the grouped Final Four picker in `RumblePropsCard`, duplicates are correctly prevented (line 480 checks `finalFourSelections.includes(wrestler)`)
- However, when editing individual Final Four slots via `SinglePickEditModal`, the validation logic in `getBlockedWrestlers()` does NOT block other Final Four wrestlers
- This means a user can edit Final Four slot #2 and pick the same wrestler already selected in slot #1

---

### Solution

#### Part A: Update Solo Mode to Use FaceOffMatchCard

**File**: `src/pages/SoloPicks.tsx`

1. Change import from `MatchCard` to `FaceOffMatchCard`
2. Update component usage from `<MatchCard>` to `<FaceOffMatchCard>`

```typescript
// Change line 7:
import { FaceOffMatchCard } from "@/components/picks/cards/FaceOffMatchCard";

// Change lines 333-340:
{currentCard.type === "match" && (
  <FaceOffMatchCard
    title={currentCard.title}
    options={currentCard.options as readonly [string, string]}
    value={picks[currentCard.id] || null}
    onChange={(value) => handlePickUpdate(currentCard.id, value)}
    disabled={false}
  />
)}
```

#### Part B: Add Final Four Cross-Slot Duplicate Prevention

**File**: `src/lib/pick-validation.ts`

Add logic to block Final Four wrestlers that are already picked in other slots:

```typescript
export function getBlockedWrestlers(
  gender: 'mens' | 'womens',
  propId: string,
  currentPicks: Record<string, string | null>
): Set<string> {
  const blocked = new Set<string>();
  
  // ... existing conflict rules logic ...
  
  // NEW: Block other Final Four selections when editing a Final Four slot
  if (propId.startsWith('final_four_')) {
    const currentSlot = propId.split('_').pop(); // e.g., "1", "2", "3", "4"
    for (let i = 1; i <= 4; i++) {
      if (String(i) !== currentSlot) {
        const otherPick = currentPicks[`${gender}_final_four_${i}`];
        if (otherPick) {
          blocked.add(otherPick);
        }
      }
    }
  }
  
  return blocked;
}
```

**File**: `src/lib/pick-validation.ts` - Also update `getBlockedReason` for user feedback

```typescript
// Add inside getBlockedReason function:
if (propId.startsWith('final_four_')) {
  const currentSlot = propId.split('_').pop();
  for (let i = 1; i <= 4; i++) {
    if (String(i) !== currentSlot && currentPicks[`${gender}_final_four_${i}`] === wrestler) {
      return `Already picked for Final Four slot #${i}`;
    }
  }
}
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/SoloPicks.tsx` | Replace `MatchCard` import/usage with `FaceOffMatchCard` |
| `src/lib/pick-validation.ts` | Add Final Four cross-slot blocking in `getBlockedWrestlers` and `getBlockedReason` |

---

### Technical Notes

- The Final Four grouped picker (`RumblePropsCard.tsx`) already prevents duplicates via `finalFourSelections.includes(wrestler)` check
- The individual edit modal (`SinglePickEditModal.tsx`) relies on `getBlockedWrestlers()` which currently doesn't check other Final Four slots
- Both Solo and Party modes will now use the same premium Face-Off interface for match picks

