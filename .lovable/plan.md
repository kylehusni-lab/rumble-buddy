

# TV Display Enhancement Plan - 4 Screens Improvement

## Overview

This plan implements major improvements across 4 TV display screens to improve 10-foot readability, maximize screen space, and create a broadcast-quality viewing experience.

---

## Screen 1: Rumble Props Table Improvements

### Current Issues
- Row height is cramped (~60px) with minimal padding
- Wrestler images are ~48px (`size="sm"`) - too small from across the room
- No wrestler names below images - relies on face recognition
- Initial fallbacks (SU, OT) are confusing
- Final Four row shows 4 tiny ~25px images crammed together
- "TBD" in Result column wastes space

### Implementation Changes

**File: `src/components/tv/RumblePropsDisplay.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Row height | ~60px | 100-120px (via increased padding) |
| Image size | `size="sm"` (48px) | `size="md"` (80px) |
| Wrestler names | None | Show truncated name below image |
| Empty state | Various | Simple "—" dash |
| Final Four | 4 tiny images inline | 2x2 grid layout OR vertical name list |
| Result column | "TBD" | "—" |
| Player headers | Plain text | Colored 3px underline per player |

**New Component Structure:**

```tsx
// Each wrestler cell will show:
<div className="flex flex-col items-center gap-2">
  <WrestlerImage name={prediction} size="md" />
  <span className="text-xs text-muted-foreground truncate max-w-[80px]">
    {getShortName(prediction)} // "Roman", "Cody", etc.
  </span>
</div>
```

**Final Four 2x2 Grid:**

```tsx
<div className="grid grid-cols-2 gap-1.5 max-w-[100px] mx-auto">
  {fourPicks.map((name, i) => (
    <div key={i} className="flex flex-col items-center">
      <WrestlerImage name={name} size="sm" /> {/* 40px */}
    </div>
  ))}
</div>
```

**Player Header with Color Underline:**

```tsx
<th className="p-4 text-center">
  <span className="text-lg font-semibold">{player.display_name}</span>
  <div 
    className="h-[3px] w-full mt-2 rounded-full"
    style={{ backgroundColor: playerColor.hex }}
  />
</th>
```

---

## Screen 2: Leaderboard Complete Redesign

### Current Issues
- Card grid layout feels empty when all scores are 0
- Redundant "Leaderboard" title (already in tab)
- No visual indication of WHERE points came from
- Unbalanced 4+2 card layout

### Implementation Changes

**File: `src/components/tv/TvLeaderboardView.tsx`**

Complete redesign from card grid to horizontal bar list:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  1  🟡 Kyle      ████████████████████████░░░░░░░░░░░░░░░░░   45 pts │
│  2  🔴 Melanie   ██████████████████░░░░░░░░░░░░░░░░░░░░░░░   38 pts │
│  3  🟠 Mike      ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░   32 pts │
│  4  🟢 Jon       █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   28 pts │
└──────────────────────────────────────────────────────────────────────┘
```

**List Row Structure:**

```tsx
<div className="flex items-center gap-4 h-16 px-6 rounded-xl bg-card/30">
  {/* Rank */}
  <span className={cn(
    "text-2xl font-bold w-8",
    index === 0 && "text-[#FFD700]",  // Gold
    index === 1 && "text-[#C0C0C0]",  // Silver
    index === 2 && "text-[#CD7F32]",  // Bronze
    index > 2 && "text-muted-foreground"
  )}>
    {index + 1}
  </span>
  
  {/* Color indicator */}
  <div 
    className="w-3 h-3 rounded-full"
    style={{ backgroundColor: playerColor.hex }}
  />
  
  {/* Name */}
  <span className="text-xl font-medium flex-shrink-0 w-24">
    {player.display_name}
  </span>
  
  {/* Progress bar */}
  <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
    <div 
      className="h-full rounded-full transition-all duration-500 ease-out"
      style={{ 
        width: `${(player.points / maxPoints) * 100}%`,
        backgroundColor: playerColor.hex 
      }}
    />
  </div>
  
  {/* Points */}
  <span className="text-2xl font-bold w-20 text-right">
    {player.points}
    <span className="text-sm text-muted-foreground ml-1">pts</span>
  </span>
</div>
```

**Remove:**
- Trophy icons and title header

**Add:**
- Pre-event state: Show "Predictions locked - waiting for event to start"
- Score change animation: Bar width animates + brief glow on row
- Row height: 60-70px, gap: 10px, max-width: 900px centered

---

## Screen 3: Undercard Match View Improvements

### Current Issues
- Unused vertical space
- Wrestler images could be larger (~120px currently)
- Prediction bar uses gold/purple - not player colors
- Player names on prediction bar are small
- "Undercard Match" label is redundant

### Implementation Changes

**File: `src/components/tv/ActiveMatchDisplay.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Wrestler images | `size="lg"` (128px) | Custom 180-200px |
| Prediction bar colors | Gold/Purple | Player's assigned colors |
| Player names on bar | Small gray text | 14px, colored by player |
| "Undercard Match" label | Shows in corner | Remove |
| Points value | Not shown | Add "Worth 10 pts" indicator |

**New Prediction Bar Design:**

```tsx
{/* Player names above bar - grouped by prediction */}
<div className="flex justify-between text-sm">
  <div className="flex gap-2">
    {pickStats.wrestler1.players.map((name, i) => (
      <span 
        key={i}
        style={{ color: getPlayerColorByName(name) }}
        className="font-medium"
      >
        {name}
      </span>
    ))}
  </div>
  <div className="flex gap-2">
    {pickStats.wrestler2.players.map((name, i) => (
      <span 
        key={i}
        style={{ color: getPlayerColorByName(name) }}
        className="font-medium"
      >
        {name}
      </span>
    ))}
  </div>
</div>

{/* Points indicator */}
<div className="mt-4 text-center text-muted-foreground text-sm">
  Worth 10 pts
</div>
```

**Custom Larger Wrestler Image:**

Add new `tv` size to WrestlerImage.tsx: `w-[180px] h-[180px]`

---

## Screen 4: Entry Grid Improvements

### Current Issues
- Winner Predictions cards too small (~90px)
- Lock icons are tiny and unclear
- `*` prefix for unconfirmed entrants is confusing
- Draft distribution can cluster same colors
- Player names in predictions are small and gray

### Implementation Changes

**File: `src/components/tv/RumbleWinnerPredictions.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Card width | `w-32` (128px) | `w-36` (144px) |
| Wrestler image | `size="sm"` (48px) | `size="md"` (80px) |
| Lock icons | Show on locked | Remove entirely |
| Player name color | Gray muted | Player's assigned color |
| Wrestler name | Shows `*` prefix | Strip `*` prefix, show clean |

**Updated Card Structure:**

```tsx
<motion.div className="flex-shrink-0 w-36 p-4 rounded-xl border-2 bg-card/50">
  <WrestlerImage
    name={stripAsterisk(prediction)}
    size="md"
    className="border-2 border-muted"
  />
  
  <div className="text-sm font-medium text-center mt-2">
    {stripAsterisk(prediction)}
  </div>
  
  <div 
    className="text-sm font-medium text-center"
    style={{ color: getPlayerColor(player.id) }}
  >
    {player.display_name}
  </div>
</motion.div>
```

### Draft Distribution Algorithm (Simplified)

**Per user preference: Random distribution is acceptable, no cluster-breaking needed.**

**File: Host-side number assignment logic**

```typescript
function assignDraftSlots(players: Player[], totalSlots = 30) {
  const numPlayers = players.length;
  const picksPerPlayer = Math.floor(totalSlots / numPlayers);
  const vacantCount = totalSlots - (picksPerPlayer * numPlayers);
  
  // Create assignment array with each player appearing picksPerPlayer times
  const assignments: (Player | 'VACANT')[] = [];
  
  for (let round = 0; round < picksPerPlayer; round++) {
    players.forEach(player => {
      assignments.push(player);
    });
  }
  
  // Add VACANT slots for remainder
  for (let i = 0; i < vacantCount; i++) {
    assignments.push('VACANT');
  }
  
  // Simple random shuffle - consecutive same-player is acceptable
  return shuffle(assignments);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### VACANT Slot Display

**File: `src/components/tv/TvNumberCell.tsx`**

```tsx
// If not assigned to any player (VACANT)
if (!isAssigned && !wrestlerName) {
  return (
    <div 
      className="relative aspect-square rounded-xl flex flex-col items-center justify-center"
      style={{
        border: "2px dashed rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span className="text-3xl font-light" style={{ color: "#555" }}>
        {number}
      </span>
      <div className="absolute bottom-3 left-4 right-4 border-t border-dashed border-white/20" />
    </div>
  );
}
```

---

## Technical Specifications

### Extended Player Colors (10 players max)

```typescript
const PLAYER_COLORS = [
  { hex: '#e91e63', textColor: 'black' },  // Pink
  { hex: '#f44336', textColor: 'white' },  // Red
  { hex: '#ff9800', textColor: 'black' },  // Orange
  { hex: '#ffc107', textColor: 'black' },  // Amber
  { hex: '#4caf50', textColor: 'black' },  // Green
  { hex: '#00bcd4', textColor: 'black' },  // Cyan
  { hex: '#2196f3', textColor: 'white' },  // Blue
  { hex: '#9c27b0', textColor: 'white' },  // Purple
  { hex: '#795548', textColor: 'white' },  // Brown
  { hex: '#607d8b', textColor: 'white' },  // Blue Gray
];
```

### Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Score bar fill | 0.5s | ease-out |
| Row highlight pulse | 0.3s | ease |
| All transitions | 0.2s | ease |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tv/RumblePropsDisplay.tsx` | Bigger rows, images with names, 2x2 Final Four, colored headers |
| `src/components/tv/TvLeaderboardView.tsx` | Complete redesign to horizontal bar list |
| `src/components/tv/ActiveMatchDisplay.tsx` | Larger images, player-colored prediction bar, remove label |
| `src/components/tv/RumbleWinnerPredictions.tsx` | Bigger cards, remove locks, strip asterisks, colored names |
| `src/components/tv/TvNumberCell.tsx` | Add VACANT slot styling |
| `src/components/tv/WrestlerImage.tsx` | Add `tv` size variant (180px) |
| `src/components/tv/TvViewNavigator.tsx` | Pass player colors to child components |
| `src/index.css` | Add score bar animation, row glow effects |

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | **Leaderboard redesign** - Highest visual impact | High |
| 2 | **Rumble Props table** - Bigger rows, wrestler names, Final Four grid | High |
| 3 | **Winner Predictions** - Bigger cards, remove locks/asterisks | Medium |
| 4 | **Undercard Match** - Player-colored bar, larger images | Medium |
| 5 | **VACANT slots** - New styling for unassigned numbers | Low |
| 6 | **Draft distribution algorithm** - Simple random shuffle | Low |

---

## Summary of Changes

| Screen | Key Improvements |
|--------|-----------------|
| **Rumble Props** | 100-120px rows, 70-80px images with names, 2x2 Final Four grid, colored column headers |
| **Leaderboard** | Horizontal bar list with player colors, remove title, animated score changes |
| **Undercard** | 180-200px wrestler images, player-colored prediction bar, "Worth 10 pts" indicator |
| **Entry Grid** | 140px prediction cards, no locks, stripped asterisks, player-colored names, VACANT slot styling |
| **Draft Algorithm** | Simple random shuffle (consecutive same-player is acceptable per user preference) |

