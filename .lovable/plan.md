

# Fix Duplicate Rumble Winner, Validation, and Image Quality

## Issues Identified

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| **Duplicate Men's Rumble Winner in Matches tab** | The MatchesTab shows 2 Rumble Winners but both display "Men's" label when one should be "Women's" - something is wrong with the label logic or pick display | Fix the label/pick mapping in MatchesTab |
| **Same wrestler allowed for #1 and #30** | `SinglePickEditModal` doesn't use validation logic from `pick-validation.ts` | Pass current picks + blocked wrestlers to WrestlerPickerModal |
| **Blurry wrestler photos** | 64px display size is small; images may lack optimization; CSS object-cover scaling | Increase display size to 72-80px on mobile; add image-rendering hints |

---

## Part 1: Fix Duplicate Rumble Winner Display

**Investigation**: Looking at `MatchesTab` (lines 421-444), it correctly maps over `["mens_rumble_winner", "womens_rumble_winner"]`. The label logic at line 437 is:
```typescript
label={id.includes("mens") ? "Men's Rumble Winner" : "Women's Rumble Winner"}
```

This is correct. The issue in the screenshot shows:
- Row 3: "MEN'S RUMBLE WINNER - Brock Lesnar" (has pick)
- Row 4: "MEN'S RUMBLE WINNER - +50 pts" (no pick)

Both show "MEN'S" which means both IDs contain "mens". This suggests the loop is somehow iterating over the wrong array OR there's a data issue.

**Actually** - looking more carefully at the screenshot, I see the Matches tab shows 4 items with "3/4" completion. That's 2 undercard + 2 rumble winners = 4 items. But BOTH rumble winner rows say "MEN'S RUMBLE WINNER". 

The issue is that the empty Women's Rumble Winner row is incorrectly labeled as "Men's". Let me check the label logic more carefully...

The issue is at line 437:
```typescript
label={id.includes("mens") ? "Men's Rumble Winner" : "Women's Rumble Winner"}
```

This should work. But wait - checking the array: `["mens_rumble_winner", "womens_rumble_winner"]` - both have correct IDs. Unless the screenshot is from older code?

**Actually, reviewing the latest code I just read** - The code looks correct. The bug may have been in a previous version. Let me verify the current state is correct and include a small cleanup if needed.

**File: `src/pages/SoloDashboard.tsx`**

Ensure the Rumble Winners in MatchesTab are correctly labeled:
```typescript
{["mens_rumble_winner", "womens_rumble_winner"].map((id) => (
  <MatchRow
    key={id}
    id={id}
    label={id === "mens_rumble_winner" ? "Men's Rumble Winner" : "Women's Rumble Winner"}
    pick={picks[id]}
    result={results[id]}
    points={SCORING.RUMBLE_WINNER_PICK}
  />
))}
```

Use strict equality `===` instead of `includes()` to prevent any edge cases.

---

## Part 2: Add Validation to SinglePickEditModal (Block Same Wrestler for #1/#30)

The `pick-validation.ts` file has `getBlockedWrestlers()` function that prevents conflicting picks (e.g., same wrestler at #1 and #30). However, `SinglePickEditModal` doesn't use this validation.

**File: `src/components/dashboard/SinglePickEditModal.tsx`**

1. Add imports for validation and pass current picks:

```typescript
import { getBlockedWrestlers } from "@/lib/pick-validation";
```

2. Update props to accept current picks:

```typescript
interface SinglePickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentPick: string;
  onSave: (matchId: string, newValue: string) => void;
  mensEntrants?: string[];
  womensEntrants?: string[];
  allPicks?: Record<string, string>;  // NEW: All current picks for validation
}
```

3. Calculate blocked wrestlers and filter entrants:

```typescript
// Inside the component, before wrestler type handling:
const blockedWrestlers = useMemo(() => {
  if (!allPicks || config?.type !== "wrestler") return new Set<string>();
  
  // Extract gender and propId from matchId
  const gender = matchId.includes("womens") ? "womens" : "mens";
  let propId = matchId.replace(`${gender}_`, "");
  
  // Handle final_four_X -> final_four_X
  // Handle entrant_1, entrant_30, etc.
  
  return getBlockedWrestlers(gender as "mens" | "womens", propId, allPicks);
}, [matchId, allPicks, config]);

// Filter entrants to exclude blocked wrestlers
const availableEntrants = config?.entrants?.filter(w => !blockedWrestlers.has(w)) || [];
```

4. Pass filtered entrants to WrestlerPickerModal:

```typescript
<WrestlerPickerModal
  ...
  wrestlers={availableEntrants}
  ...
/>
```

**File: `src/pages/SoloDashboard.tsx`**

Pass picks to SinglePickEditModal:

```typescript
<SinglePickEditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  matchId={editingMatchId}
  currentPick={editingCurrentPick}
  onSave={handleSavePick}
  mensEntrants={mensEntrants}
  womensEntrants={womensEntrants}
  allPicks={picks}  // NEW
/>
```

---

## Part 3: Improve Image Quality and Size

**Issue**: 64px (w-16) images appear blurry because:
1. Small display size loses detail
2. No CSS optimization for scaled images
3. Source images may be various qualities

**Solution**: Increase avatar size and add rendering hints.

**File: `src/pages/SoloDashboard.tsx`**

1. Increase MatchRow avatar from `w-16 h-16` (64px) to `w-[72px] h-[72px]`:

```typescript
// In MatchRow (around line 351-382)
<img
  src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
  alt={getEntrantDisplayName(pick)}
  className={cn(
    "w-[72px] h-[72px] rounded-full object-cover border-2",
    "image-rendering-crisp-edges",  // Add rendering hint
    ...
  )}
/>

// Empty placeholder same size
<div className="w-[72px] h-[72px] rounded-full border-2 border-dashed ...">
```

2. Similarly update RumbleTab (around line 508-536):

```typescript
<img
  className={cn(
    "w-[72px] h-[72px] rounded-full object-cover border-2",
    ...
  )}
/>
```

3. Add CSS utility for crisp rendering in `src/index.css`:

```css
.image-crisp {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

---

## Part 4: Better Space Usage in Matches Tab (Desktop)

On desktop (Screenshot 2), the Men's tab uses a 2-column grid for props. This could be applied to improve the Matches tab layout too.

**File: `src/pages/SoloDashboard.tsx`**

For desktop view, consider using a 2-column grid for the 4 match picks:

```typescript
// In MatchesTab
{!isMobile ? (
  <div className="grid grid-cols-2 gap-3">
    {/* Render match cards in grid */}
  </div>
) : (
  <div className="space-y-3">
    {/* Mobile: stacked list */}
  </div>
)}
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Fix Rumble Winner labels (use strict equality); Increase avatar sizes to 72px; Pass `allPicks` to SinglePickEditModal |
| `src/components/dashboard/SinglePickEditModal.tsx` | Add `allPicks` prop; Import and use `getBlockedWrestlers` to filter available wrestlers |
| `src/index.css` | Add `.image-crisp` utility class for better image rendering |
| `src/components/dashboard/RumblePropsSection.tsx` | Increase mobile avatar sizes to 72px for consistency |

---

## Testing Checklist

1. Go to Solo Dashboard, Matches tab - verify only ONE Men's and ONE Women's Rumble Winner appear
2. Go to Men's tab - pick a wrestler for #1 Entrant
3. Try to pick the SAME wrestler for #30 Entrant - verify they are NOT in the list
4. Verify wrestler photos appear larger (72px) and less blurry
5. Pick wrestlers for Final Four - verify first_elimination cannot select them
6. Test on mobile and desktop viewports
7. Verify Group Mode Player Dashboard also has larger/clearer photos

