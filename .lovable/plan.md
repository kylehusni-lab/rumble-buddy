

# TV Display Enhancements: Rumble Winners + Props Views

## Overview

Two main changes to the TV display:
1. **Show Rumble winners underneath the number grid** when declared
2. **Add new views for Rumble Props** showing participant predictions for First Elimination, Most Eliminations, Iron Man/Woman, Final Four, and other props

---

## Change 1: Display Rumble Winner Under Number Grid

### Current Behavior

When viewing a Rumble grid, the winner result is only shown in a small text above the navigation ("Winner: [name]").

### New Behavior

When a Rumble winner is declared, display a prominent winner banner underneath the 30-number grid with:
- Winner's photo (large)
- Winner's name
- Entry number
- Owner name (player who had that number)

### File Changes

| File | Change |
|------|--------|
| `src/components/tv/TvViewNavigator.tsx` | Add winner display section below number grid |

### Implementation

Add a new section after the number grid in `renderNumberGrid`:

```typescript
const renderNumberGrid = (numbers: RumbleNumber[], title: string, rumbleId: string) => {
  const activeCount = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length;
  const winnerMatchId = rumbleId === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
  const winnerResult = matchResults.find(r => r.match_id === winnerMatchId);
  const winnerNumber = winnerResult 
    ? numbers.find(n => n.wrestler_name === winnerResult.result)
    : null;

  return (
    <div className="space-y-4">
      {/* Existing header and grid */}
      ...
      
      {/* Winner Display - show when declared */}
      {winnerNumber && (
        <motion.div className="mt-6 p-6 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl border-2 border-primary">
          <div className="flex items-center justify-center gap-6">
            <Crown className="w-10 h-10 text-primary" />
            <WrestlerImage name={winnerNumber.wrestler_name!} size="lg" className="border-4 border-primary" />
            <div className="text-left">
              <div className="text-sm text-muted-foreground uppercase">Winner</div>
              <div className="text-3xl font-bold text-primary">{winnerNumber.wrestler_name}</div>
              <div className="text-lg text-muted-foreground">
                Entry #{winnerNumber.number} - Owned by {getPlayerName(winnerNumber.assigned_to_player_id)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
```

---

## Change 2: Add Rumble Props View

### New View Type

Add 2 new views to the navigator (one per Rumble) showing participant predictions for the Rumble Props.

### Updated VIEWS Array

```typescript
const VIEWS: View[] = [
  { type: "undercard", id: "undercard_1", ... },
  { type: "undercard", id: "undercard_2", ... },
  { type: "undercard", id: "undercard_3", ... },
  { type: "rumble", id: "mens", title: "Men's Royal Rumble" },
  { type: "rumble-props", id: "mens_props", title: "Men's Rumble Props", gender: "mens" },  // NEW
  { type: "rumble", id: "womens", title: "Women's Royal Rumble" },
  { type: "rumble-props", id: "womens_props", title: "Women's Rumble Props", gender: "womens" },  // NEW
];
```

**Total views: 7 (was 5)**

### New Component: RumblePropsDisplay

Create a new component to show participant predictions for Rumble props:

```text
+--------------------------------------------------+
|          MEN'S RUMBLE PREDICTIONS                |
+--------------------------------------------------+
|                                                  |
|  FIRST ELIMINATION                               |
|  +----------+  +----------+  +----------+        |
|  |  Photo   |  |  Photo   |  |  Photo   |        |
|  | CM Punk  |  | Rey M.   |  |  Gunther |        |
|  |  John    |  |  Sarah   |  |   Mike   |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  MOST ELIMINATIONS                               |
|  +----------+  +----------+  +----------+        |
|  |  Photo   |  |  Photo   |  |  Photo   |        |
|  | Bron B.  |  | Roman    |  |  Solo    |        |
|  |  John    |  |  Sarah   |  |   Mike   |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  IRON MAN (Longest Time)                         |
|  +----------+  +----------+  +----------+        |
|  ...                                             |
|                                                  |
|  FINAL FOUR PICKS                                |
|  Row showing each player's 4 picks               |
|                                                  |
+--------------------------------------------------+
```

### Props to Display

| Prop | Match ID Pattern | Type |
|------|------------------|------|
| First Elimination | `{gender}_first_elimination` | Wrestler picks |
| Most Eliminations | `{gender}_most_eliminations` | Wrestler picks |
| Iron Man/Woman | `{gender}_longest_time` | Wrestler picks |
| #1 Entrant | `{gender}_entrant_1` | Wrestler picks |
| #30 Entrant | `{gender}_entrant_30` | Wrestler picks |
| Final Four | `{gender}_final_four_1` through `_4` | 4 wrestlers per player |
| No-Show | `{gender}_no_show` | YES/NO answers |

### File Changes

| File | Change |
|------|--------|
| `src/components/tv/RumblePropsDisplay.tsx` | **NEW** - Component showing prop predictions |
| `src/components/tv/TvViewNavigator.tsx` | Add new view type, import and render RumblePropsDisplay |

---

## Implementation Details

### File 1: `src/components/tv/RumblePropsDisplay.tsx` (NEW)

```typescript
interface RumblePropsDisplayProps {
  gender: "mens" | "womens";
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
}

export function RumblePropsDisplay({ gender, players, picks, matchResults }: RumblePropsDisplayProps) {
  // Get all picks for a specific prop
  const getPicksForProp = (propId: string) => {
    const matchId = `${gender}_${propId}`;
    return players.map(player => {
      const pick = picks.find(p => p.player_id === player.id && p.match_id === matchId);
      return { player, prediction: pick?.prediction || null };
    }).filter(p => p.prediction);
  };

  // Render a row of wrestler picks for a prop
  const renderPropRow = (title: string, propId: string) => {
    const propPicks = getPicksForProp(propId);
    const result = matchResults.find(r => r.match_id === `${gender}_${propId}`);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          {result && (
            <span className="text-sm text-success">Winner: {result.result}</span>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {propPicks.map(({ player, prediction }) => (
            <div key={player.id} className="flex-shrink-0 flex flex-col items-center">
              <WrestlerImage name={prediction!} size="sm" 
                className={prediction === result?.result ? "ring-2 ring-success" : ""} />
              <span className="text-xs font-medium mt-1">{prediction}</span>
              <span className="text-[10px] text-muted-foreground">{player.display_name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Final Four section
  const renderFinalFour = () => {
    // Get all 4 final four picks per player
    const playerFinalFours = players.map(player => {
      const fourPicks = [1, 2, 3, 4].map(i => {
        const pick = picks.find(p => 
          p.player_id === player.id && 
          p.match_id === `${gender}_final_four_${i}`
        );
        return pick?.prediction || null;
      }).filter(Boolean);
      return { player, picks: fourPicks };
    }).filter(p => p.picks.length > 0);

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Final Four Picks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playerFinalFours.map(({ player, picks }) => (
            <div key={player.id} className="bg-card/50 rounded-lg p-3">
              <div className="text-sm font-semibold text-primary mb-2">{player.display_name}</div>
              <div className="flex gap-2">
                {picks.map((name, i) => (
                  <WrestlerImage key={i} name={name} size="sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render No-Show prop (YES/NO)
  const renderNoShow = () => {
    const propPicks = getPicksForProp("no_show");
    const result = matchResults.find(r => r.match_id === `${gender}_no_show`);
    
    const yesPicks = propPicks.filter(p => p.prediction === "YES");
    const noPicks = propPicks.filter(p => p.prediction === "NO");
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-bold">No-Show?</h3>
        <div className="flex gap-4">
          <div className="flex-1 bg-success/10 rounded-lg p-3 text-center">
            <div className="text-success font-bold">YES ({yesPicks.length})</div>
            <div className="text-xs text-muted-foreground">
              {yesPicks.map(p => p.player.display_name).join(", ") || "No picks"}
            </div>
          </div>
          <div className="flex-1 bg-destructive/10 rounded-lg p-3 text-center">
            <div className="text-destructive font-bold">NO ({noPicks.length})</div>
            <div className="text-xs text-muted-foreground">
              {noPicks.map(p => p.player.display_name).join(", ") || "No picks"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const title = gender === "mens" ? "Men's" : "Women's";

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">{title} Rumble Predictions</h2>
      
      {renderPropRow("First Elimination", "first_elimination")}
      {renderPropRow("Most Eliminations", "most_eliminations")}
      {renderPropRow("Iron " + (gender === "mens" ? "Man" : "Woman"), "longest_time")}
      {renderPropRow("#1 Entrant", "entrant_1")}
      {renderPropRow("#30 Entrant", "entrant_30")}
      {renderFinalFour()}
      {renderNoShow()}
    </div>
  );
}
```

### File 2: `src/components/tv/TvViewNavigator.tsx` Updates

**Changes:**

1. Update View interface and VIEWS array to include `rumble-props` type
2. Add `getPlayerName` helper (needs players prop)
3. Update `renderNumberGrid` to accept rumble ID and show winner
4. Add rendering for `rumble-props` view type
5. Import Crown icon and RumblePropsDisplay component

**Key additions:**

```typescript
// Update VIEWS array
const VIEWS: View[] = [
  { type: "undercard", id: "undercard_1", title: UNDERCARD_MATCHES[0].title, ... },
  { type: "undercard", id: "undercard_2", title: UNDERCARD_MATCHES[1].title, ... },
  { type: "undercard", id: "undercard_3", title: UNDERCARD_MATCHES[2].title, ... },
  { type: "rumble", id: "mens", title: "Men's Royal Rumble" },
  { type: "rumble-props", id: "mens_props", title: "Men's Rumble Props", gender: "mens" },
  { type: "rumble", id: "womens", title: "Women's Royal Rumble" },
  { type: "rumble-props", id: "womens_props", title: "Women's Rumble Props", gender: "womens" },
];

// Update keyboard navigation range (1-7 instead of 1-5)
} else if (e.key >= "1" && e.key <= "7") {

// Add renderCurrentView case
if (currentView.type === "rumble-props") {
  return (
    <RumblePropsDisplay
      gender={currentView.gender as "mens" | "womens"}
      players={players}
      picks={picks}
      matchResults={matchResults}
    />
  );
}
```

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `src/components/tv/RumblePropsDisplay.tsx` | NEW | Component showing all player predictions for Rumble props |
| `src/components/tv/TvViewNavigator.tsx` | EDIT | Add props views, winner display under grid, update navigation |

---

## Visual Result

**TV Navigator Views (7 total):**
1. Undercard 1 (Drew vs Sami)
2. Undercard 2 (Punk vs Seth)
3. Undercard 3 (AJ vs Gunther)
4. Men's Rumble Grid + Winner Banner
5. Men's Rumble Props Predictions (NEW)
6. Women's Rumble Grid + Winner Banner
7. Women's Rumble Props Predictions (NEW)

**Winner Display:** When a Rumble winner is declared, a prominent banner appears below the 30-number grid showing the winner's photo, name, entry number, and owner.

**Props View:** Shows horizontally scrollable rows of participant predictions for each prop category, with wrestler photos and player names.

