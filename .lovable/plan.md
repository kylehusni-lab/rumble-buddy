

# Number Draw Animation Fixes

## Overview

Fix three issues with the NumberRevealAnimation component:
1. Replace emojis and Crown icon with the Royal Rumble logo
2. Filter out already-entered wrestlers from the entry list
3. Fix stuck animation states in both reveal modes

---

## Issue 1: Remove Emojis and Crown Logo

**Problem:**
- Uses `Crown` icon from lucide-react on choice and complete screens
- Uses emojis for Men's/Women's labels (lines 168, 184, 221, 237)

**Solution:**
- Import the Royal Rumble logo component
- Replace Crown icon with the logo on choice/complete screens
- Replace emojis with text labels ("Men's" / "Women's")

**Changes to `NumberRevealAnimation.tsx`:**

| Location | Current | Replacement |
|----------|---------|-------------|
| Line 3 | `import { Crown, Zap, Film, X }` | `import { Zap, Film, X }` |
| Line 98 | `<Crown ... size={80} />` | `<Logo size="md" />` |
| Line 168 | `🧔 Men's` | `Men's` |
| Line 184 | `👩 Women's` | `Women's` |
| Line 221 | `🧔 Men's Rumble` | `Men's Rumble` |
| Line 237 | `👩 Women's Rumble` | `Women's Rumble` |
| Line 282 | `<Crown ... size={80} />` | `<Logo size="md" />` |

---

## Issue 2: Filter Out Already-Entered Wrestlers

**Problem:**
- `RumbleEntryControl` receives `entrants` prop containing all wrestlers
- Already-entered wrestlers still appear in the selection list
- This allows accidental duplicate entries

**Solution:**
- In `HostControl.tsx`, filter `allMensEntrants` and `allWomensEntrants` to exclude wrestlers already assigned to a number

**Changes to `HostControl.tsx`:**

```typescript
// Current (line 676-677):
const allMensEntrants = useMemo(() => 
  [...mensEntrants, ...mensSurpriseEntrants], 
  [mensEntrants, mensSurpriseEntrants]
);

// Fixed:
const allMensEntrants = useMemo(() => {
  const enteredNames = new Set(
    mensNumbers
      .filter(n => n.wrestler_name)
      .map(n => n.wrestler_name!.toLowerCase())
  );
  return [...mensEntrants, ...mensSurpriseEntrants]
    .filter(name => !enteredNames.has(name.toLowerCase()));
}, [mensEntrants, mensSurpriseEntrants, mensNumbers]);
```

Same pattern for `allWomensEntrants`.

---

## Issue 3: Fix Stuck Animation States

**Problem 1 - Instant Mode Stuck:**
- Timer sets phase to "complete" but nested `setTimeout(onComplete, 1500)` may not fire reliably
- The `onComplete` callback is in the dependency array which can cause issues

**Problem 2 - Dramatic Mode Stuck:**
- Auto-advance timer has similar nested timeout issue
- When at last player, sets phase to "complete" but nested onComplete may fail

**Solution:**
- Separate the "complete" phase transition from the `onComplete` callback
- Add a dedicated useEffect for the complete phase to call `onComplete`
- Remove `onComplete` from timer effect dependencies

**Changes to `NumberRevealAnimation.tsx`:**

```typescript
// Remove nested setTimeout, use dedicated effect for completion
useEffect(() => {
  if (phase === "complete") {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }
}, [phase, onComplete]);

// Instant mode - just transition to complete
useEffect(() => {
  if (phase === "instant") {
    const timer = setTimeout(() => {
      setPhase("complete");
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [phase]); // Remove onComplete from deps

// Dramatic mode - advance or complete
useEffect(() => {
  if (phase === "dramatic" && currentPlayerIndex < players.length) {
    const timer = setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
      } else {
        setPhase("complete");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [phase, currentPlayerIndex, players.length]); // Remove onComplete from deps
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/NumberRevealAnimation.tsx` | Replace Crown with Logo, remove emojis, fix timer logic |
| `src/pages/HostControl.tsx` | Filter entered wrestlers from entrants lists |

---

## Implementation Details

### NumberRevealAnimation.tsx Updates

1. **Import changes:**
   - Remove `Crown` from lucide-react imports
   - Add `import { Logo } from "@/components/Logo"`

2. **Timer refactor:**
   - Create single useEffect for "complete" phase that calls onComplete
   - Simplify instant/dramatic effects to only set phase

3. **UI text changes:**
   - Replace all emoji prefixes with plain text
   - Replace Crown components with Logo component

### HostControl.tsx Updates

1. **Filter logic:**
   - Build a Set of entered wrestler names (lowercase for case-insensitive matching)
   - Filter the combined entrants list to exclude already-entered names

---

## Testing Checklist

- [ ] Logo appears on choice screen instead of Crown
- [ ] Logo appears on complete screen instead of Crown
- [ ] No emojis in Men's/Women's labels
- [ ] Instant reveal completes and calls onComplete
- [ ] Dramatic reveal advances through all players
- [ ] Dramatic reveal completes after last player
- [ ] Skip button works in both modes
- [ ] Already-entered wrestlers don't appear in entry list
- [ ] Surprise entrants still work correctly

