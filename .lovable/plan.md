
# Simplified Pick Editing + Mobile UI Consistency

## Overview

This plan streamlines the Solo Dashboard by:
1. **Removing the "Edit Picks" button** - users tap directly on pick tiles to edit
2. **Adding a mini pick progress indicator** on the dashboard (borrowed from the picks flow)
3. **Applying the same mobile list layout** to Group Mode's `RumblePropsSection`

---

## Current State Analysis

| Component | Solo Dashboard | Player Dashboard (Group) |
|-----------|----------------|--------------------------|
| Edit mechanism | Pencil icons + "Edit Picks" button | Pencil icons only |
| Rumble Props layout | Mobile list (56px avatars) | Text-only list rows |
| Progress indicator | Tab completion badges | Tab completion badges |
| Bottom actions | "Edit Picks" + "Score Results" | None (just view) |

**Screenshots show**: The Solo Dashboard has both inline pencil icons AND a redundant "Edit Picks" button at the bottom. The user wants to simplify by making the tiles themselves tappable.

---

## Solution

### Part 1: Remove "Edit Picks" Button + Make Tiles Fully Tappable

**File: `src/pages/SoloDashboard.tsx`**

**Step 1: Remove the "Edit Picks" button from the bottom actions**

The bottom action bar will only contain "Score Results":

```typescript
// Before: Two buttons
<div className="flex gap-3 max-w-md mx-auto">
  <Button onClick={() => navigate("/solo/picks")}>Edit Picks</Button>
  <Button onClick={() => setIsScoringOpen(true)}>Score Results</Button>
</div>

// After: Single centered button
<div className="max-w-md mx-auto">
  <Button onClick={() => setIsScoringOpen(true)} className="w-full">
    <Calculator className="w-4 h-4 mr-2" />
    Score Results
  </Button>
</div>
```

**Step 2: Make entire pick tiles tappable (not just pencil icon)**

Update the `RumbleTab` mobile list layout so the whole row is the edit trigger:

```typescript
// Current: Only triggers on pencil icon
<button
  onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
  disabled={!canEdit || !!result}
  className="w-full min-h-[64px] ..."
>
  {/* ... content ... */}
  {canEdit && !result && <Pencil size={16} />}
</button>
```

This pattern is already implemented! The button already wraps the entire row and the pencil icon is just a visual indicator. The code is correct - the full row IS tappable.

---

### Part 2: Add Pick Progress Indicator to Solo Dashboard

Borrow the compact grouped progress display from `ProgressBar.tsx` and add it to the Solo Dashboard header. This shows at-a-glance completion without needing to go to the picks flow.

**Visual Design:**

```text
+------------------------------------------------+
|  Undercard 2/2    |  Men's 2/3  |  Women's 0/3 |
|    [*] [*]        |   6  7  8   |    6  7  8   |
+------------------------------------------------+
```

Each dot is tappable to directly edit that pick category.

**File: `src/pages/SoloDashboard.tsx`**

Add a compact progress section below the score card:

```typescript
const PickProgressCompact = memo(function PickProgressCompact({
  tabCompletion,
  onTabClick,
}: {
  tabCompletion: Record<string, { complete: number; total: number }>;
  onTabClick: (tab: TabType) => void;
}) {
  const groups = [
    { id: "matches" as const, name: "Undercard", icon: Swords },
    { id: "mens" as const, name: "Men's", icon: Hash },
    { id: "womens" as const, name: "Women's", icon: Hash },
  ];

  return (
    <div className="flex gap-2 mt-3">
      {groups.map((group) => {
        const { complete, total } = tabCompletion[group.id];
        const isComplete = complete === total;
        const Icon = group.icon;

        return (
          <button
            key={group.id}
            onClick={() => onTabClick(group.id)}
            className={cn(
              "flex-1 rounded-lg border p-2 transition-all",
              isComplete 
                ? "border-success/50 bg-success/5" 
                : "border-border bg-muted/30 hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-[10px] font-semibold uppercase",
                isComplete ? "text-success" : "text-muted-foreground"
              )}>
                {group.name}
              </span>
              <span className={cn(
                "text-[10px] font-bold",
                isComplete ? "text-success" : "text-muted-foreground"
              )}>
                {isComplete ? <Check className="w-3 h-3 inline" /> : null}
                {complete}/{total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});
```

---

### Part 3: Apply Mobile List Layout to Group Mode Player Dashboard

**File: `src/components/dashboard/RumblePropsSection.tsx`**

Update the component to use the same mobile list layout as Solo Dashboard's `RumbleTab`:

```typescript
import { useIsMobile } from "@/hooks/use-mobile";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { getEntrantDisplayName } from "@/lib/entrant-utils";
import { Plus } from "lucide-react";

// In the component:
const isMobile = useIsMobile();

// Replace the current text-only PickRow with:
{isMobile ? (
  // Mobile: Single-column list with large avatars (same as Solo)
  <div className="space-y-2 p-3">
    {mainProps.map((prop) => {
      const matchId = `${prefix}_${prop.id}`;
      const pick = picks.find(p => p.match_id === matchId);
      const isCorrect = getPickResult(matchId);
      const isWrong = isCorrect === false;
      const points = getPropScore(prop.id);

      return (
        <button
          key={matchId}
          onClick={() => canEdit && isCorrect === null && onEditPick?.(matchId, pick?.prediction || "")}
          disabled={!canEdit || isCorrect !== null}
          className={cn(
            "w-full min-h-[64px] p-3 rounded-xl border flex items-center gap-4",
            "transition-all active:scale-[0.98]",
            isCorrect === true ? "bg-success/10 border-success" :
            isWrong ? "bg-destructive/10 border-destructive" :
            "bg-card border-border hover:border-primary/50"
          )}
        >
          {/* Large avatar on left */}
          <div className="relative flex-shrink-0">
            {pick?.prediction ? (
              <img
                src={getWrestlerImageUrl(getEntrantDisplayName(pick.prediction))}
                alt={pick.prediction}
                className={cn(
                  "w-14 h-14 rounded-full object-cover border-2",
                  isCorrect === true ? "border-success" :
                  isWrong ? "border-destructive" : 
                  "border-primary"
                )}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getPlaceholderImageUrl(pick.prediction);
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground/50" />
              </div>
            )}
            {/* Correctness overlay */}
            {isCorrect === true && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
            {isWrong && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                <X className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          
          {/* Title and name stacked on right */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {prop.title}
            </div>
            <div className={cn(
              "font-semibold text-foreground truncate",
              isWrong && "line-through text-destructive/80"
            )}>
              {pick?.prediction ? getEntrantDisplayName(pick.prediction) : `+${points} pts`}
            </div>
          </div>
          
          {/* Edit icon or points badge */}
          <div className="flex-shrink-0">
            {canEdit && isCorrect === null && (
              <Pencil size={16} className="text-muted-foreground" />
            )}
            {isCorrect === true && (
              <span className="point-badge px-2.5 py-1 rounded-full text-white text-sm font-bold">
                +{points}
              </span>
            )}
          </div>
        </button>
      );
    })}
  </div>
) : (
  // Desktop: Keep existing PickRow layout
  <div className="divide-y divide-border/50">
    {mainProps.map((prop) => (
      <PickRow key={...} ... />
    ))}
  </div>
)}
```

Apply the same pattern to the **Final Four section** in `RumblePropsSection`:
- Show 72px circular photos in a centered 4-column grid on mobile
- Make each photo tappable to edit

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Remove "Edit Picks" button, keep only "Score Results"; Add compact `PickProgressCompact` component in header |
| `src/components/dashboard/RumblePropsSection.tsx` | Add `useIsMobile` hook; Add wrestler image imports; Implement mobile list layout with 56px avatars; Update Final Four to use 72px tappable photos |

---

## Visual Comparison

**Before (Solo Dashboard Bottom):**
```text
[ Edit Picks ]  [ Score Results ]
```

**After (Solo Dashboard Bottom):**
```text
       [ Score Results ]
```

**Before (Group Dashboard Rumble Props - Mobile):**
```text
+--------------------------------+
| #1 ENTRANT                     |
| Roman Reigns           [Pencil]|
+--------------------------------+
| IRON MAN                       |
| Cody Rhodes            [Pencil]|
+--------------------------------+
```

**After (Group Dashboard Rumble Props - Mobile):**
```text
+--------------------------------------------------+
| [56px Avatar]  #1 ENTRANT             [Pencil]   |
|                Roman Reigns                       |
+--------------------------------------------------+
| [56px Avatar]  IRON MAN               [Pencil]   |
|                Cody Rhodes                        |
+--------------------------------------------------+
```

---

## Testing Checklist

1. Open Solo Dashboard
2. Verify "Edit Picks" button is removed, only "Score Results" remains
3. Go to Men's tab - tap any prop row - verify WrestlerPickerModal opens
4. Verify the whole row is tappable, not just the pencil icon
5. Verify pick progress shows in header (Undercard/Men's/Women's completion)
6. Open Group Mode Player Dashboard
7. Go to Men's or Women's tab on mobile viewport
8. Verify Rumble Props now display with 56px circular wrestler photos
9. Verify each row is tappable to edit (when in pre_event status)
10. Verify Final Four shows 72px photos in 4-column grid
11. Resize to desktop - verify original text-based layout returns

