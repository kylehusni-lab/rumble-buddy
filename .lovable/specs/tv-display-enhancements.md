# TV Display Enhancements Spec

## Overview

Enhance the TV Display (`/tv/{code}`) for optimal group viewing experience at watch parties. Focus on making the display more informative, dramatic, and engaging for audiences watching together.

---

## 1. Enhanced Number Cells with Wrestler & Owner Info

### Current State
- Active cells show only the number and player initial (e.g., "1" + "R")
- No wrestler name visible on the grid
- Difficult to know at-a-glance who's in the ring

### Proposed Design

```text
ACTIVE CELL (expanded info):
┌─────────────────┐
│       #1        │  ← Number (bold, prominent)
│   CM Punk       │  ← Wrestler name (truncated if needed)
│   Randy S.      │  ← Owner name (smaller, muted)
└─────────────────┘

ELIMINATED CELL:
┌─────────────────┐
│       #5        │
│   ╲  John  ╱   │  ← Strikethrough effect
│     Cena       │
└─────────────────┘

PENDING CELL (unchanged):
┌─────────────────┐
│       #15       │  ← Just the number
│                 │
└─────────────────┘
```

### Technical Implementation

```typescript
// In renderNumberGrid function
{status === "active" && (
  <div className="text-center">
    <div className="font-bold text-lg">{num.number}</div>
    <div className="text-[9px] font-medium truncate leading-tight">
      {num.wrestler_name?.split(" ")[0] || "Unknown"}
    </div>
    <div className="text-[8px] text-muted-foreground truncate">
      {getPlayerName(num.assigned_to_player_id)?.split(" ")[0]}
    </div>
  </div>
)}
```

### Cell Size Adjustment
- Increase cell min-height to accommodate 3 lines of text
- Use `aspect-[4/5]` instead of `aspect-square` for active cells
- Maintain grid gap for readability

---

## 2. "In Ring" Active Wrestlers Sidebar

### Purpose
Quick reference panel showing who's currently in the ring with live duration timers.

### Layout (Right side, below leaderboard or as toggle)

```text
┌─────────────────────────────────┐
│  🏆 Leaderboard                 │
│  1. Demo Host          0       │
│  2. Randy Savage       0       │
│  ...                           │
├─────────────────────────────────┤
│  🔥 IN THE RING (3)            │
├─────────────────────────────────┤
│  #3  Rhea Ripley     2:45      │
│       └ The Rock               │
│  #2  Charlotte       3:12      │
│       └ Hulk Hogan             │
│  #1  Asuka           3:30      │
│       └ Demo Host              │
└─────────────────────────────────┘
```

### Features
- Sort by entry time (most recent first)
- Live duration counter (updates every second)
- Wrestler name + owner on each row
- Scroll if more than 5 active
- Pulse animation on new entry

### Technical Implementation

```typescript
interface ActiveWrestler {
  number: number;
  wrestlerName: string;
  ownerName: string;
  entryTimestamp: string;
  duration: number; // calculated live
}

// Component: InRingSidebar
const InRingSidebar = ({ numbers, getPlayerName }: Props) => {
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const activeWrestlers = numbers
    .filter(n => n.entry_timestamp && !n.elimination_timestamp)
    .map(n => ({
      ...n,
      duration: Math.floor((Date.now() - new Date(n.entry_timestamp!).getTime()) / 1000),
    }))
    .sort((a, b) => b.duration - a.duration); // Longest first
  
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3">
        🔥 In The Ring ({activeWrestlers.length})
      </h3>
      <ScrollArea className="max-h-48">
        {activeWrestlers.map((w, i) => (
          <motion.div
            key={w.number}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <div>
              <div className="font-medium">
                <span className="text-primary">#{w.number}</span> {w.wrestlerName}
              </div>
              <div className="text-xs text-muted-foreground">
                └ {getPlayerName(w.assigned_to_player_id)}
              </div>
            </div>
            <div className="font-mono text-sm tabular-nums">
              {formatDuration(w.duration)}
            </div>
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  );
};
```

---

## 3. Leaderboard Point Change Animations

### Current State
- Points update silently
- No visual feedback when scores change

### Proposed Behavior

When points change:
1. Flash the row with gold glow
2. Show floating "+25" or "+50" badge
3. Re-sort with smooth position animation
4. Highlight leader changes

### Visual Design

```text
BEFORE POINT CHANGE:
┌─────────────────────────────────┐
│  1. Demo Host          25      │
│  2. Randy Savage       20      │ ← About to get +25
│  3. Hulk Hogan         15      │
└─────────────────────────────────┘

DURING ANIMATION:
┌─────────────────────────────────┐
│  1. Demo Host          25      │
│  2. Randy Savage   ✨ +25 ✨   │ ← Floating badge
│  3. Hulk Hogan         15      │
└─────────────────────────────────┘

AFTER RE-SORT:
┌─────────────────────────────────┐
│  1. Randy Savage       45 🔥   │ ← New leader!
│  2. Demo Host          25      │
│  3. Hulk Hogan         15      │
└─────────────────────────────────┘
```

### Technical Implementation

```typescript
const [pointChanges, setPointChanges] = useState<Record<string, number>>({});
const prevPlayersRef = useRef<Player[]>([]);

useEffect(() => {
  // Detect point changes
  const changes: Record<string, number> = {};
  
  players.forEach(player => {
    const prev = prevPlayersRef.current.find(p => p.id === player.id);
    if (prev && player.points > prev.points) {
      changes[player.id] = player.points - prev.points;
    }
  });
  
  if (Object.keys(changes).length > 0) {
    setPointChanges(changes);
    setTimeout(() => setPointChanges({}), 2000);
  }
  
  prevPlayersRef.current = [...players];
}, [players]);

// In render:
<motion.div
  layout // Enables smooth position transitions
  className={`... ${pointChanges[player.id] ? "ring-2 ring-primary animate-pulse" : ""}`}
>
  <span>{player.display_name}</span>
  <div className="relative">
    <span>{player.points}</span>
    <AnimatePresence>
      {pointChanges[player.id] && (
        <motion.span
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -30 }}
          className="absolute -top-2 right-0 text-primary font-bold text-sm"
        >
          +{pointChanges[player.id]}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
</motion.div>
```

---

## 4. Recent Activity Ticker

### Purpose
Rolling feed of recent events for context when you look away and back.

### Layout (Bottom of screen, full width)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 📢 #12 Rey Mysterio eliminated by #7 Gunther • +5 pts Stone Cold        │
│    #11 Seth Rollins ENTERED (owned by Demo Host)                        │
│    🏅 Final Four reached! +10 pts to remaining owners                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Event Types

| Event | Format | Icon |
|-------|--------|------|
| Entry | `#{n} {Wrestler} ENTERED (owned by {Player})` | 🎺 |
| Elimination | `#{n} {Wrestler} eliminated by #{eliminator}` | ❌ |
| Points Awarded | `+{pts} pts to {Player} ({reason})` | 💰 |
| Final Four | `Final Four reached! +10 pts to remaining owners` | 🏅 |
| Winner | `🏆 #{n} {Wrestler} WINS! {Player} earns +50 pts` | 🏆 |
| Iron Man | `⏱️ Iron Man: {Wrestler} ({duration}) - +20 pts to {Player}` | ⏱️ |
| Jobber Penalty | `😬 Jobber Penalty: {Wrestler} out in {duration}s (-10 pts)` | 😬 |

### Technical Implementation

```typescript
interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: "entry" | "elimination" | "points" | "final-four" | "winner" | "iron-man" | "jobber";
  message: string;
  icon: string;
}

const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);

// Add events from realtime subscriptions
const addActivity = (event: Omit<ActivityEvent, "id" | "timestamp">) => {
  setActivityFeed(prev => [
    { ...event, id: crypto.randomUUID(), timestamp: new Date() },
    ...prev.slice(0, 9), // Keep last 10
  ]);
};

// Component: ActivityTicker
const ActivityTicker = ({ events }: { events: ActivityEvent[] }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border">
    <div className="max-w-screen-xl mx-auto p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span>📢</span>
        <span className="font-semibold">Recent Activity</span>
      </div>
      <div className="space-y-1 max-h-20 overflow-hidden">
        {events.slice(0, 3).map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1 - i * 0.2, x: 0 }}
            className="text-sm flex items-center gap-2"
          >
            <span>{event.icon}</span>
            <span>{event.message}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatTimeAgo(event.timestamp)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
```

---

## 5. Elimination Animation

### Current State
- Eliminated cells just show a diagonal line
- No animation or drama

### Proposed Animation

When elimination occurs:
1. Cell flashes red briefly
2. "X" or skull icon animates in
3. Cell fades to muted/gray state
4. Strikethrough appears

### Framer Motion Implementation

```typescript
const EliminatedCell = ({ number, wrestlerName }: Props) => {
  const [justEliminated, setJustEliminated] = useState(false);
  
  useEffect(() => {
    // Trigger animation on first render (when elimination just happened)
    setJustEliminated(true);
    const timer = setTimeout(() => setJustEliminated(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      className="number-cell number-cell-eliminated relative"
      animate={justEliminated ? {
        scale: [1, 1.1, 0.95, 1],
        backgroundColor: ["hsl(var(--destructive))", "hsl(var(--muted))"],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center opacity-50">
        <div className="font-bold">{number}</div>
        <div className="text-[9px] truncate">{wrestlerName?.split(" ")[0]}</div>
      </div>
      
      {/* Animated X overlay */}
      <motion.div
        initial={justEliminated ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <X className="text-destructive/60" size={32} />
      </motion.div>
    </motion.div>
  );
};
```

---

## Layout Adjustments

### Updated Grid Structure

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  👑 ROYAL RUMBLE 2026                                    Status: LIVE 🟢   │
│  Party 5246                                                                │
├────────────────────────────────────────────────┬───────────────────────────┤
│                                                │                           │
│  🧔 Men's Royal Rumble              Active: 0  │  🏆 Leaderboard           │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐              │  ┌───────────────────────┐ │
│  │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│              │  │ 1. Demo Host      0   │ │
│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤              │  │ 2. Randy Savage   0   │ │
│  │11│12│13│14│15│16│17│18│19│20│              │  │ ...                   │ │
│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤              │  └───────────────────────┘ │
│  │21│22│23│24│25│26│27│28│29│30│              │                           │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘              │  🔥 In The Ring (3)       │
│                                                │  ┌───────────────────────┐ │
│  👩 Women's Royal Rumble            Active: 3  │  │ #3 Rhea Ripley  2:45  │ │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐              │  │ #2 Charlotte    3:12  │ │
│  │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│              │  │ #1 Asuka        3:30  │ │
│  │🟡│🟡│🟡│  │  │  │  │  │  │  │              │  └───────────────────────┘ │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘              │                           │
│  ...                                           │                           │
├────────────────────────────────────────────────┴───────────────────────────┤
│  📢 #3 Rhea Ripley ENTERED (owned by The Rock) • #2 Charlotte ENTERED...  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Update grid cells, add point tracking, integrate new components |
| `src/index.css` | Add TV-specific animations and cell styles |

### New Files

| File | Purpose |
|------|---------|
| `src/components/tv/InRingSidebar.tsx` | Active wrestlers panel with durations |
| `src/components/tv/ActivityTicker.tsx` | Recent events feed |
| `src/components/tv/LeaderboardCard.tsx` | Extracted leaderboard with animations |
| `src/components/tv/NumberCell.tsx` | Enhanced cell with states and animations |

---

## Implementation Order

1. **Phase 1**: Enhanced number cells (wrestler + owner names)
2. **Phase 2**: Elimination animations
3. **Phase 3**: In-Ring sidebar
4. **Phase 4**: Point change animations
5. **Phase 5**: Activity ticker

Each phase is independently deployable and adds value.
