
# TV Display: Rumble Winner Predictions & Enhanced Winner Banner

## Overview

Add two features to the TV display when viewing Rumble grids:

1. **Winner Predictions Panel** - Show a horizontally scrollable grid of all players' Rumble winner picks below the number grid (similar to undercard match picks)
2. **Enhanced Winner Banner** - Make the winner display more prominent when declared

---

## 1. Rumble Winner Predictions Component

Create a new component to show who each player picked to win the Rumble.

### File: `src/components/tv/RumbleWinnerPredictions.tsx` (NEW)

**Features:**
- Horizontally scrollable cards showing each player's winner pick
- Wrestler photo + wrestler name + player name on each card
- When winner is declared: green border + checkmark for correct, muted/X for incorrect
- When no winner yet: locked state with subtle styling

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  👑 Winner Predictions                            [<] [>]       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ [photo]  │  │ [photo]  │  │ [photo]  │  │ [photo]  │        │
│  │ CM Punk  │  │ Cody     │  │ CM Punk  │  │ Gunther  │        │
│  │ Randy S. │  │ Demo     │  │ Steve A. │  │ Hulk H.  │        │
│  │    🔒    │  │    🔒    │  │    ✓     │  │    ✗     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Props Interface:
```typescript
interface RumbleWinnerPredictionsProps {
  gender: "mens" | "womens";
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
}
```

### Logic:
- Get winner match ID: `mens_rumble_winner` or `womens_rumble_winner`
- Filter picks where `match_id === winnerMatchId`
- Compare each pick's prediction to the result (if exists)
- Show correct/incorrect indicators after winner is declared

---

## 2. Enhanced Winner Banner

Update the existing winner display in `TvViewNavigator.tsx` to be more dramatic.

### File: `src/components/tv/TvViewNavigator.tsx`

**Current (lines 188-211):** Simple banner with Crown icon, photo, and text

**Enhanced Version:**
- Larger wrestler photo (size "xl" instead of "lg")
- Animated golden glow effect
- Trophy icon instead of/in addition to Crown
- Bigger text for the winner name
- "WINNER" badge with animation
- Points earned display (+50 for owner)

**Updated Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     ✨ GOLDEN GLOW BORDER ✨                    │
│                                                                 │
│                         🏆 WINNER 🏆                            │
│                                                                 │
│                       ┌─────────────┐                          │
│                       │             │                          │
│                       │  [XL photo] │  ← Animated border       │
│                       │             │                          │
│                       └─────────────┘                          │
│                                                                 │
│                        CM PUNK                                 │
│                    Entry #17 • Randy Savage                    │
│                         +50 pts                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Integration in TvViewNavigator

Update `renderNumberGrid()` function to:
1. Keep the enhanced winner banner when declared
2. Add the predictions panel below the grid (show always when viewing Rumble)

**Updated Structure:**
```typescript
const renderNumberGrid = () => {
  return (
    <div className="space-y-4">
      {/* Title + Active Count */}
      <div>...</div>
      
      {/* 30-Number Grid */}
      <div className="grid grid-cols-10 gap-2">...</div>
      
      {/* Enhanced Winner Display (when declared) */}
      {winnerNumber && <EnhancedWinnerBanner ... />}
      
      {/* Winner Predictions Panel (always shown) */}
      <RumbleWinnerPredictions 
        gender={rumbleId}
        players={players}
        picks={picks}
        matchResults={matchResults}
      />
    </div>
  );
};
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/tv/RumbleWinnerPredictions.tsx` | Create | New component showing player winner picks |
| `src/components/tv/TvViewNavigator.tsx` | Modify | Enhance winner banner, integrate predictions panel |

---

## Technical Details

### RumbleWinnerPredictions Component

```typescript
// Key logic for determining correct/incorrect
const winnerMatchId = gender === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
const winnerResult = matchResults.find(r => r.match_id === winnerMatchId);

const winnerPicks = players.map(player => {
  const pick = picks.find(p => p.player_id === player.id && p.match_id === winnerMatchId);
  return {
    player,
    prediction: pick?.prediction || null,
    isCorrect: winnerResult && pick?.prediction === winnerResult.result,
    isIncorrect: winnerResult && pick?.prediction && pick.prediction !== winnerResult.result,
  };
}).filter(p => p.prediction); // Only show players who made a pick
```

### Enhanced Winner Banner

```typescript
// Animation for the winner banner
<motion.div 
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  className="relative mt-6 p-8 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-2xl border-4 border-primary"
>
  {/* Animated glow effect */}
  <motion.div
    className="absolute inset-0 rounded-2xl bg-primary/20"
    animate={{ opacity: [0.2, 0.4, 0.2] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
  
  <div className="relative z-10 flex flex-col items-center gap-4">
    <Trophy className="w-12 h-12 text-primary" />
    <WrestlerImage name={winnerName} size="xl" className="border-4 border-primary" />
    <div className="text-4xl font-black text-primary">{winnerName}</div>
    <div className="text-lg text-muted-foreground">
      Entry #{number} • Owned by {ownerName}
    </div>
    <div className="text-2xl font-bold text-success">+{SCORING.RUMBLE_WINNER_NUMBER} pts</div>
  </div>
</motion.div>
```

---

## User Experience

**Before Winner Declared:**
- Number grid displays normally
- Below grid: "Winner Predictions" panel shows all players' picks with lock icons

**After Winner Declared:**
- Enhanced winner banner appears prominently below the grid
- Predictions panel updates: correct picks get green checkmarks, incorrect get red X
- Dramatic animations draw attention to the winner

