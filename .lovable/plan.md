
# Performance Optimization Plan for Solo and Party Mode

This plan addresses performance issues across both solo mode and party mode by implementing comprehensive optimizations including component memoization, debounced syncing, and reduced animation overhead.

---

## Summary

Performance issues stem from:
1. **Excessive cloud sync calls** - Every pick change triggers immediate API calls
2. **Missing component memoization** - Card components re-render unnecessarily
3. **React ref warnings** - `forwardRef` missing on some components causes console overhead
4. **Confetti firing on every selection** - Should only fire on new selections
5. **Framer Motion animations on every render** - Can be optimized with `layoutId` removal where not needed
6. **Non-memoized calculations** - Filtering/sorting operations recalculated on every render

---

## Changes Overview

### 1. Debounce Cloud Sync in SoloPicks

**File:** `src/pages/SoloPicks.tsx`

Currently every pick immediately calls `savePicksToCloud()`. Add debouncing to batch updates:

```tsx
// Add refs for debouncing
const pendingPicksRef = useRef<Record<string, any>>({});
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Debounced save function
const debouncedCloudSave = useCallback((newPicks: Record<string, any>) => {
  pendingPicksRef.current = newPicks;
  
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  
  saveTimeoutRef.current = setTimeout(() => {
    savePicksToCloud(pendingPicksRef.current);
    saveTimeoutRef.current = null;
  }, 800); // 800ms debounce
}, [savePicksToCloud]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      // Save any pending picks before unmount
      if (Object.keys(pendingPicksRef.current).length > 0) {
        savePicksToCloud(pendingPicksRef.current);
      }
    }
  };
}, [savePicksToCloud]);
```

Replace `savePicksToCloud(newPicks)` calls with `debouncedCloudSave(newPicks)` in all handlers.

---

### 2. Add forwardRef to MatchCard

**File:** `src/components/picks/cards/MatchCard.tsx`

Wrap component with `forwardRef` and `React.memo`:

```tsx
import React, { forwardRef, memo } from "react";

interface MatchCardProps {
  title: string;
  options: readonly [string, string] | string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MatchCard = memo(forwardRef<HTMLDivElement, MatchCardProps>(
  function MatchCard({ title, options, value, onChange, disabled }, ref) {
    return (
      <div ref={ref} className="bg-card rounded-2xl...">
        {/* existing content */}
      </div>
    );
  }
));
```

---

### 3. Add forwardRef to ChaosPropsCard

**File:** `src/components/picks/cards/ChaosPropsCard.tsx`

Same pattern as MatchCard:

```tsx
import React, { forwardRef, memo } from "react";

export const ChaosPropsCard = memo(forwardRef<HTMLDivElement, ChaosPropsCardProps>(
  function ChaosPropsCard({ title, gender, values, onChange, disabled }, ref) {
    return (
      <div ref={ref} className="bg-card rounded-2xl...">
        {/* existing content */}
      </div>
    );
  }
));
```

---

### 4. Add React.memo to RumbleWinnerCard with Conditional Confetti

**File:** `src/components/picks/cards/RumbleWinnerCard.tsx`

Memoize and only fire confetti on new selections:

```tsx
import React, { useState, memo, useRef, useCallback } from "react";

export const RumbleWinnerCard = memo(function RumbleWinnerCard({ 
  title, gender, value, onChange, disabled, customEntrants 
}: RumbleWinnerCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const lastConfettiValue = useRef<string | null>(null);
  
  const handleSelect = useCallback((wrestler: string) => {
    if (disabled) return;
    onChange(wrestler);
    
    // Only fire confetti if this is a new selection (not re-selecting same)
    if (wrestler !== lastConfettiValue.current) {
      lastConfettiValue.current = wrestler;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#4B0082', '#FFD700'],
      });
    }
  }, [disabled, onChange]);
  
  // ... rest of component
});
```

---

### 5. Memoize RumblePropsCard Calculations

**File:** `src/components/picks/cards/RumblePropsCard.tsx`

The `filteredEntrants` calculation runs on every render. Add proper memoization:

```tsx
import React, { useState, useMemo, useCallback, memo } from "react";

export const RumblePropsCard = memo(function RumblePropsCard({
  title, gender, values, onChange, disabled, customEntrants,
}: RumblePropsCardProps) {
  // Memoize default entrants selection
  const entrants = useMemo(() => {
    const defaultEntrants = gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS;
    return customEntrants && customEntrants.length > 0 ? customEntrants : defaultEntrants;
  }, [gender, customEntrants]);

  // Memoize filtered entrants - only recalculate when dependencies change
  const filteredEntrants = useMemo(() => {
    return entrants
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort(sortEntrants);
  }, [entrants, searchQuery]);
  
  // Memoize handlers
  const handleWrestlerSelect = useCallback((wrestler: string) => {
    if (!activePickerId || disabled) return;
    onChange({ ...values, [activePickerId]: wrestler });
    setActivePickerId(null);
    setSearchQuery("");
  }, [activePickerId, disabled, onChange, values]);
  
  // ... rest of component
});
```

---

### 6. Add Debounced Sync to PickCardStack (Party Mode)

**File:** `src/components/picks/PickCardStack.tsx`

Party mode currently saves on final submit, but add debounced local state persistence:

```tsx
// Add similar debounce pattern for localStorage saves if needed
// Party mode already batches saves to DB on submit, which is good

// But ensure handlers use useCallback:
const handlePickUpdate = useCallback((cardId: string, value: any) => {
  if (isLocked) return;
  setPicks(prev => ({ ...prev, [cardId]: value }));
  
  // Auto-advance logic...
}, [isLocked, currentCardIndex]);
```

---

### 7. Optimize PlayerDashboard Realtime Subscriptions

**File:** `src/pages/PlayerDashboard.tsx`

The useEffect has too many dependencies causing re-subscription. Use refs pattern like TvDisplay:

```tsx
// Add refs to hold current state
const picksRef = useRef<Pick[]>([]);
const allNumbersRef = useRef<RumbleNumber[]>([]);
const playersRef = useRef<typeof players>([]);

// Keep refs in sync
useEffect(() => { picksRef.current = picks; }, [picks]);
useEffect(() => { allNumbersRef.current = allNumbers; }, [allNumbers]);
useEffect(() => { playersRef.current = players; }, [players]);

// Reduce useEffect dependencies to only essential ones
useEffect(() => {
  // ... realtime subscription setup
  // Use refs.current instead of state in callbacks
}, [code, session?.playerId, navigate]); // Remove partyStatus, players, allNumbers, picks
```

---

### 8. Optimize HostControl Duration Timer

**File:** `src/pages/HostControl.tsx`

The `currentTime` state updates every second and may cause cascading re-renders. The component already does this correctly, but ensure ActiveWrestlerCard receives memoized duration:

```tsx
// In the render section, memoize duration calculation per wrestler
const getWrestlerDuration = useCallback((entryTimestamp: string | null) => {
  if (!entryTimestamp) return 0;
  return Math.floor((currentTime - new Date(entryTimestamp).getTime()) / 1000);
}, [currentTime]);
```

This is already optimized with `React.memo` on `ActiveWrestlerCard` using custom comparison.

---

### 9. Remove Unnecessary layoutId in SoloDashboard Tabs

**File:** `src/pages/SoloDashboard.tsx`

The `layoutId="activeTab"` causes Framer Motion to track and animate between tabs. For simple indicators, CSS transitions are lighter:

```tsx
// Replace:
{activeTab === tab.id && (
  <motion.div
    layoutId="activeTab"
    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
  />
)}

// With:
<div className={cn(
  "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200",
  activeTab === tab.id ? "bg-primary" : "bg-transparent"
)} />
```

---

### 10. Memoize Tab Content Components in SoloDashboard

**File:** `src/pages/SoloDashboard.tsx`

The inline tab components (`MatchesTab`, `RumbleTab`, `ChaosTab`) should be memoized:

```tsx
const MatchesTab = memo(function MatchesTab({ 
  picks, 
  results 
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  // existing implementation
});

const RumbleTab = memo(function RumbleTab({ 
  gender, 
  picks, 
  results 
}: { 
  gender: "mens" | "womens"; 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  // existing implementation
});

const ChaosTab = memo(function ChaosTab({ 
  picks, 
  results 
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  // existing implementation
});
```

---

## Technical Details

### Performance Improvements Expected

| Issue | Before | After |
|-------|--------|-------|
| Solo cloud sync calls | ~40 per session | ~5-10 batched calls |
| Console warnings | 3+ forwardRef errors/render | 0 errors |
| Card re-renders | All cards on each pick | Only changed card |
| Confetti overhead | Every click | First selection only |
| Tab animations | Framer Motion layout calc | CSS transitions |
| Dashboard re-renders | Full tree on subscription | Isolated to changed data |

### Files to Modify

1. `src/pages/SoloPicks.tsx` - Add debounced cloud sync + cleanup
2. `src/components/picks/cards/MatchCard.tsx` - Add forwardRef + memo
3. `src/components/picks/cards/ChaosPropsCard.tsx` - Add forwardRef + memo  
4. `src/components/picks/cards/RumbleWinnerCard.tsx` - Add memo + conditional confetti
5. `src/components/picks/cards/RumblePropsCard.tsx` - Add memo + memoize calculations
6. `src/components/picks/PickCardStack.tsx` - Add useCallback to handlers
7. `src/pages/PlayerDashboard.tsx` - Optimize realtime effect dependencies with refs
8. `src/pages/SoloDashboard.tsx` - Memoize tab components + replace layoutId

### Implementation Order

1. **Phase 1 - Quick Wins**: Add forwardRef to MatchCard, ChaosPropsCard (fixes console errors)
2. **Phase 2 - Core Optimization**: Add React.memo wrappers to all card components
3. **Phase 3 - Network**: Debounce cloud sync in SoloPicks
4. **Phase 4 - Dashboard**: Optimize PlayerDashboard effect dependencies with refs pattern
5. **Phase 5 - Polish**: Replace Framer Motion layoutId with CSS, memoize tab components

---

## Risk Assessment

- **Low risk**: All changes are additive optimizations
- **No data changes**: Picks will still save correctly, just batched
- **No UI changes**: User experience remains identical, just faster
- **Backward compatible**: Works with existing picks and cloud data
- **Cleanup handled**: Debounce refs cleaned up on unmount with final save
