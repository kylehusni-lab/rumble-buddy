
# Fix Mobile Browser Crashes When Using Host Control + TV Display

## Problem Analysis

Based on my investigation, I've identified **multiple resource-intensive patterns** that compound to cause mobile browser crashes when running both the Host Control view and TV Display simultaneously:

### Root Causes

1. **Continuous Re-render Timer (HostControl.tsx, lines 93-97)**
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => setTick(t => t + 1), 1000);
     return () => clearInterval(interval);
   }, []);
   ```
   This timer fires every 1 second, forcing the entire component to re-render - all 1,486 lines of code and all child components re-evaluate.

2. **Expensive Animations on Every Render**
   - `NumberCell.tsx` uses Framer Motion with initial/animate props on 30 cells per Rumble grid (60 total)
   - These animations re-evaluate on every tick
   - The `shouldScaleBackground` prop in Drawer causes continuous scaling transforms (seen in session replay data showing repeated `scale(1.01528)` updates)

3. **Duplicate Realtime Subscriptions**
   - Both HostControl and TvDisplay subscribe to the same tables (`rumble_numbers`, `match_results`, `players`)
   - Each subscription triggers refetches that cascade through both pages
   - Mobile browsers have limited memory for WebSocket connections

4. **Console Warnings Adding Overhead**
   - The `EliminationModal` component is missing `React.forwardRef()` wrapper
   - This generates warnings on every render, adding garbage collection pressure

5. **Framer Motion Continuous Animations in TvViewNavigator**
   - The winner banner has infinite loop animations:
     ```typescript
     animate={{ opacity: [0.1, 0.3, 0.1] }}
     transition={{ duration: 2, repeat: Infinity }}
     ```
   - Multiple nested motion.div elements with continuous animations

---

## Solution

### 1. Optimize Duration Timer with useMemo

Instead of forcing full re-renders every second, memoize calculated values and only re-render affected components.

**File: `src/pages/HostControl.tsx`**

- Replace the tick state with a custom hook that only updates relevant duration displays
- Use `useMemo` to prevent recalculating expensive values on every tick
- Wrap ActiveWrestlerCard components in `React.memo`

### 2. Add forwardRef to EliminationModal

**File: `src/components/host/EliminationModal.tsx`**

- Wrap the component with `React.forwardRef()` to eliminate the console warning
- This also allows proper cleanup of DOM references

### 3. Optimize NumberCell with React.memo

**File: `src/components/tv/NumberCell.tsx`**

- Wrap with `React.memo()` and add comparison function
- Only re-render when wrestler status, name, or owner actually changes
- Remove unnecessary delay-based initial animations for cells already visible

### 4. Reduce Continuous Animations

**File: `src/components/tv/TvViewNavigator.tsx`**

- Add `useReducedMotion` hook to respect system preferences
- Replace infinite loop animations with CSS-based alternatives or one-time animations
- Use `will-change: transform` hints for GPU acceleration

### 5. Optimize Realtime Subscriptions

**File: `src/pages/HostControl.tsx` & `src/pages/TvDisplay.tsx`**

- Debounce refetch operations to prevent rapid-fire updates
- Add connection pooling hints
- Use more specific filters in subscriptions

### 6. Disable Drawer Scale Background on Mobile

**File: `src/components/host/EliminationModal.tsx`**

- Set `shouldScaleBackground={false}` for mobile devices to eliminate continuous scale transforms

---

## Technical Implementation

### HostControl.tsx - Timer Optimization

```typescript
// Before: Forces full component re-render every second
const [, setTick] = useState(0);
useEffect(() => {
  const interval = setInterval(() => setTick(t => t + 1), 1000);
  return () => clearInterval(interval);
}, []);

// After: Only update duration displays
const [currentTime, setCurrentTime] = useState(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);
  return () => clearInterval(interval);
}, []);

// Move duration calculation to memoized child components
```

### EliminationModal.tsx - Add forwardRef

```typescript
import { forwardRef } from "react";

export const EliminationModal = forwardRef<HTMLDivElement, EliminationModalProps>(
  function EliminationModal({ open, onOpenChange, ... }, ref) {
    // ... component body
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        {/* ... */}
      </Drawer>
    );
  }
);
```

### NumberCell.tsx - React.memo Optimization

```typescript
import { memo } from "react";

export const NumberCell = memo(function NumberCell({
  number,
  wrestlerName,
  ownerInitials,
  status,
}: NumberCellProps) {
  // Remove delay prop - use CSS animations instead
  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center rounded-xl transition-all duration-300 p-2",
      // ... rest of styling
    )}>
      {/* Remove motion.div wrapper, use CSS transitions */}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.number === nextProps.number &&
    prevProps.wrestlerName === nextProps.wrestlerName &&
    prevProps.status === nextProps.status &&
    prevProps.ownerInitials === nextProps.ownerInitials
  );
});
```

### TvViewNavigator.tsx - Reduce Infinite Animations

```typescript
// Use CSS keyframes instead of Framer Motion infinite loops
// Add class to index.css:
.animate-glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.3; }
}

// Replace motion.div with:
<div className="absolute inset-0 rounded-2xl bg-primary/20 animate-glow-pulse" />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/HostControl.tsx` | Optimize timer, add debouncing to subscriptions |
| `src/components/host/EliminationModal.tsx` | Add forwardRef, disable scale background |
| `src/components/tv/NumberCell.tsx` | Add React.memo, use CSS transitions |
| `src/components/tv/TvViewNavigator.tsx` | Replace infinite Framer animations with CSS |
| `src/index.css` | Add optimized CSS keyframe animations |
| `src/components/host/ActiveWrestlerCard.tsx` | Wrap with React.memo |

---

## Expected Impact

- **Reduced re-renders**: From ~60 components/second to only components with changed data
- **Lower memory usage**: CSS animations are GPU-accelerated and don't create JS objects
- **Eliminated console warnings**: Cleaner runtime with less garbage collection
- **Faster mobile experience**: Less CPU usage allows smoother scrolling and interaction

These optimizations should prevent mobile browser crashes while maintaining all existing functionality.
