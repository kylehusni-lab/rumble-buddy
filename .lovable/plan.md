
# TV Display - Single View Navigation

## Overview

Transform the TV display from showing all content at once to a **carousel-style single-view experience** with navigation controls. Each match/Rumble is displayed one at a time with left/right navigation.

---

## Current Issue

The TV display currently shows:
- Active match display (during undercard)
- BOTH Rumble grids stacked vertically
- All visible simultaneously = cluttered

## Desired Behavior

Show **one view at a time** with navigation arrows:

```text
+----------------------------------------------------------+
|  [<]                    1 / 5                       [>]  |
+----------------------------------------------------------+
|                                                          |
|              CURRENT VIEW (one of these):                |
|                                                          |
|   - Undercard Match 1 (Drew vs Sami)                     |
|   - Undercard Match 2 (Punk vs Logan)                    |
|   - Undercard Match 3 (AJ vs Gunther)                    |
|   - Men's Royal Rumble (number grid)                     |
|   - Women's Royal Rumble (number grid)                   |
|                                                          |
+----------------------------------------------------------+
```

---

## Views Array (5 total)

| Index | Type | Title | Content |
|-------|------|-------|---------|
| 0 | undercard | Drew McIntyre vs Sami Zayn | Match display with photos |
| 1 | undercard | CM Punk vs Logan Paul | Match display with photos |
| 2 | undercard | AJ Styles vs Gunther | Match display with photos |
| 3 | rumble | Men's Royal Rumble | 10x3 number grid |
| 4 | rumble | Women's Royal Rumble | 10x3 number grid |

---

## Navigation Logic

### State
```typescript
const [currentViewIndex, setCurrentViewIndex] = useState(0);
const totalViews = 5; // 3 undercard + 2 rumbles
```

### Auto-Focus (Smart Default)
When a match result comes in, auto-advance to the next incomplete match:
```typescript
useEffect(() => {
  // Find first incomplete match
  const firstIncompleteIndex = views.findIndex(v => !isComplete(v));
  if (firstIncompleteIndex !== -1 && firstIncompleteIndex !== currentViewIndex) {
    setCurrentViewIndex(firstIncompleteIndex);
  }
}, [matchResults]);
```

### Manual Navigation
- Left arrow: `currentViewIndex - 1` (wrap to end)
- Right arrow: `currentViewIndex + 1` (wrap to start)
- Keyboard support: Arrow keys
- Dots indicator showing current position

---

## Technical Implementation

### New Component: `TvViewNavigator.tsx`

A wrapper component that handles:
1. View state management
2. Navigation controls (arrows + dots)
3. Keyboard navigation
4. Smooth transitions between views

```typescript
interface TvViewNavigatorProps {
  matchResults: MatchResult[];
  mensNumbers: RumbleNumber[];
  womensNumbers: RumbleNumber[];
  players: Player[];
  picks: Pick[];
  getPlayerInitials: (id: string | null) => string;
  getNumberStatus: (num: RumbleNumber) => "pending" | "active" | "eliminated";
}

// Internal views definition
const views = [
  { type: "undercard", id: "undercard_1", ...UNDERCARD_MATCHES[0] },
  { type: "undercard", id: "undercard_2", ...UNDERCARD_MATCHES[1] },
  { type: "undercard", id: "undercard_3", ...UNDERCARD_MATCHES[2] },
  { type: "rumble", id: "mens", title: "Men's Royal Rumble" },
  { type: "rumble", id: "womens", title: "Women's Royal Rumble" },
];
```

### Updated Match Display

Modify `ActiveMatchDisplay` to accept a specific match instead of auto-detecting:

```typescript
interface ActiveMatchDisplayProps {
  match: typeof UNDERCARD_MATCHES[number];
  matchResults: MatchResult[];
}
```

### TvDisplay.tsx Changes

Replace the stacked content with the navigator:

```typescript
// Before
{isUndercardPhase && <ActiveMatchDisplay matchResults={matchResults} />}
{renderNumberGrid(mensNumbers, "Men's Royal Rumble")}
{renderNumberGrid(womensNumbers, "Women's Royal Rumble")}

// After
<TvViewNavigator
  matchResults={matchResults}
  mensNumbers={mensNumbers}
  womensNumbers={womensNumbers}
  players={players}
  picks={picks}
  getPlayerInitials={getPlayerInitials}
  getNumberStatus={getNumberStatus}
/>
```

---

## UI Design

### Navigation Controls

```text
+------------------------------------------------------------------+
|                                                                  |
|  [<]                                                        [>]  |
|                                                                  |
|                    ┌──────────────────────┐                      |
|                    │                      │                      |
|                    │   CURRENT MATCH/     │                      |
|                    │   RUMBLE VIEW        │                      |
|                    │                      │                      |
|                    └──────────────────────┘                      |
|                                                                  |
|                        ● ○ ○ ○ ○                                 |
|                       (dot indicators)                           |
|                                                                  |
+------------------------------------------------------------------+
```

### Arrow Buttons
- Large circular buttons (48px)
- Semi-transparent background
- Positioned at left/right edges
- Show on hover or always visible (TV remote friendly)

### Progress Dots
- 5 dots at the bottom center
- Filled dot = current view
- Can click dots to jump to specific view (optional)

### Match Status Badge
Show completion status on each view:
- Undercard: "LIVE" pulse or "COMPLETE" with winner name
- Rumble: "LIVE" pulse with active count or "COMPLETE"

---

## Transitions

Use Framer Motion `AnimatePresence` for smooth view transitions:

```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={currentViewIndex}
    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
    transition={{ duration: 0.3 }}
  >
    {renderCurrentView()}
  </motion.div>
</AnimatePresence>
```

---

## File Changes

| File | Changes |
|------|---------|
| `src/components/tv/TvViewNavigator.tsx` | **NEW** - Navigation wrapper with view switching |
| `src/components/tv/ActiveMatchDisplay.tsx` | Accept `match` prop instead of auto-detecting |
| `src/pages/TvDisplay.tsx` | Replace stacked content with TvViewNavigator, remove emojis from grid titles |

---

## Auto-Advance Behavior

When a match result is recorded:
1. Show brief "result" animation (if enabled)
2. After 3 seconds, auto-advance to next incomplete view
3. User can still manually navigate at any time

```typescript
useEffect(() => {
  const autoAdvanceTimer = setTimeout(() => {
    const nextIncomplete = views.findIndex((v, i) => 
      i > currentViewIndex && !isViewComplete(v)
    );
    if (nextIncomplete !== -1) {
      setCurrentViewIndex(nextIncomplete);
    }
  }, 3000);
  return () => clearTimeout(autoAdvanceTimer);
}, [matchResults]);
```

---

## Keyboard Support

For TV remote or wireless keyboard:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key >= "1" && e.key <= "5") {
      setCurrentViewIndex(parseInt(e.key) - 1);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| All matches complete | Show final view (Women's Rumble) with "Event Complete" badge |
| Navigate past end | Wrap to first view |
| Navigate before start | Wrap to last view |
| Match result while viewing | Show inline result, then auto-advance |
| Entry/elimination overlay | Overlays appear on top of current view |

---

## Testing Checklist

- [ ] Left/right arrows navigate between views
- [ ] Dot indicators show current position
- [ ] Clicking dots jumps to specific view
- [ ] Keyboard arrows work
- [ ] Views transition smoothly
- [ ] Match displays show correct match
- [ ] Rumble grids show correct data
- [ ] Auto-advance works after match result
- [ ] Wrapping works at both ends
- [ ] No emojis in Rumble titles
