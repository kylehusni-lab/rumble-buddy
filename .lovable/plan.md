

# Enhanced Plan: Solo Mode Inline Editing + Mobile UI Optimization

## Overview

This plan adds two improvements to Solo Mode:
1. **Single Pick Editing**: Add inline pencil icons to edit individual picks without navigating to the full picks flow (like Group mode)
2. **Mobile UI Optimization**: Redesign the Rumble Props view for mobile with larger avatars and list-style layout

---

## Part 1: Add Single Pick Edit to Solo Dashboard

### Approach
Reuse the existing `SinglePickEditModal` component and add edit icons to Solo Dashboard tabs.

### File: `src/pages/SoloDashboard.tsx`

**Step 1: Add imports and state**
```typescript
import { SinglePickEditModal } from "@/components/dashboard/SinglePickEditModal";
import { Pencil } from "lucide-react";

// Add edit modal state
const [editModalOpen, setEditModalOpen] = useState(false);
const [editingMatchId, setEditingMatchId] = useState("");
const [editingCurrentPick, setEditingCurrentPick] = useState("");
```

**Step 2: Add handler functions**
```typescript
const handleEditPick = (matchId: string, currentPick: string) => {
  setEditingMatchId(matchId);
  setEditingCurrentPick(currentPick);
  setEditModalOpen(true);
};

const handleSavePick = async (matchId: string, newValue: string) => {
  const newPicks = { ...picks, [matchId]: newValue };
  saveSoloPicks(newPicks);
  setPicks(newPicks);
  savePicksToCloud(newPicks);
  toast.success("Pick updated!");
};

// Determine if editing is allowed (before scoring starts)
const hasResults = Object.keys(results).length > 0;
const canEditPicks = !hasResults;
```

**Step 3: Pass handlers to tabs**
```typescript
{activeTab === "matches" && (
  <MatchesTab 
    picks={picks} 
    results={results} 
    onEditPick={handleEditPick}
    canEdit={canEditPicks}
  />
)}
{activeTab === "mens" && (
  <RumbleTab 
    gender="mens" 
    picks={picks} 
    results={results} 
    onEditPick={handleEditPick}
    canEdit={canEditPicks}
  />
)}
// ... same for womens and chaos tabs
```

**Step 4: Render modal**
```typescript
<SinglePickEditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  matchId={editingMatchId}
  currentPick={editingCurrentPick}
  onSave={handleSavePick}
  mensEntrants={mensEntrants}
  womensEntrants={womensEntrants}
/>
```

---

## Part 2: Mobile UI Optimization for Rumble Props

### The Changes

| Aspect | Before | After (Mobile) |
|--------|--------|----------------|
| Layout | 2-column grid | Single-column vertical stack |
| Avatar Size | 40px (w-10 h-10) | 56px (w-14 h-14) |
| Row Style | Card grid | List items with left avatar |
| Row Height | ~60px | 64px+ for better tap targets |
| Tap Area | Small card | Full row is tappable |

### File: `src/pages/SoloDashboard.tsx` - RumbleTab Component

**Use `useIsMobile()` hook for responsive layout:**
```typescript
import { useIsMobile } from "@/hooks/use-mobile";

const RumbleTab = memo(function RumbleTab({ 
  gender, picks, results, onEditPick, canEdit 
}) {
  const isMobile = useIsMobile();
  // ...
```

**Mobile Layout (single column list items):**
```typescript
{isMobile ? (
  // MOBILE: Single-column stack with large avatars
  <div className="space-y-2">
    {RUMBLE_PROPS.map((prop) => {
      // ... prop data setup
      return (
        <button
          key={matchId}
          onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
          className={cn(
            "w-full min-h-[64px] p-3 rounded-xl border flex items-center gap-4",
            "transition-all active:scale-[0.98]",
            isCorrect ? "bg-success/10 border-success" :
            isWrong ? "bg-destructive/10 border-destructive" :
            "bg-card border-border hover:border-primary/50"
          )}
        >
          {/* Large avatar on left */}
          <div className="relative flex-shrink-0">
            {pick ? (
              <img
                src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                className={cn(
                  "w-14 h-14 rounded-full object-cover border-2",
                  isCorrect ? "border-success" :
                  isWrong ? "border-destructive" : 
                  "border-primary"
                )}
              />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground/50" />
              </div>
            )}
            {/* Correctness badge overlay */}
            {isCorrect && <CheckBadge />}
            {isWrong && <XBadge />}
          </div>
          
          {/* Title and name stacked on right */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {prop.title}
            </div>
            <div className="font-semibold text-foreground truncate">
              {pick ? getEntrantDisplayName(pick) : `+${points} pts`}
            </div>
          </div>
          
          {/* Edit icon or result indicator */}
          <div className="flex-shrink-0">
            {canEdit && !result && (
              <Pencil size={16} className="text-muted-foreground" />
            )}
            {isCorrect && <PointsBadge points={points} />}
          </div>
        </button>
      );
    })}
  </div>
) : (
  // DESKTOP: Keep existing 2-column grid
  <div className="grid grid-cols-2 gap-2">
    {/* ... existing grid code ... */}
  </div>
)}
```

**Visual Design Specs:**

```text
+--------------------------------------------------+
| [56px Avatar]  #1 ENTRANT                    [P] |
|                Roman Reigns                      |
+--------------------------------------------------+
| [56px Avatar]  IRON MAN                      [P] |
|                Cody Rhodes                       |
+--------------------------------------------------+
| [Empty Circle] MOST ELIMINATIONS             [P] |
|                +15 pts                           |
+--------------------------------------------------+

[P] = Pencil icon (only on mobile, only when editable)
Avatar = 56px circular with 2px colored border
Row height = 64px minimum for tap targets
```

---

## Part 3: Final Four Mobile Enhancement

**Current**: 4 small photos in a row (64px each)
**Updated**: Increase to 72px on mobile for better visibility

```typescript
// Final Four grid - slightly larger photos on mobile
<div className={cn(
  "grid gap-3 justify-items-center",
  isMobile ? "grid-cols-4" : "grid-cols-4"
)}>
  {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, i) => {
    // ...
    return (
      <div key={matchId} className="flex flex-col items-center">
        <button
          onClick={() => canEdit && !isResulted && onEditPick?.(matchId, pick || "")}
          className="relative"
        >
          {pick ? (
            <img
              className={cn(
                isMobile ? "w-[72px] h-[72px]" : "w-16 h-16",
                "rounded-full object-cover border-2",
                isCorrect ? "border-success" : isWrong ? "border-destructive" : "border-primary"
              )}
            />
          ) : (
            <div className={cn(
              isMobile ? "w-[72px] h-[72px]" : "w-16 h-16",
              "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
            )}>
              <Plus className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
        </button>
      </div>
    );
  })}
</div>
```

---

## Part 4: Update MatchesTab and ChaosTab with Edit Icons

### MatchesTab Changes

Add pencil icons to each match/winner row:

```typescript
const MatchesTab = memo(function MatchesTab({ 
  picks, results, onEditPick, canEdit 
}) {
  // ...
  return (
    <div className="space-y-3">
      {matchCards.map((card) => {
        const pick = picks[card.id];
        const result = results[card.id];
        // ...
        return (
          <div className="p-4 rounded-xl border ...">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{card.title}</div>
                <div className="font-semibold">Your Pick: {pick || "—"}</div>
              </div>
              {canEdit && !result && (
                <button onClick={() => onEditPick?.(card.id, pick || "")}>
                  <Pencil size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
```

### ChaosTab Changes

Add pencil icons to each table row:

```typescript
const ChaosTab = memo(function ChaosTab({
  picks, results, onEditPick, canEdit
}) {
  // ...
  const renderCell = (matchId: string) => {
    const pick = picks[matchId];
    const result = results[matchId];
    const isCorrect = getPickResult(matchId);
    
    return (
      <button
        onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded min-h-[44px]",
          canEdit && !result && "hover:bg-muted/50 transition-colors",
          isCorrect === true ? "bg-success/10" :
          isCorrect === false ? "bg-destructive/10" : ""
        )}
      >
        <span className="font-bold">{pick || "—"}</span>
        {isCorrect === true && <Check size={14} className="text-success" />}
        {isCorrect === false && <X size={14} className="text-destructive" />}
        {canEdit && !result && pick && (
          <Pencil size={12} className="text-muted-foreground ml-1" />
        )}
      </button>
    );
  };
});
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Add SinglePickEditModal import, state, handlers; Update all 4 tabs with edit props; Add mobile-responsive list layout to RumbleTab; Increase Final Four photos on mobile |

---

## Visual Comparison

**Desktop (unchanged)**:
```text
+-------------+  +-------------+
| #1 Entrant  |  | Iron Man    |
| [40px] Name |  | [40px] Name |
+-------------+  +-------------+
```

**Mobile (new list layout)**:
```text
+--------------------------------------------------+
| [56px]  #1 ENTRANT             [Pencil]          |
|         Roman Reigns                              |
+--------------------------------------------------+
| [56px]  IRON MAN               [Pencil]          |
|         Cody Rhodes                               |
+--------------------------------------------------+
```

---

## Testing Checklist

1. Open Solo Dashboard on mobile viewport
2. Verify Rumble Props display as single-column list with 56px avatars
3. Verify each row is at least 64px tall and feels "chunky" to tap
4. Tap a prop row - verify WrestlerPickerModal opens
5. Select a wrestler - verify pick saves and displays
6. Go to Matches tab - verify pencil icons appear on unscored picks
7. Go to Chaos tab - verify pencil icons appear in YES/NO cells
8. Resize to desktop - verify 2-column grid layout returns
9. Score some results via "Score Results" modal
10. Return to dashboard - verify pencil icons disappear on scored items

