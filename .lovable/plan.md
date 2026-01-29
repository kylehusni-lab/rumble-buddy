
# Fix Plan: Wrestler Selection Keyboard, Picker Count & Demo Mode

## Issues Identified

1. **Keyboard auto-opens on wrestler selection cards** - Mobile browsers focus search inputs automatically, consuming screen space
2. **Progress bar shows 9 picker slots, but only 8 cards exist** - The undercard_2 match was removed but ProgressBar wasn't updated
3. **Demo mode broken** - PlayerDashboard still references `undercard_2` which no longer exists

---

## Fix 1: Prevent Auto-Keyboard on Wrestler Selection

**Files to modify:**
- `src/components/picks/cards/RumbleWinnerCard.tsx`
- `src/components/WrestlerPickerModal.tsx`  
- `src/components/picks/cards/RumblePropsCard.tsx`

**Changes:**
Add `readOnly` attribute initially, then remove it on explicit tap. Or simpler: wrap the input in a collapsible/expandable state so users must tap "Search" to activate it, keeping the full wrestler grid visible by default.

**Recommended approach:** Add `inputMode="none"` and handle focus only on explicit user tap on the search field, or make search hidden by default with a small "Search" button that expands it.

---

## Fix 2: Update ProgressBar to Match 8 Cards

**File:** `src/components/picks/ProgressBar.tsx`

**Current (broken):**
```typescript
const CARD_GROUPS = [
  { name: "Undercard", range: [0, 2], icon: Trophy },  // 3 cards (0,1,2)
  { name: "Men's", range: [3, 5], icon: User },        // 3 cards (3,4,5)
  { name: "Women's", range: [6, 8], icon: User },      // 3 cards (6,7,8)
] // Total: 9 slots
```

**Fixed:**
```typescript
const CARD_GROUPS = [
  { name: "Undercard", range: [0, 1], icon: Trophy },  // 2 cards (0,1)
  { name: "Men's", range: [2, 4], icon: User },        // 3 cards (2,3,4)
  { name: "Women's", range: [5, 7], icon: User },      // 3 cards (5,6,7)
] // Total: 8 slots
```

---

## Fix 3: Update PlayerDashboard TAB_MATCH_IDS

**File:** `src/pages/PlayerDashboard.tsx`

**Current (broken):**
```typescript
matches: ['undercard_1', 'undercard_2', 'undercard_3', ...]
```

**Fixed:**
```typescript
matches: ['undercard_1', 'undercard_3', ...]
```

Remove `undercard_2` reference since that match no longer exists.

---

## Fix 4: Clean Up constants.ts MATCH_IDS (Optional)

**File:** `src/lib/constants.ts`

Consider removing `UNDERCARD_2` from `MATCH_IDS` to prevent future confusion, or leave it as a placeholder for potential future use.

---

## Testing Checklist

After implementation:
1. Open Solo Picks → Verify 8 dots in progress bar (2 undercard + 3 men's + 3 women's)
2. Navigate through all 8 cards → Verify correct navigation
3. Tap on wrestler grid → Verify keyboard does NOT auto-open
4. Tap search field explicitly → Verify keyboard opens
5. Run Demo Mode → Verify demo players created with correct picks
6. Open Player Dashboard → Verify matches tab shows 2 undercard matches

---

## Technical Notes

- The `CARD_CONFIG` array already has 8 cards (2 matches, 2 rumble winners, 2 chaos props, 2 rumble props)
- The demo seeder uses `UNDERCARD_MATCHES.forEach()` which will correctly iterate only the 2 existing matches
- The main bugs are in the ProgressBar hardcoded ranges and PlayerDashboard TAB_MATCH_IDS reference
