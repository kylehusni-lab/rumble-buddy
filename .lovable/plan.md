
# Fix Potential Crash Sources in Wrestler Selection Flow

## Overview
Implement defensive error handling to prevent app crashes during wrestler selections and add a global error boundary for graceful recovery.

---

## Problem Analysis
1. **No global error boundary** - Unhandled errors cause white-screen crashes
2. **No unhandled promise rejection handler** - Async errors in selection flow crash the app
3. **Minor:** CountdownUnit ref warning on homepage (cosmetic, not crash-related)

---

## Solution

### 1. Add Global Error Boundary Component
Create a new `ErrorBoundary.tsx` component that catches React rendering errors:

| Property | Value |
|----------|-------|
| Location | `src/components/ErrorBoundary.tsx` |
| Catches | React rendering errors |
| Fallback UI | User-friendly error message with retry button |

### 2. Add Unhandled Promise Rejection Handler
Add to App.tsx a global handler for async errors:

```typescript
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    toast.error("An unexpected error occurred. Please try again.");
    event.preventDefault();
  };

  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

### 3. Wrap Selection Handlers with Try-Catch
Add defensive error handling to:
- `PickCardStack.tsx` - handlePickUpdate, handleChaosPropsUpdate, handleRumblePropsUpdate
- `RumblePropsCard.tsx` - handleWrestlerSelect, handleFinalFourSelect

### 4. Fix CountdownUnit Ref Warning
Convert `CountdownUnit` to use `forwardRef` or ensure it's not receiving refs:

```typescript
const CountdownUnit = forwardRef<HTMLDivElement, Props>(
  function CountdownUnit({ value, label }, ref) {
    return (
      <div ref={ref} className="text-center">
        ...
      </div>
    );
  }
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ErrorBoundary.tsx` | NEW - Create error boundary component |
| `src/App.tsx` | Wrap routes in ErrorBoundary, add global rejection handler |
| `src/components/home/HeroSection.tsx` | Fix CountdownUnit forwardRef warning |
| `src/components/picks/PickCardStack.tsx` | Add try-catch to pick handlers |
| `src/components/picks/cards/RumblePropsCard.tsx` | Add try-catch to selection handlers |

---

## Implementation Order
1. Create ErrorBoundary component
2. Update App.tsx with error boundary and global handler
3. Fix CountdownUnit ref warning
4. Add defensive try-catch to selection handlers

---

## Technical Details

**ErrorBoundary Component:**
- Uses React class component (required for error boundaries)
- Catches errors in child component tree
- Provides "Try Again" button that resets state
- Logs errors for debugging

**Global Promise Handler:**
- Catches unhandled async errors
- Shows toast notification instead of crashing
- Prevents default crash behavior

**Selection Handler Protection:**
- Wrap state updates in try-catch
- Show toast on error
- Maintain current state on failure (no data loss)
