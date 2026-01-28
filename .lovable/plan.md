

# TV Display Layout Improvements

## Overview

Based on the screenshot, there are several improvements needed to optimize the TV display:

1. Move the tab navigation bar higher (currently at the bottom, below content)
2. Hide the leaderboard when viewing Props to maximize screen real estate
3. Remove duplicate "Men's Royal Rumble" header from Rumble views (it already shows in the top header)
4. Enhance individual match views with pick percentages and player breakdown

---

## Current Issues (from Screenshot)

Looking at the screenshot:
- The header shows "Men's Royal Rumble" in large text (good)
- But the content area ALSO shows "Men's Royal Rumble" header with "Active: 6" (duplicative)
- The tab bar is at the very bottom, below the "Waiting for action..." ticker
- For undercard matches, only wrestler photos are shown without pick distribution stats

---

## Proposed Changes

### 1. Move Tab Bar Up

**Current Layout:**
```
[Header]
[Main Content]
[Participant Picks]
[Tab Bar]
[Activity Ticker]
```

**New Layout:**
```
[Header]
[Tab Bar]  <-- Moved up directly below header
[Main Content]
[Participant Picks]
[Activity Ticker]
```

This makes navigation more accessible and visible while watching.

**Files to modify:**
- `src/pages/TvDisplay.tsx` - Move TvActivityTicker and restructure layout
- `src/components/tv/TvViewNavigator.tsx` - Remove TvTabBar from here (will be rendered in parent)

### 2. Hide Leaderboard for Props Views

This is already partially implemented! Looking at line 571-603 of TvDisplay.tsx:
```tsx
{currentViewType !== "rumble-props" && (
  <div className={sideColSpan}>
    <LeaderboardPanel players={players} />
  </div>
)}
```

The leaderboard is already hidden for `rumble-props` views, so this works. No changes needed.

### 3. Remove Duplicate Rumble Title

The `renderNumberGrid` function in `TvViewNavigator.tsx` (lines 185-270) renders:
```tsx
<div className="flex items-center justify-between">
  <h2 className="text-2xl font-bold">{title}</h2>  // <-- DUPLICATE
  <span className="text-success text-lg font-semibold">Active: {activeCount}</span>
</div>
```

Since the main header already shows "Men's Royal Rumble", we should:
- Remove the title from the grid content
- Keep only the "Active: X" counter (move it to a more prominent position)

**Files to modify:**
- `src/components/tv/TvViewNavigator.tsx` - Remove title from `renderNumberGrid`, keep active count

### 4. Enhanced Individual Match Display

For undercard matches, we'll enhance `ActiveMatchDisplay.tsx` to show:
1. The matchup (already shows wrestlers VS each other)
2. Pick percentage bars for each wrestler
3. Player names grouped by who they picked

**New Layout for Match View:**
```
+--------------------------------------------------+
|  [LIVE/COMPLETE badge]                           |
+--------------------------------------------------+
|                                                  |
|    [Photo]                      [Photo]          |
|    Wrestler 1        VS        Wrestler 2        |
|                                                  |
|  =========== 60% ===========  ==== 40% ====     |
|                                                  |
|  Picked by:                   Picked by:         |
|  Kyle, Melanie, Mike          Jon, Chris, Steve  |
|                                                  |
+--------------------------------------------------+
```

**Files to modify:**
- `src/components/tv/ActiveMatchDisplay.tsx` - Add pick percentage bars and player lists
- Will receive `players` and `picks` as new props

---

## Technical Details

### TvDisplay.tsx Layout Restructure

```tsx
<div className="min-h-screen bg-background text-foreground tv-mode p-6 flex flex-col">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    {/* Logo + Code */}
    <TvHeaderStats ... />
  </div>

  {/* Tab Bar - MOVED UP */}
  {partyStatus !== "pre_event" && (
    <div className="mb-4">
      <TvTabBar
        views={VIEWS}
        currentIndex={currentViewIndex}
        onSelectView={handleSelectView}
        isViewComplete={isViewComplete}
        isViewActive={isViewActive}
      />
    </div>
  )}

  {/* Main Content Area */}
  <div className={...}>
    {/* Content */}
    {/* Leaderboard (conditional) */}
  </div>

  {/* Activity Ticker - stays at bottom */}
  {partyStatus !== "pre_event" && (
    <div className="mt-4">
      <TvActivityTicker events={activityEvents} />
    </div>
  )}
</div>
```

### TvViewNavigator.tsx Changes

Remove the TvTabBar from this component since it will now be rendered in the parent:

```tsx
// Remove this from the return statement:
<div className="mt-6">
  <TvTabBar ... />
</div>
```

Also remove the duplicate title from `renderNumberGrid`:

```tsx
const renderNumberGrid = (numbers: RumbleNumber[], title: string, rumbleId: string) => {
  // Keep active count logic
  const activeCount = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length;

  return (
    <div className="space-y-4">
      {/* REMOVE: the title header
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="text-success...">Active: {activeCount}</span>
      </div>
      */}
      
      {/* The grid - no changes */}
      <div className={cn("grid grid-cols-10", gridGapClass)}>
        ...
      </div>
      
      {/* Winner Display - no changes */}
      ...
    </div>
  );
};
```

### ActiveMatchDisplay.tsx Enhancement

Add props for players and picks to calculate and display pick distribution:

```tsx
interface ActiveMatchDisplayProps {
  match: typeof UNDERCARD_MATCHES[number];
  matchResults: MatchResult[];
  players: Player[];  // NEW
  picks: Pick[];       // NEW
}

export function ActiveMatchDisplay({ match, matchResults, players, picks }: ActiveMatchDisplayProps) {
  // Calculate pick distribution
  const pickStats = useMemo(() => {
    const matchPicks = picks.filter(p => p.match_id === match.id);
    const totalPicks = matchPicks.length;
    
    const wrestler1Picks = matchPicks.filter(p => p.prediction === wrestler1);
    const wrestler2Picks = matchPicks.filter(p => p.prediction === wrestler2);
    
    return {
      wrestler1: {
        count: wrestler1Picks.length,
        percentage: totalPicks > 0 ? Math.round((wrestler1Picks.length / totalPicks) * 100) : 0,
        players: wrestler1Picks.map(p => 
          players.find(pl => pl.id === p.player_id)?.display_name || "Unknown"
        ),
      },
      wrestler2: {
        count: wrestler2Picks.length,
        percentage: totalPicks > 0 ? Math.round((wrestler2Picks.length / totalPicks) * 100) : 0,
        players: wrestler2Picks.map(p => 
          players.find(pl => pl.id === p.player_id)?.display_name || "Unknown"
        ),
      },
    };
  }, [match.id, picks, players, wrestler1, wrestler2]);

  return (
    <motion.div ...>
      {/* Status bar - keep as is */}
      
      {/* Match display */}
      <div className="p-8">
        <div className="flex items-center justify-center gap-8 md:gap-16">
          {/* Wrestler 1 */}
          <div className="flex flex-col items-center gap-4">
            <WrestlerImage ... />
            <span className="text-2xl font-bold">{wrestler1}</span>
            
            {/* NEW: Pick percentage */}
            <div className="text-lg font-bold text-primary">
              {pickStats.wrestler1.percentage}%
            </div>
            
            {/* NEW: Player names who picked */}
            <div className="text-sm text-muted-foreground text-center max-w-[150px]">
              {pickStats.wrestler1.players.join(", ") || "No picks"}
            </div>
          </div>

          {/* VS graphic - keep */}
          
          {/* Wrestler 2 - same structure as wrestler 1 */}
        </div>

        {/* NEW: Visual progress bar showing distribution */}
        <div className="mt-8 flex h-3 rounded-full overflow-hidden bg-muted">
          <div 
            className="bg-primary/80 transition-all duration-500"
            style={{ width: `${pickStats.wrestler1.percentage}%` }}
          />
          <div 
            className="bg-secondary/80 transition-all duration-500"
            style={{ width: `${pickStats.wrestler2.percentage}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Move TvTabBar up in layout, pass additional helper functions |
| `src/components/tv/TvViewNavigator.tsx` | Remove TvTabBar, remove duplicate title from renderNumberGrid, pass players/picks to ActiveMatchDisplay |
| `src/components/tv/ActiveMatchDisplay.tsx` | Add players/picks props, show percentage bars and player lists |

---

## Summary

| Change | Benefit |
|--------|---------|
| Move tab bar up | More accessible navigation, visible while watching content |
| Remove duplicate rumble title | Cleaner UI, title already in header |
| Add pick percentages to matches | Shows how the group is split on predictions |
| Add player names under picks | See exactly who picked whom |

