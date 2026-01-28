

# TV Display Cleanup and Layout Optimization

## Overview

This plan addresses several UI redundancies and layout optimizations for the TV display based on the screenshot:

1. Remove the ParticipantPicksView panel (picks are now shown directly on match cards)
2. Replace the collapsible LeaderboardPanel with a compact horizontal bar
3. Fix duplicate headers in Rumble Props views
4. Expand content to use full width without the side column

---

## Current Issues

Looking at the screenshot:
- The leaderboard takes up right-side column space with expand/collapse/hide states
- "Men's Rumble Props" appears in header, then "Men's Rumble Predictions" duplicates in content
- ParticipantPicksView shows picks that are already visible on match cards

---

## Proposed Changes

### 1. Remove ParticipantPicksView

The picks are now shown directly on the `ActiveMatchDisplay` component with percentage bars and player names. The ParticipantPicksView is redundant.

**File: `src/components/tv/TvViewNavigator.tsx`**
- Remove lines 335-345 that render ParticipantPicksView for undercard matches

### 2. Create Simple Horizontal Leaderboard Bar

Replace the complex collapsible panel with a compact inline bar that fits below the tab bar:

**New Component: `src/components/tv/TvLeaderboardBar.tsx`**
```
[Trophy] 1. Kyle (0) | 2. Melanie (0) | 3. Mike (0) | 4. Jon (0) | 5. Chris (0) | 6. Steve (0)
```

Features:
- Single horizontal row with all players
- Gold/Silver/Bronze styling for top 3
- Always visible, no collapse/expand controls
- Compact pill badges for each player

### 3. Remove Side Column Layout

**File: `src/pages/TvDisplay.tsx`**
- Remove the 12-column grid split
- Make content full-width
- Remove LeaderboardPanel import and rendering
- Add new TvLeaderboardBar below the tab bar

### 4. Fix Duplicate Title in RumblePropsDisplay

**File: `src/components/tv/RumblePropsDisplay.tsx`**
- Remove the "Men's/Women's Rumble Predictions" header since it's already shown in TvHeaderStats

---

## New Layout Structure

```
+------------------------------------------------------------------+
| [Logo] #9301                Men's Rumble Props    [Auto] [Full]  |
+------------------------------------------------------------------+
| [Match 1] [Match 2] [Match 3] [Men's] [M Props*] [Women's] [W Props] |
+------------------------------------------------------------------+
| [Trophy] 1. Kyle 0 | 2. Melanie 0 | 3. Mike 0 | 4. Jon 0 | ...   |
+------------------------------------------------------------------+
|                                                                   |
|                     [FULL WIDTH CONTENT]                          |
|                      (Props Grid Table)                           |
|                                                                   |
+------------------------------------------------------------------+
| [Activity Ticker]                                                 |
+------------------------------------------------------------------+
```

---

## Technical Details

### TvLeaderboardBar Component

```tsx
interface TvLeaderboardBarProps {
  players: Player[];
}

export function TvLeaderboardBar({ players }: TvLeaderboardBarProps) {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
      <div className="flex items-center gap-4">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm text-muted-foreground">Leaderboard</span>
        <div className="flex items-center gap-3 overflow-x-auto">
          {players.map((player, index) => (
            <div 
              key={player.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                index === 0 && "bg-primary/20 border border-primary",
                index === 1 && "bg-muted/80",
                index === 2 && "bg-muted/60",
                index > 2 && "bg-muted/40"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 && "tv-rank-gold",
                index === 1 && "tv-rank-silver",
                index === 2 && "tv-rank-bronze",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </span>
              <span className="font-medium text-sm">{player.display_name}</span>
              <span className="font-bold">{player.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Updated TvDisplay Layout

```tsx
<div className="min-h-screen bg-background text-foreground tv-mode p-6 flex flex-col">
  {/* Header - unchanged */}
  
  {/* Tab Bar */}
  {partyStatus !== "pre_event" && (
    <div className="mb-3">
      <TvTabBar ... />
    </div>
  )}
  
  {/* NEW: Horizontal Leaderboard Bar */}
  {partyStatus !== "pre_event" && (
    <div className="mb-4">
      <TvLeaderboardBar players={players} />
    </div>
  )}

  {/* Main Content - FULL WIDTH, no grid split */}
  <div className="flex-1">
    {partyStatus === "pre_event" ? (
      <div>Waiting...</div>
    ) : (
      <TvViewNavigator ... />
    )}
  </div>

  {/* Activity Ticker - unchanged */}
</div>
```

---

## Files to Modify/Create

| File | Changes |
|------|---------|
| `src/components/tv/TvLeaderboardBar.tsx` | **New** - Compact horizontal leaderboard |
| `src/pages/TvDisplay.tsx` | Remove LeaderboardPanel, remove grid layout, add TvLeaderboardBar |
| `src/components/tv/TvViewNavigator.tsx` | Remove ParticipantPicksView rendering |
| `src/components/tv/RumblePropsDisplay.tsx` | Remove duplicate title header |
| `src/components/tv/LeaderboardPanel.tsx` | Can be deleted (optional) |

---

## Summary

| Change | Benefit |
|--------|---------|
| Remove ParticipantPicksView | Eliminates redundancy, picks shown on match cards |
| Horizontal leaderboard bar | Cleaner layout, always visible, no fiddly controls |
| Remove side column | Content uses full screen width |
| Fix duplicate headers | Cleaner UI, single source of truth for view title |

