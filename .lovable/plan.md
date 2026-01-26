
# Plan: Fix Card Content Scrolling Issue

## Problem Analysis

The `ScrollArea` component (from Radix UI) requires an **explicit height** to enable scrolling. Currently, the cards use `flex-1` inside a `max-h-[calc(100vh-220px)]` container, but this doesn't give `ScrollArea` the computed height it needs to know when to scroll.

**The layout breakdown:**
- Progress Bar: ~120px (text + bar + dots)
- Party Code Header: ~50px
- Card Padding: 24px (p-6)
- Navigation Footer: ~60px
- Back to Dashboard: ~40px

**Total fixed height: ~300px**

The 220px calculation was too small, leaving the card container without proper constraints.

---

## Solution

### Approach: Use a dedicated scroll container with explicit height

Instead of relying on `flex-1` cascading to `ScrollArea`, we'll:
1. Give the card container an explicit calculated height
2. Use CSS `overflow-y-auto` as a fallback alongside `ScrollArea`
3. Ensure the cards have proper internal structure for scrolling

---

## Files to Modify

### 1. `src/components/picks/PickCardStack.tsx`

**Changes:**
- Update the card container to have explicit height constraints that work on mobile

```tsx
// Line 202 - Change from:
<div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0">

// Change to:
<div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0 overflow-hidden">
```

- Ensure motion.div allows children to scroll properly

### 2. `src/components/picks/cards/RumbleWinnerCard.tsx`

**Changes:**
- Give ScrollArea explicit height using `h-[calc(100%-HeaderHeight)]` approach
- Add `overflow-y-auto` as a fallback

```tsx
// Line 51 - Update main container:
<div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col h-full max-h-[calc(100vh-220px)]">

// Line 90 - Update ScrollArea wrapper to have explicit flex-1 with overflow:
<ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
```

### 3. `src/components/picks/cards/ChaosPropsCard.tsx`

**Same changes as RumbleWinnerCard:**
- Ensure ScrollArea has proper overflow fallback

---

## Root Cause & Real Fix

The real issue is that `ScrollArea` from Radix needs a **bounded parent**. With `flex-1`, the height is dynamic and `ScrollArea` can't compute when to show scrollbars.

**The fix:**
1. Keep `h-full max-h-[calc(100vh-220px)]` on the card (this is correct)
2. Add `overflow-hidden` to the parent container in PickCardStack (prevents content bleed)
3. Add `overflow-y-auto` as a CSS fallback to the ScrollArea wrapper

This ensures even if `ScrollArea` JS-based scrolling doesn't work, native CSS overflow will kick in.

---

## Summary of Changes

| File | Line | Change |
|------|------|--------|
| `PickCardStack.tsx` | 202 | Add `overflow-hidden` to card container |
| `RumbleWinnerCard.tsx` | 90 | Add `overflow-y-auto` fallback to ScrollArea |
| `ChaosPropsCard.tsx` | 44 | Add `overflow-y-auto` fallback to ScrollArea |

---

## Expected Behavior After Fix

1. **Rumble Winner Card**: Wrestler grid scrolls smoothly, all participants visible via scrolling
2. **Chaos Props Card**: All 6 props accessible via scrolling
3. **Swipe gestures**: Continue to work without interfering with vertical scroll
4. **Bottom content**: `pb-8` padding ensures last items aren't cut off

