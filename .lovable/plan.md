
# Progress Bar Grouping, Chaos Props Consolidation, Winner Styling & Modal Cleanup

## Overview

This plan addresses four improvements to enhance the user experience:

1. Group progress bar dots by category (Undercard, Men's, Women's)
2. Consolidate Chaos Props into Men's/Women's tabs on the dashboard with collapsible sections
3. Style Rumble Winner picks with a distinct purple color to differentiate from matches
4. Clean up the wrestler picker modal for better visibility when keyboard is open

---

## 1. Progress Bar Grouping

**File: `src/components/picks/ProgressBar.tsx`**

Update the dot indicators to show grouped sections with labels:

**Current Layout:**
```
[1] [2] [3] [4] [5] [6] [7] [8] [9]
```

**New Layout:**
```
UNDERCARD          MEN'S              WOMEN'S
[1] [2] [3]     [4] [5] [6]       [7] [8] [9]
```

Changes:
- Add section labels above dot groups
- Group dots into 3 sections with visual separators
- Use section progress indicators instead of individual dots for a cleaner look
- Show section completion counts (e.g., "2/3", "3/3")

---

## 2. Consolidate Chaos Props into Men's/Women's Tabs

**Files:**
- `src/components/dashboard/BottomNavBar.tsx` - Remove "Chaos" tab
- `src/components/dashboard/RumblePropsSection.tsx` - Add chaos props with collapsible section
- `src/pages/PlayerDashboard.tsx` - Remove chaos tab logic, update badge calculations

**Current Bottom Nav:**
```
Numbers | Matches | Men's | Women's | Chaos
```

**New Bottom Nav:**
```
Numbers | Matches | Men's | Women's
```

**Dashboard Men's/Women's Sections (with collapsible):**
```
┌─────────────────────────────────┐
│ 🧔 MEN'S RUMBLE PROPS           │
├─────────────────────────────────┤
│ First Elimination               │
│ Most Eliminations               │
│ ...                             │
├─────────────────────────────────┤
│ 🧔 FINAL FOUR PREDICTIONS       │
│ Final Four #1, #2, #3, #4       │
├─────────────────────────────────┤
│ ⚡ CHAOS PROPS      [▼ Collapse]│ <- Collapsible
│ Kofi/Logan Save                 │
│ Bushwhacker Exit                │
│ ...                             │
└─────────────────────────────────┘
```

---

## 3. Rumble Winner Pick - Different Color

**File: `src/components/dashboard/MatchesSection.tsx`**

Update the Rumble Winners section to use a distinct purple/violet color scheme:

Changes:
- Add a purple accent color for Rumble Winner picks
- Use `bg-purple-500/10` border and `text-purple-400` for winner predictions
- Add a crown icon next to winner predictions
- This visually distinguishes them from undercard match picks

Also update the pick card display:
- **File: `src/components/picks/cards/RumbleWinnerCard.tsx`** - Keep gold theme but ensure selection is prominent

---

## 4. Wrestler Picker Modal Cleanup

**File: `src/components/WrestlerPickerModal.tsx`**

Issues from screenshot:
- Search input is at the top, pushing content down when keyboard opens
- Modal appears cramped on mobile

Fixes:
- Move search input to be sticky and add padding for safe areas
- Add better backdrop and spacing
- Reduce grid size for smaller mobile screens
- Add a "Done" button in the header
- Ensure modal has proper safe area insets for keyboard

---

## Technical Implementation Details

### Progress Bar Changes
```typescript
// Group structure
const CARD_GROUPS = [
  { name: "Undercard", range: [0, 2], icon: Trophy },
  { name: "Men's", range: [3, 5], icon: User },
  { name: "Women's", range: [6, 8], icon: User },
];

// Render grouped dots with labels
```

### Collapsible Section Component
```typescript
// Use Radix Collapsible for the chaos props
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// In RumblePropsSection
<Collapsible defaultOpen={true}>
  <CollapsibleTrigger className="...">
    ⚡ Chaos Props <ChevronDown />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Chaos prop rows */}
  </CollapsibleContent>
</Collapsible>
```

### Rumble Winner Color Scheme
```typescript
// Add purple variant for winners
const isWinner = matchId.includes("rumble_winner");
className={cn(
  "border",
  isWinner 
    ? "border-purple-500/30 bg-purple-500/5" 
    : "border-border"
)}
```

### Modal Improvements
```typescript
// Better positioning and safe areas
<div className="fixed inset-0 z-50 bg-background">
  {/* Sticky header with safe area */}
  <div className="sticky top-0 z-10 bg-background" 
       style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
    {/* Title, Close, Done button */}
  </div>
  
  {/* Content area that doesn't shift with keyboard */}
  <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
    {/* Wrestler grid */}
  </div>
</div>
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/picks/ProgressBar.tsx` | Modify | Group dots by section with labels |
| `src/components/dashboard/BottomNavBar.tsx` | Modify | Remove "Chaos" tab |
| `src/components/dashboard/RumblePropsSection.tsx` | Modify | Add collapsible chaos props section |
| `src/pages/PlayerDashboard.tsx` | Modify | Remove chaos tab, update badge logic |
| `src/components/dashboard/MatchesSection.tsx` | Modify | Purple color scheme for Rumble Winners |
| `src/components/WrestlerPickerModal.tsx` | Modify | Better mobile layout, safe areas |

---

## User Experience Improvements

**Progress Bar:**
- Clearer visual grouping shows completion by category
- Easier to see if you've completed all undercard vs rumble picks

**Dashboard Navigation:**
- Simpler 4-tab layout (fewer taps)
- All rumble-related content in one place per gender
- Collapsible chaos keeps the view clean but accessible

**Winner Styling:**
- Purple color immediately signals "this is a special pick"
- Crown icon reinforces importance
- Distinct from the gold/primary theme of regular picks

**Modal:**
- No content jump when keyboard appears
- Better spacing and readability
- Clear Done/Close action
