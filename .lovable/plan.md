
# Fix Alphabetical Sorting for Unconfirmed Entrants

## Problem
Wrestlers with the `*` prefix (unconfirmed entrants like `*Seth Rollins`) are appearing at the top of wrestler selection grids instead of being sorted alphabetically by their actual name. This happens because the asterisk character (`*`) has a lower ASCII value than letters, causing it to sort before "A".

## Solution
Add a sorting helper function and apply it consistently across all wrestler selection grids.

---

## Implementation Steps

### 1. Add Sorting Helper to entrant-utils.ts

Add a new helper function that compares entrant names while ignoring the `*` prefix:

```typescript
/**
 * Sort entrants alphabetically, ignoring the * prefix for unconfirmed entrants
 * Keeps "Surprise" entries at the end
 */
export function sortEntrants(a: string, b: string): number {
  // Keep "Surprise/Other Entrant" at the end
  if (a.includes("Surprise")) return 1;
  if (b.includes("Surprise")) return -1;
  
  // Compare by display name (strips * prefix)
  const nameA = getEntrantDisplayName(a);
  const nameB = getEntrantDisplayName(b);
  return nameA.localeCompare(nameB);
}
```

### 2. Update RumbleWinnerCard.tsx

Replace the inline sort with the new helper:

```typescript
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";

const filteredEntrants = entrants
  .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
  .sort(sortEntrants);
```

### 3. Update RumblePropsCard.tsx

Add sorting to the modal's wrestler grid:

```typescript
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";

const filteredEntrants = entrants
  .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
  .sort(sortEntrants);
```

### 4. Update WrestlerPickerModal.tsx

Add sorting to the filtered wrestlers:

```typescript
import { sortEntrants } from "@/lib/entrant-utils";

const filteredWrestlers = useMemo(() => {
  const filtered = searchQuery.trim()
    ? wrestlers.filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : wrestlers;
  return [...filtered].sort(sortEntrants);
}, [wrestlers, searchQuery]);
```

### 5. Update RumbleEntryControl.tsx

Replace the inline sort with the new helper:

```typescript
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";

const filteredEntrants = useMemo(() => {
  return [...entrants]
    .sort(sortEntrants)
    .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()));
}, [entrants, searchQuery]);
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/entrant-utils.ts` | Add `sortEntrants` helper function |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Use `sortEntrants` for grid sorting |
| `src/components/picks/cards/RumblePropsCard.tsx` | Add sorting with `sortEntrants` to modal |
| `src/components/WrestlerPickerModal.tsx` | Add sorting with `sortEntrants` |
| `src/components/host/RumbleEntryControl.tsx` | Use `sortEntrants` for list sorting |

---

## Result

After this change, all wrestler grids will:
- Sort alphabetically by the wrestler's actual name (ignoring `*` prefix)
- Keep "Surprise/Other Entrant" options at the bottom of the list
- Display unconfirmed entrants in their correct alphabetical position with italic styling
