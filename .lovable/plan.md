
# SoloPicks and PickCardStack Layout Fixes

This plan addresses the broken desktop layout for the picks screens, reorganizes the header structure, removes the redundant "Back to Dashboard" link, constrains the desktop width, and adds a persistent Save button.

---

## Summary

The picks flow screens are too wide on desktop (spanning the full screen) and need to be constrained to look like the mobile view. Additionally:
- Remove the "Back to Dashboard" link at the bottom (redundant with Home icon)
- Reorganize header: Home icon + "Hey Kyle!" banner on TOP, progress bar BELOW it
- Add a persistent "Save" button in the bottom navigation (not just on the last card)
- Make Back/Next buttons more prominent with clear styling

---

## Visual Layout Changes

**Current Layout (broken on desktop):**
```
┌─────────────────────────────────────────────────────┐
│ Progress Bar (FIRST)                                │
├─────────────────────────────────────────────────────┤
│ 🏠 │              Synced / Hey Kyle!          │ [ ] │
├─────────────────────────────────────────────────────┤
│                                                     │
│    [Card content spreads too wide on desktop]       │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Back              1/9                          Next │
├─────────────────────────────────────────────────────┤
│              ← Back to Dashboard                    │  <- REMOVE
└─────────────────────────────────────────────────────┘
```

**New Layout (mobile-like on all screens):**
```
┌───────────────────────max-w-lg centered──────────────┐
│ 🏠 │              Synced / Hey Kyle!          │     │
├──────────────────────────────────────────────────────┤
│ Progress Bar (BELOW header)                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│    [Card content - constrained to max-w-md]          │
│                                                      │
├──────────────────────────────────────────────────────┤
│ ◀ Back      │   1/9   │  Next ▶  │    Save       │
└──────────────────────────────────────────────────────┘
```

---

## Changes Overview

### 1. Constrain Desktop Width

**Files:** `SoloPicks.tsx`, `PickCardStack.tsx`

Add a `max-w-lg mx-auto` container wrapper to center the entire layout and constrain it to ~32rem (512px) on larger screens:

```tsx
<div className="min-h-screen bg-background text-foreground flex flex-col">
  <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
    {/* All content inside constrained container */}
  </div>
</div>
```

---

### 2. Reorganize Header Structure

**Files:** `SoloPicks.tsx`, `PickCardStack.tsx`

Move the header (Home + "Hey Kyle!") ABOVE the progress bar:

```tsx
{/* Header with Home button FIRST */}
<div className="py-2 px-4 border-b border-border flex items-center justify-between">
  <button onClick={() => navigate("/solo/dashboard")} className="...">
    <Home className="w-5 h-5" />
  </button>
  <div className="text-center">
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      Synced
    </div>
    <div className="font-bold text-primary">Hey {displayName}!</div>
  </div>
  <div className="w-9" /> {/* Spacer */}
</div>

{/* Progress Bar SECOND */}
<ProgressBar
  currentIndex={currentCardIndex}
  completionStatus={cardCompletionStatus}
  onJumpToCard={setCurrentCardIndex}
/>
```

---

### 3. Remove "Back to Dashboard" Link

**File:** `PickCardStack.tsx`

Delete the redundant footer section (lines 431-440):

```tsx
// DELETE THIS SECTION:
{/* Back to Dashboard */}
<div className="p-2 text-center border-t border-border">
  <Button variant="link" onClick={...}>
    ← Back to Dashboard
  </Button>
</div>
```

---

### 4. Add Persistent Save Button in Navigation

**Files:** `SoloPicks.tsx`, `PickCardStack.tsx`

Change the bottom navigation bar to always show a centered Save button (not just on last card):

**Current Structure:**
```
| Back |       1/9       | Next (or Save on last card) |
```

**New Structure:**
```
| ◀ Back |    [Save]    |  1/9  |  Next ▶ |
```

Updated navigation component:

```tsx
<div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-card">
  {/* Back Button - clear variant with outline when enabled */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleSwipe("left")}
    disabled={currentCardIndex === 0}
    className="flex items-center gap-1 min-w-[80px]"
  >
    <ChevronLeft className="w-4 h-4" />
    Back
  </Button>

  {/* Center: Save button always visible */}
  <Button
    onClick={handleSaveClick}
    disabled={isSubmitting}
    variant={allPicksComplete ? "default" : "outline"}
    size="sm"
    className={cn(
      "flex items-center gap-1",
      allPicksComplete && "gold-shimmer"
    )}
  >
    {isSubmitting ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Saving...
      </>
    ) : (
      <>
        <Save className="w-4 h-4" />
        Save
      </>
    )}
  </Button>

  {/* Page Indicator */}
  <span className="text-xs text-muted-foreground min-w-[40px] text-center">
    {currentCardIndex + 1}/{TOTAL_CARDS}
  </span>

  {/* Next Button */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleSwipe("right")}
    disabled={currentCardIndex === TOTAL_CARDS - 1}
    className="flex items-center gap-1 min-w-[80px]"
  >
    Next
    <ChevronRight className="w-4 h-4" />
  </Button>
</div>
```

---

### 5. Ensure Card Content Stays Constrained

**Files:** `SoloPicks.tsx`, `PickCardStack.tsx`

The card container already has `max-w-md` but ensure it's centered properly within the constrained layout:

```tsx
<div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0 overflow-hidden">
  <motion.div className="w-full max-w-md h-full">
    {/* Card content */}
  </motion.div>
</div>
```

---

## Technical Details

### Files to Modify

1. `src/pages/SoloPicks.tsx`
   - Add max-w-lg container wrapper
   - Move header above ProgressBar
   - Update navigation bar with persistent Save + clearer Back/Next buttons

2. `src/components/picks/PickCardStack.tsx`
   - Add max-w-lg container wrapper
   - Move header above ProgressBar
   - Remove "Back to Dashboard" link
   - Update navigation bar with persistent Save + clearer Back/Next buttons

### Desktop vs Mobile Behavior

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Container width | 100% | max-w-lg (512px) centered |
| Card width | max-w-md | max-w-md |
| Navigation buttons | Compact | Same size, centered |
| Save button | Always visible | Always visible |

### Component Structure

```text
SoloPicks / PickCardStack
├── Container (max-w-lg mx-auto)
│   ├── Header (Home + "Hey {name}!")
│   ├── ProgressBar
│   ├── Card Container (flex-1, overflow)
│   │   └── Card (max-w-md)
│   └── Navigation Bar
│       ├── Back Button (outline)
│       ├── Save Button (centered, gold when complete)
│       ├── Page Indicator
│       └── Next Button (outline)
└── AlertDialog (for incomplete warning)
```

---

## Summary of Changes

| Change | SoloPicks.tsx | PickCardStack.tsx |
|--------|---------------|-------------------|
| Add max-w-lg container | ✓ | ✓ |
| Move header above ProgressBar | ✓ | ✓ |
| Add persistent Save button | ✓ | ✓ |
| Make Back/Next outline buttons | ✓ | ✓ |
| Remove Back to Dashboard | N/A (already removed) | ✓ |
