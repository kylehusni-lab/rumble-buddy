

# Simplify Gold Button Styling

## Problem

The `gold` and `hero` button variants use a `gold-shimmer` CSS class that applies a continuously looping gradient animation. This creates a "shaky" or distracting appearance that conflicts with the preference for clean, purposeful UI.

## Current State

**Button variants using shimmer:**
- `gold`: Used for standard gold-styled buttons
- `hero`: Used for large call-to-action buttons (like "Start Party" on the home page)

**The shimmer effect:**
```css
.gold-shimmer {
  background: linear-gradient(110deg, gold1, gold2, gold1, gold1);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}
```

This constantly animates the background position, creating movement.

---

## Solution

Remove the shimmer animation and replace with a clean, static gold gradient that still looks premium but doesn't move. Keep a subtle hover effect for interactivity.

---

## Changes

### File: `src/index.css`

**Replace the shimmer class with a static gold gradient:**

```css
/* Before */
.gold-shimmer {
  background: linear-gradient(110deg, ...);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

/* After */
.gold-shimmer {
  background: linear-gradient(
    135deg,
    hsl(43 85% 58%) 0%,
    hsl(43 75% 52%) 50%,
    hsl(38 80% 48%) 100%
  );
}
```

**Remove the shimmer keyframes** (no longer needed):
```css
/* DELETE this entire block */
@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}
```

### File: `src/components/ui/button.tsx`

**Update gold button hover effect for subtle feedback:**

The existing hover effects (`hover:shadow-[...]` and `hover:scale-[1.02]`) will still provide good visual feedback without the constant animation.

No changes needed here - the button file is already fine once the CSS shimmer is removed.

---

## Visual Result

| State | Before | After |
|-------|--------|-------|
| Idle | Constantly animating gradient | Clean static gold gradient |
| Hover | Glow + scale + animation | Glow + scale (static gradient) |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Replace animated shimmer with static gradient, remove keyframes |

