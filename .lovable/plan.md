

## Cleanup and Performance Optimization Plan

This plan removes obsolete Platform Admin PIN verification code and implements performance optimizations for the Commissioner Dashboard.

---

### Part A: Remove Obsolete PIN Verification

The `/platform-admin/verify` route and `verify-admin-pin` edge function are no longer needed since wrestler management now uses Supabase Auth + role-based access.

#### Files to Delete

| File | Reason |
|------|--------|
| `src/pages/PlatformAdminVerify.tsx` | PIN verification page no longer used |
| `supabase/functions/verify-admin-pin/` | Edge function no longer called |

#### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove route and lazy import for `PlatformAdminVerify` |

---

### Part B: Performance Optimizations

Several optimizations to reduce lag in the Commissioner Dashboard:

#### 1. Memoize WrestlerCard Component

The `WrestlerCard` component re-renders on every list change. Wrapping it in `React.memo` prevents unnecessary re-renders when wrestler data hasn't changed.

```typescript
export const WrestlerCard = React.memo(function WrestlerCard({ ... }) {
  // ...existing code
});
```

#### 2. Debounce Search Input

Currently, every keystroke triggers a re-filter. Adding a 150ms debounce prevents excessive re-renders during typing.

```typescript
// In WrestlerDatabaseTab.tsx
const [searchInput, setSearchInput] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setSearchQuery(searchInput), 150);
  return () => clearTimeout(timer);
}, [searchInput]);
```

#### 3. Use useMemo for Filtered Wrestlers

Move the filtering logic to `useMemo` in the hook to avoid recalculating on unrelated state changes.

#### 4. Remove Unnecessary motion.div Wrappers

The grid of wrestler cards uses `motion.div` which adds overhead. Replace with a static `div` since the cards don't need entry animations.

#### 5. Add loading="lazy" to Wrestler Images

Defer loading of images that are off-screen, especially helpful when there are many wrestlers.

---

### Technical Details

#### App.tsx Changes (Remove PIN Route)

Remove these lines:
```typescript
// Line 26: Remove import
const PlatformAdminVerify = lazy(() => import("./pages/PlatformAdminVerify"));

// Line 72: Remove route
<Route path="/platform-admin/verify" element={<PlatformAdminVerify />} />
```

#### WrestlerCard.tsx (Memoization + Lazy Loading)

```typescript
import { memo } from 'react';

export const WrestlerCard = memo(function WrestlerCard({ ... }: WrestlerCardProps) {
  // ...existing code
  
  // Add loading="lazy" to img
  <img
    src={imageUrl}
    alt={wrestler.name}
    className="w-full h-full object-cover"
    loading="lazy"
  />
});
```

#### WrestlerDatabaseTab.tsx (Debounced Search)

```typescript
const [localSearch, setLocalSearch] = useState('');

// Debounce search updates
useEffect(() => {
  const timer = setTimeout(() => {
    setSearchQuery(localSearch);
  }, 150);
  return () => clearTimeout(timer);
}, [localSearch, setSearchQuery]);

// In the Input component:
<Input
  value={localSearch}
  onChange={(e) => setLocalSearch(e.target.value)}
  // ...
/>
```

Also replace `motion.div` wrapper around the grid with a regular `div`.

#### useWrestlerAdmin.ts (useMemo for Filtering)

```typescript
import { useMemo } from 'react';

// Replace the direct filter with useMemo
const filteredWrestlers = useMemo(() => {
  return wrestlers.filter((wrestler) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!wrestler.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (divisionFilter !== 'all' && wrestler.division !== divisionFilter) {
      return false;
    }
    return true;
  });
}, [wrestlers, searchQuery, divisionFilter]);
```

---

### File Summary

| File | Action |
|------|--------|
| `src/pages/PlatformAdminVerify.tsx` | Delete |
| `supabase/functions/verify-admin-pin/` | Delete (edge function folder) |
| `src/App.tsx` | Edit - remove route and import |
| `src/components/admin/WrestlerCard.tsx` | Edit - add React.memo + lazy loading |
| `src/components/admin/WrestlerDatabaseTab.tsx` | Edit - debounce search, remove motion.div |
| `src/hooks/useWrestlerAdmin.ts` | Edit - useMemo for filtering |

---

### Expected Performance Improvements

| Optimization | Impact |
|--------------|--------|
| React.memo on WrestlerCard | Prevents 50+ card re-renders when parent state changes |
| Debounced search | Reduces re-renders from ~10/sec while typing to ~1/sec |
| useMemo filtering | Avoids recalculating filter on unrelated state updates |
| Lazy image loading | Faster initial render, loads images as user scrolls |
| Remove motion.div | Eliminates animation overhead on grid container |

