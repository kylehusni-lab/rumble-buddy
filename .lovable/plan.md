

# Fix Demo Mode Onboarding Tour Issues

## Problem Analysis

Based on the code review, I identified two issues with the guided tour:

1. **Guest Step Too Long**: The `guests-list` tour step targets the entire `Collapsible` component which includes the header AND the expanded guest cards. This creates a very tall highlight area.

2. **TV Mode Step Too Low**: The `tv-mode` step targets a button inside a fixed footer. The tooltip positioning uses `placement: "top"` but calculates position based on viewport coordinates, causing the tooltip to appear too low or partially off-screen.

---

## Solution

### 1. Fix Guest List Targeting

**Current**: Targets the entire collapsible container (`data-tour="guests-list"`)

**Fix**: Move the `data-tour` attribute to just the collapsible trigger (the header row) so only the "Guests (X)" bar is highlighted, not the expanded content.

**File**: `src/pages/HostSetup.tsx`
- Move `data-tour="guests-list"` from the outer `<motion.div>` to the `CollapsibleTrigger`'s inner div

### 2. Fix TV Mode Button Positioning

The issue is that for elements in a fixed footer, the tooltip appears too close to the bottom edge. Two changes needed:

**A. Shorten the content** (it's currently verbose):
- Current: "Cast this to your TV during the event. It shows the leaderboard, everyone's picks, and updates live as matches are scored."
- New: "Cast this to your TV during the event to show the live leaderboard and picks."

**B. Improve tooltip positioning for fixed elements**:
- Add logic in `TourOverlay.tsx` to detect when the target is near the viewport bottom and ensure the tooltip has adequate space above
- Increase the gap and ensure minimum distance from viewport bottom

**File**: `src/lib/demo-tour-steps.ts`
- Update content for cleaner, shorter text

**File**: `src/components/tour/TourOverlay.tsx`
- Improve "top" placement calculation to ensure tooltip stays visible for elements near the viewport bottom

---

## Implementation Details

### Changes to `src/pages/HostSetup.tsx`

Move the tour target from the wrapper to the trigger:

```tsx
// Before (line 422-427):
<motion.div
  ...
  data-tour="guests-list"
>
  <Collapsible open={guestsOpen} onOpenChange={setGuestsOpen}>
    <CollapsibleTrigger className="w-full">
      <div className="bg-card border...">

// After:
<motion.div ...>
  <Collapsible open={guestsOpen} onOpenChange={setGuestsOpen}>
    <CollapsibleTrigger className="w-full">
      <div className="bg-card border..." data-tour="guests-list">
```

### Changes to `src/lib/demo-tour-steps.ts`

Shorten verbose content:

```typescript
// Guest Status step - shorter content
{
  id: "guests-list",
  target: "[data-tour='guests-list']",
  title: "Guest Status",
  content: "Track each guest's progress. Green means picks are complete.",
  placement: "top",
},

// TV Mode step - shorter content  
{
  id: "tv-mode",
  target: "[data-tour='tv-mode']",
  title: "TV Display",
  content: "Cast this to your TV to show the live leaderboard and picks.",
  placement: "top",
},
```

### Changes to `src/components/tour/TourOverlay.tsx`

Improve top placement for fixed footer elements:

```typescript
case "top":
  // Ensure tooltip doesn't go above viewport
  tooltipTop = rect.top + window.scrollY - tooltipHeight - gap;
  // If element is in bottom portion of screen, ensure adequate space
  if (rect.top > window.innerHeight - 150) {
    tooltipTop = Math.max(16, rect.top + window.scrollY - tooltipHeight - gap - 20);
  }
  tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  break;
```

Also reduce the hardcoded `tooltipHeight` estimate from 160 to a more accurate value or calculate it dynamically after render.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/HostSetup.tsx` | Move `data-tour="guests-list"` to the trigger's inner div |
| `src/lib/demo-tour-steps.ts` | Shorten content for guest-list and tv-mode steps |
| `src/components/tour/TourOverlay.tsx` | Improve tooltip positioning for elements near viewport bottom |

