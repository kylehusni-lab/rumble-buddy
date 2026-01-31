
# Fix: Save Picks Failures and iOS Safari Crashes

## Problem Analysis

Two distinct issues identified:

### 1. Failed to Save Picks
**Root Cause**: RLS policies require `auth.uid()` to match the player's `user_id`. If the auth session expires or there's a mismatch, the database operation fails silently.

**Evidence**: The `handleSubmit` function in `PickCardStack.tsx` catches errors but doesn't verify auth state before attempting to save.

### 2. Safari Crashes on iOS During Wrestler Selection
**Root Cause**: The `canvas-confetti` library creates canvas elements that iOS Safari fails to garbage collect properly. After multiple wrestler selections with confetti effects, memory accumulates and eventually causes Safari to crash.

**Evidence**: Web research confirms this is a known iOS Safari issue with canvas elements (WebKit bug #195325). The workaround is to call `confetti.reset()` after the animation completes.

---

## Solution

### Part 1: Add Confetti Memory Cleanup

Modify confetti usage to reset canvas after each animation completes:

| File | Change |
|------|--------|
| `RumbleWinnerCard.tsx` | Add `setTimeout(() => confetti.reset(), 3000)` after firing |
| `WrestlerPickerModal.tsx` | Add `setTimeout(() => confetti.reset(), 3000)` after firing |

```typescript
// Example pattern for safe confetti usage
confetti({
  particleCount: 80,
  spread: 60,
  origin: { y: 0.6 },
  colors: ['#D4AF37', '#4B0082', '#FFD700'],
});

// Clean up canvas memory after animation completes
setTimeout(() => {
  confetti.reset();
}, 3000);
```

### Part 2: Improve Pick Saving Error Handling

Add auth session verification before saving picks:

| File | Change |
|------|--------|
| `PickCardStack.tsx` | Verify auth session before save, show specific error messages |

```typescript
const handleSubmit = async () => {
  if (!playerId || isLocked) return;

  setIsSubmitting(true);
  setShowIncompleteWarning(false);

  try {
    // Verify auth session is still valid
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Your session has expired. Please sign in again.");
      navigate("/sign-in");
      return;
    }

    // ... rest of pick saving logic
  } catch (err) {
    console.error("Error submitting picks:", err);
    
    // Provide more specific error messages
    if (err instanceof Error && err.message.includes("RLS")) {
      toast.error("Permission denied. Please try signing in again.");
    } else {
      toast.error("Failed to save picks. Please try again.");
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### Part 3: Fix React forwardRef Warning

Wrap `BulkImportModal` with `forwardRef` to prevent the warning:

| File | Change |
|------|--------|
| `BulkImportModal.tsx` | Wrap component with `forwardRef` |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Add `confetti.reset()` cleanup after 3s timeout |
| `src/components/WrestlerPickerModal.tsx` | Add `confetti.reset()` cleanup after 3s timeout |
| `src/components/picks/PickCardStack.tsx` | Add auth session check before saving, improve error messages |
| `src/components/admin/BulkImportModal.tsx` | Wrap with `forwardRef` to fix React warning |

---

## Technical Notes

**Canvas Confetti Memory Issue**:
- iOS Safari has a hard limit on total canvas memory (~256MB on older devices)
- Canvas elements are not immediately garbage collected when dereferenced
- The `confetti.reset()` function explicitly clears the canvas and releases memory
- 3-second timeout ensures the animation completes before cleanup

**Auth Session Handling**:
- Supabase sessions can expire after inactivity
- Adding a session check before critical operations prevents silent failures
- Provides clear user feedback and recovery path

---

## Implementation Order

1. Add confetti cleanup to prevent iOS Safari crashes
2. Enhance pick saving with auth verification
3. Fix forwardRef warning in BulkImportModal

