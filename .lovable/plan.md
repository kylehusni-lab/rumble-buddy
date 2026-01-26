

# Plan: Fix Card Scrolling & Improve Swipe Behavior

## Overview
Two issues need to be fixed:
1. **Card content cutoff** - Rumble participants and Chaos Props are getting cut off at the bottom on mobile devices
2. **Swipe behavior** - The current drag behavior moves the card during swiping, which conflicts with vertical scrolling and feels imprecise

---

## Issue Analysis

### Issue 1: Content Cutoff

**Problem**: The `max-h-[70vh]` constraint is too restrictive on mobile devices, especially when there are many wrestlers or all 6 chaos props to display.

**Root Cause**: 
- Cards have fixed `max-h-[70vh]` which doesn't account for varying screen sizes
- The ScrollArea needs explicit height to know how much to scroll

**Solution**: Remove the percentage-based max-height and instead use a more flexible approach with `flex-1` and proper overflow handling in the parent container.

### Issue 2: Swipe Behavior

**Problem**: The current implementation uses Framer Motion's `drag="x"` which:
- Visually moves the card as you drag (looks like scrolling)
- Conflicts with vertical scrolling inside the card
- Doesn't feel like an intentional "swipe to navigate" action

**Solution**: Replace the drag-based swipe with touch event handlers that:
- Detect horizontal swipe gestures without moving the card
- Only trigger navigation after a complete swipe gesture
- Don't interfere with vertical scrolling inside the card

---

## Technical Approach

### Card Height Fix

**Files to modify:**
- `src/components/picks/PickCardStack.tsx`
- `src/components/picks/cards/RumbleWinnerCard.tsx`
- `src/components/picks/cards/ChaosPropsCard.tsx`

**Changes:**

1. **PickCardStack.tsx** - Update card container to use calc-based height that accounts for header, progress bar, and footer:
```tsx
// Card container - explicit height calculation
<div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0">
```

2. **RumbleWinnerCard.tsx & ChaosPropsCard.tsx** - Remove rigid max-height, use parent-constrained height:
```tsx
// Change from:
max-h-[70vh]

// Change to:
h-full max-h-[calc(100vh-220px)]
```

This ensures the card takes available space while leaving room for progress bar, header, navigation controls.

### Swipe Gesture Fix

**File to modify:**
- `src/components/picks/PickCardStack.tsx`

**Changes:**

1. **Remove `drag="x"`** from the motion.div - the card should not visually move during swipes

2. **Add touch event handlers** to detect swipes without visual dragging:
```tsx
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);

const minSwipeDistance = 50; // Minimum swipe distance in pixels

const onTouchStart = (e: React.TouchEvent) => {
  setTouchEnd(null);
  setTouchStart(e.targetTouches[0].clientX);
};

const onTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const onTouchEnd = () => {
  if (!touchStart || !touchEnd) return;
  
  const distance = touchStart - touchEnd;
  const isLeftSwipe = distance > minSwipeDistance;
  const isRightSwipe = distance < -minSwipeDistance;
  
  if (isLeftSwipe && currentCardIndex < TOTAL_CARDS - 1) {
    handleSwipe("right"); // Swipe left = go forward
  } else if (isRightSwipe && currentCardIndex > 0) {
    handleSwipe("left"); // Swipe right = go back
  }
};
```

3. **Keep card animations** for transitions between cards (the enter/exit animations still work)

4. **Remove dragConstraints, dragElastic, onDragEnd** - no longer needed

---

## Visual Comparison

### Before (Current Swipe)
```text
User touches card → Card follows finger → Card snaps back → Navigation triggered
Problem: Card movement during drag conflicts with scrolling
```

### After (New Swipe)
```text
User swipes horizontally → Card stays in place → Swipe completes → Card animates out/in
Benefit: Clean gesture detection, no conflict with vertical scrolling
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `PickCardStack.tsx` | Replace drag with touch handlers, adjust container height |
| `RumbleWinnerCard.tsx` | Change `max-h-[70vh]` to `h-full max-h-[calc(100vh-220px)]` |
| `ChaosPropsCard.tsx` | Change `max-h-[70vh]` to `h-full max-h-[calc(100vh-220px)]` |

---

## Summary

1. **Better card heights**: Use `calc(100vh - 220px)` to ensure cards fit the viewport while leaving room for UI chrome
2. **Clean swipe detection**: Use touch events instead of drag behavior so the card doesn't move during swipes
3. **Preserve scrolling**: Internal ScrollArea continues to work for long content without gesture conflicts
4. **Keep animations**: Card enter/exit animations remain smooth and intentional

