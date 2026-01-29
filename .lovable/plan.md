

# Fix Plan: Consistent Picking Experience (Solo & Group)

## Issues Identified

### 1. Search Input Still Auto-Focusing
The `RumbleWinnerCard.tsx` search input is missing `autoFocus={false}` which causes the mobile keyboard to auto-open and obscure the wrestler grid. While the previous fix added `autoFocus={false}` to other cards, the main RumbleWinnerCard was missed.

### 2. Inconsistent Scrolling & Navigation Visibility
The pick cards have inconsistent height constraints. Some cards like `MatchCard` don't fill the container properly, and on taller Rumble/Chaos cards, the navigation footer can get pushed out of view due to the card's internal scrolling fighting with the page structure.

**Root cause**: The cards use `max-h-[calc(100vh-220px)]` but this doesn't account for the parent container's flex structure, leading to overflow issues on mobile.

### 3. Header & Footer Inconsistency Between Solo and Group
- **Solo Picks** (`SoloPicks.tsx`): Uses `Home` icon in header, shows sync status
- **Group Picks** (`PickCardStack.tsx`): Uses `ArrowLeft` icon, shows party code

Both need consistent visual hierarchy:
- Same header structure (back button, title/status, spacer)
- Same fixed footer with Back/Save/Next buttons
- Same swipe hint placement

---

## Fix 1: Add Missing `autoFocus={false}` to RumbleWinnerCard

**File:** `src/components/picks/cards/RumbleWinnerCard.tsx`

Add the missing `autoFocus={false}` attribute to prevent the keyboard from auto-opening when the card renders.

---

## Fix 2: Fix Page Layout to Ensure Footer Always Visible

**Files:** `src/pages/SoloPicks.tsx` and `src/components/picks/PickCardStack.tsx`

The page layout needs to properly constrain the card area so the navigation footer is never pushed off-screen:

1. Change the card container from `flex-1` with internal overflow to a constrained height that respects the viewport minus header, progress bar, and footer heights
2. Use a fixed calculation: `h-[calc(100vh-{header+progress+footer}px)]` 
3. Move overflow handling inside the card container rather than letting cards fight for space

**Current structure (problematic):**
```
h-screen flex-col
├── header (shrink-0)
├── progress bar (shrink-0)
├── card container (flex-1, overflow-hidden) ← cards can push footer off
├── swipe hint
└── footer (shrink-0)
```

**Fixed structure:**
```
h-screen flex-col
├── header (shrink-0)
├── progress bar (shrink-0)
├── card container (flex-1, min-h-0, overflow-hidden)
│   └── card (h-full, internal scroll)
├── swipe hint (shrink-0)
└── footer (shrink-0)
```

Key changes:
- Add `min-h-0` to card container to allow proper flex shrinking
- Remove fixed `max-h-[calc(...)]` from cards and let them fill parent
- Ensure cards use `h-full` and internal `overflow-y-auto` for their scrollable areas

---

## Fix 3: Add `autoFocus={false}` to Final Four Modal

**File:** `src/components/picks/cards/RumblePropsCard.tsx` (line ~466-473)

The Final Four modal search input is missing `autoFocus={false}`:

```tsx
<Input
  type="text"
  placeholder="Search wrestlers..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-10"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  autoFocus={false}      // ADD
  inputMode="search"     // ADD
  enterKeyHint="search"  // ADD
/>
```

---

## Fix 4: Standardize Card Height Constraints

**Files:** All pick cards

Remove `max-h-[calc(100vh-XXXpx)]` from individual cards and instead let them inherit from their parent container:

| File | Current | Fixed |
|------|---------|-------|
| `RumbleWinnerCard.tsx` | `max-h-[calc(100vh-220px)]` | `h-full` |
| `ChaosPropsCard.tsx` | `max-h-[calc(100vh-220px)]` | `h-full` |
| `RumblePropsCard.tsx` | `max-h-[calc(100vh-180px)]` | `h-full` |
| `MatchCard.tsx` | `min-h-[300px]` (keep as minimum) | No change needed |

The parent container in `SoloPicks.tsx` and `PickCardStack.tsx` will control the height.

---

## Technical Summary

| Change | File(s) | Impact |
|--------|---------|--------|
| Add `autoFocus={false}` to search | `RumbleWinnerCard.tsx`, `RumblePropsCard.tsx` (Final Four) | Prevents keyboard auto-open |
| Fix flex container with `min-h-0` | `SoloPicks.tsx`, `PickCardStack.tsx` | Footer always visible |
| Standardize card heights to `h-full` | All 4 pick card components | Consistent sizing |
| Add missing input attributes | `RumblePropsCard.tsx` (Final Four modal) | Search UX consistency |

---

## Testing Checklist

After implementation:
1. Open Solo Picks on mobile - verify footer (Back/Save/Next) is always visible on all 8 cards
2. Navigate to RumbleWinnerCard - verify keyboard does NOT auto-open
3. Navigate to Chaos Props card - verify content scrolls and footer stays fixed
4. Tap Final Four in Rumble Props - verify search doesn't auto-focus
5. Test Group Picks flow - verify same behavior as Solo
6. Compare Solo and Group header/footer - verify visual consistency

