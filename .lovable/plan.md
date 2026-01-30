

## Host Setup Dashboard Improvements

This plan enhances the Host Setup page by adding direct pick editing access and moving TV Mode to a prominent button alongside Start Event.

---

### Changes Overview

| Area | Change |
|------|--------|
| Host Setup Page | Add "My Picks" card with status and edit button |
| Footer Actions | Add TV Mode as second button alongside Start Event |
| Quick Actions Menu | Remove "My Picks & Stats" and "TV Display" options |

---

### 1. Add "My Picks" Status Card to HostSetup

**File:** `src/pages/HostSetup.tsx`

Add a new card section below the "Event Status" card that shows the host's current picks progress and provides a button to edit.

- Fetch the host's picks count using `getPlayerSession().playerId`
- Display progress (e.g., "5/20 picks made")
- Include an "Edit My Picks" button that navigates to the player dashboard
- If the host hasn't joined as a player yet, show a prompt to join first

```typescript
// New section after Status Overview
<motion.div className="bg-card border border-border rounded-2xl p-5">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Trophy className="text-primary" size={24} />
      <div>
        <h3 className="font-bold">My Picks</h3>
        <p className="text-sm text-muted-foreground">
          {hostPicksCount}/20 picks made
        </p>
      </div>
    </div>
    <Button variant="outline" onClick={handleEditMyPicks}>
      <Pencil size={16} className="mr-2" />
      Edit
    </Button>
  </div>
</motion.div>
```

---

### 2. Add TV Mode Button to Footer

**File:** `src/pages/HostSetup.tsx`

Modify the sticky footer to include two buttons side-by-side:
- TV Mode (secondary/outline style) - opens in new tab
- Start Event (primary/gold style)

```typescript
// Updated footer with two buttons
<div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
  <div className="max-w-lg mx-auto space-y-2">
    {players.length < 2 && (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <AlertCircle size={16} />
        Need at least 2 guests to start
      </div>
    )}
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="lg"
        className="flex-1"
        onClick={() => window.open(`/tv/${code}`, "_blank")}
      >
        <Tv className="mr-2" size={20} />
        TV Mode
      </Button>
      <Button
        variant="gold"
        size="lg"
        className="flex-1"
        onClick={handleStartEvent}
        disabled={isStarting || players.length < 2}
      >
        <Play className="mr-2" size={20} />
        {isStarting ? "Starting..." : "Start Event"}
      </Button>
    </div>
  </div>
</div>
```

---

### 3. Simplify Quick Actions Menu

**File:** `src/components/host/QuickActionsSheet.tsx`

Remove "My Picks & Stats" and "TV Display" from the actions array since they're now directly accessible on the dashboard.

Keep these actions:
- My Dashboard (back to all parties)
- View All Picks (see everyone's predictions)
- Number Assignments (who owns what)
- Sign Out

---

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/HostSetup.tsx` | Add My Picks card, add TV Mode button to footer |
| `src/components/host/QuickActionsSheet.tsx` | Remove My Picks & Stats and TV Display actions |

---

### User Flow After Changes

1. **Host sees their picks status** directly on the dashboard with an Edit button
2. **TV Mode** is always one tap away in the footer
3. **Start Event** remains the primary action in the footer
4. **Hamburger menu** is cleaner with just navigation and utility options

