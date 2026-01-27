
# Add Rumble Prediction Props

## Overview

Add new Rumble-specific prediction props where players can guess wrestlers for key milestones. These are different from the existing YES/NO "Chaos Props" - most require selecting wrestlers from the entrant list.

---

## New Props Structure

### Per Rumble (Men's & Women's)

| Prop ID | Name | Type | Description |
|---------|------|------|-------------|
| `{gender}_first_elimination` | First Eliminated | Wrestler Select | Who gets eliminated first? |
| `{gender}_most_eliminations` | Most Eliminations | Wrestler Select | Who will have the most eliminations? |
| `{gender}_longest_time` | Iron Man/Woman | Wrestler Select | Who lasts the longest in the ring? |
| `{gender}_final_four_1-4` | Final Four | 4x Wrestler Select | Pick 4 wrestlers in Final Four |
| `{gender}_entrant_1` | #1 Entrant | Wrestler Select | Who enters at #1? |
| `{gender}_entrant_30` | #30 Entrant | Wrestler Select | Who enters at #30? |
| `{gender}_no_show` | No-Show | YES/NO | Will anyone not make it to the ring? |

**Total: 10 new predictions per Rumble = 20 new picks overall**

---

## Scoring

| Prediction | Points |
|------------|--------|
| First Elimination | +10 |
| Most Eliminations | +20 |
| Longest Time | +20 |
| Final Four (each correct) | +10 |
| #1 Entrant | +15 |
| #30 Entrant | +15 |
| No-Show Prop | +10 |

---

## File Changes

### 1. Constants Update (`src/lib/constants.ts`)

Add new prop definitions and scoring values:

```typescript
export const RUMBLE_PROPS = [
  { id: 'first_elimination', title: 'First Eliminated', question: 'Who gets eliminated first?', type: 'wrestler' },
  { id: 'most_eliminations', title: 'Most Eliminations', question: 'Who has the most eliminations?', type: 'wrestler' },
  { id: 'longest_time', title: 'Iron Man/Woman', question: 'Who lasts longest in the ring?', type: 'wrestler' },
  { id: 'entrant_1', title: '#1 Entrant', question: 'Who enters at #1?', type: 'wrestler' },
  { id: 'entrant_30', title: '#30 Entrant', question: 'Who enters at #30?', type: 'wrestler' },
  { id: 'no_show', title: 'No-Show', question: 'Will anyone not make it to the ring?', type: 'yesno' },
] as const;

export const FINAL_FOUR_SLOTS = 4;
```

Update MATCH_IDS:

```typescript
// Men's Rumble Props
MENS_FIRST_ELIMINATION: 'mens_first_elimination',
MENS_MOST_ELIMINATIONS: 'mens_most_eliminations',
MENS_LONGEST_TIME: 'mens_longest_time',
MENS_FINAL_FOUR_1: 'mens_final_four_1',
// ... etc
```

Update SCORING:

```typescript
FIRST_ELIMINATION: 10,
MOST_ELIMINATIONS: 20,
LONGEST_TIME: 20,
FINAL_FOUR_PICK: 10,
ENTRANT_GUESS: 15,
NO_SHOW_PROP: 10,
```

Update CARD_CONFIG to include new card types.

---

### 2. New Card Component (`src/components/picks/cards/RumblePropsCard.tsx`)

Create a new card that handles both wrestler-select and YES/NO props for Rumble predictions:

- Header with icon and progress indicator
- List of props with:
  - Wrestler selector button (opens picker modal) for wrestler-type props
  - YES/NO buttons for no_show prop
- "Final Four" section with 4 wrestler slots
- Completion indicator when all filled

---

### 3. Update Pick Card Stack (`src/components/picks/PickCardStack.tsx`)

- Import and render new `RumblePropsCard` component
- Add new card type handler: `rumble-props`
- Update submission logic to include new prop types
- Update completion calculation for the new card type

---

### 4. Update CARD_CONFIG Flow

Change the card flow to:

```typescript
export const CARD_CONFIG = [
  // Undercard matches
  { type: 'match', id: 'undercard_1', ... },
  { type: 'match', id: 'undercard_2', ... },
  { type: 'match', id: 'undercard_3', ... },
  
  // Men's Rumble
  { type: 'rumble-winner', id: 'mens_rumble_winner', ... },
  { type: 'rumble-props', id: 'mens_rumble_props', title: "Men's Rumble Props", gender: 'mens' },
  { type: 'chaos-props', id: 'mens_chaos_props', ... },
  
  // Women's Rumble  
  { type: 'rumble-winner', id: 'womens_rumble_winner', ... },
  { type: 'rumble-props', id: 'womens_rumble_props', title: "Women's Rumble Props", gender: 'womens' },
  { type: 'chaos-props', id: 'womens_chaos_props', ... },
] as const;
```

**Total cards: 9 (was 7)**

---

### 5. Host Scoring Updates (`src/pages/HostControl.tsx`)

Add scoring for new prop types:

- **First Elimination**: Auto-score when first wrestler is eliminated
- **Most Eliminations**: Calculate at Rumble end from elimination data
- **Longest Time**: Already tracked, score at winner declaration
- **Final Four**: Score when Final Four milestone is reached
- **#1/#30 Entrants**: Score when those wrestlers are confirmed
- **No-Show**: Manual YES/NO button (like chaos props)

Add a new "Rumble Props" section in the Rumble tabs with:
- Auto-scored props shown with green checkmarks
- Manual score button for No-Show prop

---

### 6. New Prop Scoring Card (`src/components/host/RumblePropScoringCard.tsx`)

Create component to display Rumble prop status:

- Show predicted wrestler with player's guess
- Display actual result when scored
- Indicate auto-scored vs pending

---

## Database Considerations

No schema changes needed - picks are stored with:
- `match_id`: e.g., `mens_first_elimination`, `mens_final_four_1`
- `prediction`: wrestler name or "YES"/"NO"

Results stored in `match_results` the same way.

---

## UI Flow Summary

**Player Experience:**
1. Swipe through undercard matches (3 cards)
2. Pick Men's Rumble winner
3. Pick Men's Rumble props (new card with wrestler pickers + Final Four)
4. Answer Men's Chaos Props (YES/NO questions)
5. Pick Women's Rumble winner  
6. Pick Women's Rumble props (new card)
7. Answer Women's Chaos Props
8. Submit all picks

**Host Experience:**
- First Elimination, #1/#30 entrants auto-score when entries/eliminations happen
- Most Eliminations and Iron Man/Woman calculated at Rumble end
- Final Four auto-scores when 4 wrestlers remain
- No-Show has manual YES/NO buttons

---

## Summary

| Change | Files |
|--------|-------|
| Add prop definitions | `src/lib/constants.ts` |
| New Rumble Props card | `src/components/picks/cards/RumblePropsCard.tsx` |
| Update card stack | `src/components/picks/PickCardStack.tsx` |
| Host scoring logic | `src/pages/HostControl.tsx` |
| Scoring display component | `src/components/host/RumblePropScoringCard.tsx` |
