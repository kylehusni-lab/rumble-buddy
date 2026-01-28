

# TV Display Enhancement Plan

## Current State Analysis

The TV display currently has:
- A minimal header (logo + party code)
- A 12-column grid with 10 columns for content and 2 for leaderboard
- Navigation via small dots at the bottom and chevron buttons
- 7 views: 3 undercard matches, Men's Rumble, Men's Props, Women's Rumble, Women's Props

### Issues Identified
1. **Navigation friction** - Small dots and separated chevrons aren't TV-friendly
2. **Wasted header space** - Header is minimal, could show useful info
3. **No view context** - Hard to know what you're looking at from across the room
4. **No live activity feed** - Missing real-time event updates

---

## Proposed Enhancements

### 1. Tab Navigation Bar (Replace Dots)

Replace the bottom dot indicators with a prominent horizontal tab bar showing all 7 views:

| Tab | Icon | Label |
|-----|------|-------|
| 1 | Swords | Match 1 |
| 2 | Swords | Match 2 |
| 3 | Swords | Match 3 |
| 4 | Users | Men's Grid |
| 5 | List | Men's Props |
| 6 | Users | Women's Grid |
| 7 | List | Women's Props |

- Active tab highlighted with primary color
- Completed tabs show green checkmark
- Clickable for quick navigation
- Shows keyboard shortcuts (1-7)

### 2. Enhanced Header Bar

Expand the header to show:
- **Left**: Logo + Party Code (existing)
- **Center**: Current view title (large, readable from distance)
- **Right**: Live stats pill showing:
  - Active wrestlers count (during Rumble views)
  - Total eliminations
  - Time since last action

### 3. Live Activity Ticker

Add a scrolling ticker at the bottom showing recent events:
- "Roman Reigns eliminated by Seth Rollins"
- "Entry #15: Cody Rhodes owned by Mike"
- "Drew McIntyre wins undercard match"

This fills dead space and keeps viewers engaged even when not actively watching.

### 4. Auto-Rotate Mode

Add an auto-rotate toggle that cycles through views every 30 seconds:
- Useful for ambient display during watch party
- Pause indicator shows when paused
- Any manual navigation pauses auto-rotate

### 5. Fullscreen Mode Button

Add a fullscreen toggle in the header for true TV display experience.

---

## File Changes

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Add header stats, activity tracker state, auto-rotate logic |
| `src/components/tv/TvViewNavigator.tsx` | Replace dots with tab bar component |
| `src/components/tv/TvTabBar.tsx` | **New** - Horizontal navigation tabs |
| `src/components/tv/TvActivityTicker.tsx` | **New** - Scrolling event feed |
| `src/components/tv/TvHeaderStats.tsx` | **New** - Live stats display |

---

## Technical Details

### TvTabBar Component
```tsx
interface TvTabBarProps {
  views: View[];
  currentIndex: number;
  onSelectView: (index: number) => void;
  isViewComplete: (view: View) => boolean;
}

// Renders as:
// [Match 1 ✓] [Match 2 ✓] [Match 3] [Men's ●] [M Props] [Women's] [W Props]
```

### Activity Tracking
Track events in state array (max 20 recent events):
```tsx
interface ActivityEvent {
  id: string;
  type: "entry" | "elimination" | "result";
  message: string;
  timestamp: Date;
}
```

### Auto-Rotate Logic
```tsx
const [autoRotate, setAutoRotate] = useState(false);
const [rotateInterval, setRotateInterval] = useState(30000); // 30s

useEffect(() => {
  if (!autoRotate) return;
  const timer = setInterval(goToNext, rotateInterval);
  return () => clearInterval(timer);
}, [autoRotate, rotateInterval]);
```

---

## Visual Layout (After Changes)

```text
+------------------------------------------------------------------+
| [Logo]  Party #9301    MEN'S ROYAL RUMBLE    Active: 12 | Auto ⟳ |
+------------------------------------------------------------------+
|                                                                  |
|                      [Main Content Area]                         |
|                      (Match/Grid/Props)                          |
|                                                                  |
|                                                         +--------+
|                                                         | Leader |
|                                                         | board  |
|                                                         +--------+
+------------------------------------------------------------------+
| [1] Match 1 ✓ | [2] Match 2 ✓ | [3] Match 3 | [4] Men's ● | ... |
+------------------------------------------------------------------+
| ← Roman Reigns eliminated • Entry #15 Cody Rhodes (Mike) • ... → |
+------------------------------------------------------------------+
```

---

## Implementation Order

1. **TvTabBar.tsx** - Create new tab navigation component
2. **TvActivityTicker.tsx** - Create scrolling event feed
3. **TvHeaderStats.tsx** - Create live stats display
4. **TvViewNavigator.tsx** - Replace dots with TvTabBar
5. **TvDisplay.tsx** - Integrate all components, add auto-rotate

---

## Summary

| Enhancement | Benefit |
|-------------|---------|
| Tab navigation bar | TV-friendly, one-click access to any view |
| Enhanced header | View title readable from across room |
| Live activity ticker | Fills space, keeps engagement high |
| Auto-rotate mode | Hands-free ambient display |
| Fullscreen button | True TV experience |

