
# Plan: Swipeable Card-Based Pick Flow

## Overview
Transform the current accordion-based pick submission into a Tinder-style card stack interface where each pick is a full-screen card that users swipe through. This creates a more engaging, focused experience where users make one decision at a time.

---

## Card Structure (7 Total Cards)

| Card | Type | Content |
|------|------|---------|
| 1 | Match Winner | Drew McIntyre vs Sami Zayn |
| 2 | Match Winner | CM Punk vs Logan Paul |
| 3 | Match Winner | AJ Styles vs Gunther |
| 4 | Rumble Winner | Men's Royal Rumble Winner |
| 5 | Chaos Props | Men's Rumble - 6 YES/NO questions |
| 6 | Rumble Winner | Women's Royal Rumble Winner |
| 7 | Chaos Props | Women's Rumble - 6 YES/NO questions |

---

## Visual Layout

```text
+---------------------------------------------+
|  [< Back]     Party 3200    [progress dots] |
|  =================[38%]==================== |
+---------------------------------------------+
|                                             |
|      +-------------------------------+      |
|      |                               |      |
|      |    [TROPHY ICON]              |      |
|      |    Match Winner               |      |
|      |                               |      |
|      |    Drew McIntyre vs Sami Zayn |      |
|      |                               |      |
|      |    [Drew Photo]  [Sami Photo] |      |
|      |    [  SELECT  ]  [  SELECT  ] |      |
|      |                               |      |
|      |    +25 pts if correct         |      |
|      +-------------------------------+      |
|                                             |
|  [< Back]    Card 1 of 7    [Skip >]        |
+---------------------------------------------+
```

---

## Files to Create

### New Components

| File | Purpose |
|------|---------|
| `src/components/picks/PickCardStack.tsx` | Main orchestrator - manages state, navigation, submission |
| `src/components/picks/ProgressBar.tsx` | Top progress indicator with tappable dots |
| `src/components/picks/cards/MatchCard.tsx` | Undercard match selection (2 wrestler buttons) |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Rumble winner with searchable wrestler list |
| `src/components/picks/cards/ChaosPropsCard.tsx` | 6 YES/NO prop questions in scrollable card |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/PlayerPicks.tsx` | Replace accordion UI with new `<PickCardStack />` component |
| `src/lib/constants.ts` | Add `CHAOS_PROPS_MENS` and `CHAOS_PROPS_WOMENS` with new match IDs |

---

## Technical Details

### PickCardStack.tsx (Main Component)

```typescript
// Key state
const [currentCardIndex, setCurrentCardIndex] = useState(0);
const [picks, setPicks] = useState<Record<string, any>>({});
const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

// Card configuration
const CARD_CONFIG = [
  { type: 'match', id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { type: 'match', id: 'undercard_2', title: 'CM Punk vs Logan Paul', options: ['CM Punk', 'Logan Paul'] },
  { type: 'match', id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
  { type: 'rumble-winner', id: 'mens_rumble_winner', title: "Men's Royal Rumble", gender: 'mens' },
  { type: 'chaos-props', id: 'mens_chaos_props', title: "Men's Chaos Props", gender: 'mens' },
  { type: 'rumble-winner', id: 'womens_rumble_winner', title: "Women's Royal Rumble", gender: 'womens' },
  { type: 'chaos-props', id: 'womens_chaos_props', title: "Women's Chaos Props", gender: 'womens' },
];
```

Key behaviors:
- Framer Motion swipe gestures with `drag="x"` and `onDragEnd` handler
- Auto-advance after match/rumble winner selection (300ms delay)
- Manual advance for chaos props (all 6 must be answered)
- AnimatePresence for smooth card transitions
- Preserve picks when navigating back

### ProgressBar.tsx

Features:
- Animated fill bar showing completion percentage
- 7 tappable dot indicators (jump to any card)
- Completed cards show gold checkmarks
- Current card has ring highlight
- Hover tooltips showing card names

### MatchCard.tsx

Features:
- Large wrestler photos (from existing `getWrestlerImageUrl`)
- Full-width tappable buttons with selection animation
- Checkmark overlay on selected option
- Points indicator (+25 pts)
- WWE-style card design with gold accents

### RumbleWinnerCard.tsx

Features:
- Search bar at top
- Scrollable grid of wrestler cards (reuse existing modal pattern)
- Current selection shown at top of card
- +50 pts indicator
- Confetti trigger on selection

### ChaosPropsCard.tsx

Features:
- Scrollable list of 6 prop questions
- Large YES/NO button pairs (not toggles)
- Progress indicator (4/6 answered)
- "All answered!" success message when complete
- +10 pts each, 60 pts total indicator

---

## Database Changes

### Updated Match IDs for Chaos Props

Current:
- `prop_1`, `prop_2`, ..., `prop_6`

New (gender-specific):
- `mens_chaos_prop_1`, `mens_chaos_prop_2`, ..., `mens_chaos_prop_6`
- `womens_chaos_prop_1`, `womens_chaos_prop_2`, ..., `womens_chaos_prop_6`

This allows the same 6 questions to be asked separately for each rumble.

### Updated constants.ts

```typescript
export const CHAOS_PROPS = [
  { id: 'prop_1', title: 'Kofi/Logan Save', question: 'Will someone use a prop to stay in?' },
  { id: 'prop_2', title: 'Bushwhacker Exit', question: 'Eliminated in under 10 seconds?' },
  { id: 'prop_3', title: 'Friendly Fire', question: 'Tag partners eliminate each other?' },
  { id: 'prop_4', title: 'First Blood', question: 'Blood before entrant #15?' },
  { id: 'prop_5', title: 'Mystery Entrant', question: 'Unannounced debut/return?' },
  { id: 'prop_6', title: 'The Weapon', question: 'Chair/kendo stick used?' },
] as const;

export const MATCH_IDS = {
  UNDERCARD_1: 'undercard_1',
  UNDERCARD_2: 'undercard_2',
  UNDERCARD_3: 'undercard_3',
  MENS_RUMBLE_WINNER: 'mens_rumble_winner',
  WOMENS_RUMBLE_WINNER: 'womens_rumble_winner',
  // Men's props
  MENS_PROP_1: 'mens_chaos_prop_1',
  // ... etc
  // Women's props
  WOMENS_PROP_1: 'womens_chaos_prop_1',
  // ... etc
} as const;
```

---

## UX Behaviors

### Swipe Navigation
- Swipe left to go forward (next card)
- Swipe right to go back (previous card)
- Threshold: 100px horizontal drag
- Spring animation with damping for natural feel

### Auto-Advance
- Match cards: Auto-advance 300ms after selection
- Rumble winner cards: Auto-advance after wrestler selected
- Chaos props: Manual advance only (need all 6 answered)

### Submit Flow
- Submit button only appears on last card (card 7)
- Disabled until all 7 cards complete (17 total picks)
- Gold shimmer animation when ready
- Redirect to dashboard after successful submission

### Existing Picks
- If player has existing picks, pre-populate state
- Allow editing before event starts
- "Update Picks" button if already submitted

---

## Scoring Updates (for Host Control)

The host control page will need minor updates to score the gender-specific chaos props:

```typescript
// Score Men's Chaos Props
CHAOS_PROPS.forEach((prop, index) => {
  const matchId = `mens_chaos_prop_${index + 1}`;
  // ... scoring logic
});

// Score Women's Chaos Props
CHAOS_PROPS.forEach((prop, index) => {
  const matchId = `womens_chaos_prop_${index + 1}`;
  // ... scoring logic
});
```

---

## Animation Details

### Card Transitions
```typescript
initial={{ x: direction === 'right' ? 300 : -300, opacity: 0, scale: 0.8 }}
animate={{ x: 0, opacity: 1, scale: 1 }}
exit={{ x: direction === 'right' ? -300 : 300, opacity: 0, scale: 0.8 }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

### Selection Feedback
- Scale pulse on selection: `scale: [1, 1.05, 1]`
- Checkmark appears with spring animation
- Border glow transition to primary color

---

## Mobile Optimizations

- Full-screen cards maximize touch targets
- Large buttons (min 48px height)
- Bottom navigation always visible
- Progress bar sticky at top
- Swipe hint shown only on first card
- iOS-safe-area padding

---

## Summary

| Component | Lines of Code (est.) |
|-----------|---------------------|
| PickCardStack.tsx | ~250 |
| ProgressBar.tsx | ~80 |
| MatchCard.tsx | ~100 |
| RumbleWinnerCard.tsx | ~120 |
| ChaosPropsCard.tsx | ~130 |
| PlayerPicks.tsx (updates) | ~100 |
| constants.ts (updates) | ~40 |
| HostControl.tsx (updates) | ~60 |

**Total: ~880 lines of code**

This transforms the pick flow from a "boring form" into an engaging, game-like experience that feels native to mobile users familiar with card-swipe interfaces.
