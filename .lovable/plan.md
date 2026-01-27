
# Fix Picks Flow, Start Match Logic, and Surprise Entrant UI

## Overview

This plan addresses five issues found in the host control and player picks flow:

1. **Final Four picks not visible** - Scrolling issue on RumblePropsCard
2. **Laggy sliding animation** - Overly complex spring animation 
3. **Number reveal timing** - Show reveal BEFORE the "Let's Rumble" announcement
4. **Start Match button logic** - Should appear once 2 entrants are named, not disappear at #3
5. **Surprise entrant UI duplication** - Consolidate the two separate "add surprise" options

---

## 1. Final Four Visibility Fix

### Problem
The Final Four section may be cut off due to height constraints on the card. The `max-h-[calc(100vh-220px)]` on the container plus ScrollArea may not scroll properly on all devices.

### Solution
Add explicit padding at the bottom of the scrollable content to ensure the Final Four section is always visible, and add a visual indicator to prompt scrolling.

### File: `src/components/picks/cards/RumblePropsCard.tsx`

**Changes:**
- Increase bottom padding in ScrollArea content from `pb-4` to `pb-8`
- Add a subtle "scroll for more" indicator when content is cut off
- Consider reducing the gap between elements to fit more content in view

---

## 2. Smoother Slide Animation

### Problem
The current animation uses spring physics with scale transformation that creates a "bouncy" feel perceived as laggy.

### Solution
Simplify the animation to use a cleaner tween transition without the scale effect.

### File: `src/components/picks/PickCardStack.tsx`

**Changes:**
Replace the complex spring animation with a simpler tween:

```typescript
// Current (lines 274-289)
initial={{ x: direction, opacity: 0, scale: 0.8 }}
animate={{ x: 0, opacity: 1, scale: 1 }}
exit={{ x: -direction, opacity: 0, scale: 0.8 }}
transition={{ type: "spring", damping: 25, stiffness: 200 }}

// Updated - cleaner slide with no scale
initial={{ x: direction, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
exit={{ x: -direction, opacity: 0 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

---

## 3. Number Reveal Timing

### Problem
When the event goes live, the player sees their numbers revealed, but then the "LET'S RUMBLE!" announcement appears on top, making the sequence feel disconnected.

### Solution
The NumberRevealAnimation already flows: choice → reveal → "complete" phase (LET'S RUMBLE!). The issue is that once complete, the dashboard immediately loads behind it. We should ensure the entire animation plays through before marking as seen.

### File: `src/pages/PlayerDashboard.tsx`

**Changes:**
The `onComplete` callback already marks the reveal as seen. No change needed here - the current flow is:
1. Show number reveal animation
2. Animation goes through phases
3. User clicks "Let's Go!" button
4. `onComplete` triggers, marking reveal as seen
5. Dashboard renders

This is the intended behavior. If there's a visual overlap, it may be a z-index issue with the celebration overlay.

---

## 4. Fix Start Match Button Logic

### Problem
Current logic in `RumbleEntryControl.tsx` line 42:
```typescript
const showMatchStartUI = nextNumber <= 2 && !matchStarted;
```

This hides the button when `nextNumber` becomes 3 (after 2 wrestlers entered). But the button should:
- Appear once we have 2 entrants entered
- Stay visible until host clicks "Start Match"

### Solution
Change the condition to check `enteredCount >= 2` instead of `nextNumber <= 2`.

### File: `src/components/host/RumbleEntryControl.tsx`

**Change line 42:**
```typescript
// Before
const showMatchStartUI = nextNumber <= 2 && !matchStarted;

// After - Show when at least 1 entrant AND match hasn't started
// The button is enabled only when enteredCount >= 2
const showMatchStartUI = !matchStarted;
```

**Update the button disabled condition (line 119):**
```typescript
// Before
disabled={disabled || enteredCount === 0}

// After - require 2 entrants minimum
disabled={disabled || enteredCount < 2}
```

This shows the Start Match UI section from the beginning, with the button disabled until 2 wrestlers are entered.

---

## 5. Consolidate Surprise Entrant UI

### Problem
Two separate ways to add a surprise entrant:
1. When search has no results - "Add [query] as Surprise" button
2. At bottom of list - "Add Surprise Entrant" button (opens modal)

This is confusing and duplicative.

### Solution
Consolidate into a single, cleaner flow:
- Remove the bottom "Add Surprise Entrant" button from the list
- Keep the inline "Add as Surprise" option when search returns no results
- Add a quick-add that uses the search query directly (no modal needed for simple case)

### File: `src/components/host/RumbleEntryControl.tsx`

**Changes:**
1. Remove lines 177-189 (the bottom "Add Surprise Entrant" button)
2. When search has no results, add the wrestler directly using `searchQuery` instead of opening modal
3. Keep the modal available but only accessible via a smaller "Other" link for edge cases

**Updated empty state UI (lines 157-175):**
```typescript
) : searchQuery.length > 0 ? (
  <div className="p-4 text-center space-y-3">
    <p className="text-sm text-muted-foreground">
      No wrestlers match "{searchQuery}"
    </p>
    <Button
      variant="outline"
      className="w-full min-h-[44px] border-primary text-primary"
      onClick={() => {
        onAddSurprise(searchQuery.trim());
        setSelectedWrestler(searchQuery.trim());
        setSearchQuery("");
      }}
      disabled={!searchQuery.trim()}
    >
      <Sparkles size={16} className="mr-2" />
      Add "{searchQuery}" as Entry
    </Button>
  </div>
)
```

Remove the modal entirely since direct addition is cleaner.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/components/picks/cards/RumblePropsCard.tsx` | Increase bottom padding for Final Four visibility |
| `src/components/picks/PickCardStack.tsx` | Simplify animation (remove scale, use tween) |
| `src/components/host/RumbleEntryControl.tsx` | Fix Start Match visibility logic, consolidate surprise UI |

---

## Technical Notes

### Animation Performance
The simpler `tween` animation with `ease: "easeOut"` is more performant than spring physics with scale transforms, especially on mobile devices.

### Start Match Flow
With the updated logic:
- Host enters wrestler #1 → "Start Match" button visible but disabled
- Host enters wrestler #2 → "Start Match" button becomes enabled
- Host clicks "Start Match" → Both wrestlers get entry timestamps, match is live
- Host enters wrestler #3+ → Timestamps set immediately

### Surprise Entrant Flow
Simplified to:
- Host searches for a wrestler
- If not found, one-tap to add as surprise and select them
- No modal popup needed for the common case
