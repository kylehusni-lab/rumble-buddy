

# Add Elimination Counts + Final Four Prop Scoring

## Overview

Two enhancements to the Host Control panel:
1. Show elimination count badges on each active wrestler card
2. Add Final Four prop scoring with auto-detection (4 separate props per rumble)

---

## Change 1: Elimination Count Indicators on Active Wrestler Cards

### Current State
The `ActiveWrestlerCard` shows:
- `#number` + wrestler name
- Owner name + duration timer
- Eliminate button

### New State
Add an elimination count badge showing how many wrestlers this person has eliminated.

### File: `src/components/host/ActiveWrestlerCard.tsx`

**Add new prop:**
```typescript
interface ActiveWrestlerCardProps {
  number: number;
  wrestlerName: string;
  ownerName: string | null;
  duration: number;
  eliminationCount: number;  // NEW
  onEliminate: () => void;
  disabled?: boolean;
}
```

**Add badge to UI:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-bold text-primary text-lg">#{number}</span>
  <span className="font-semibold truncate">{wrestlerName}</span>
  {eliminationCount > 0 && (
    <Badge variant="secondary" className="ml-1 bg-destructive/20 text-destructive">
      {eliminationCount} KO{eliminationCount > 1 ? 's' : ''}
    </Badge>
  )}
</div>
```

### File: `src/pages/HostControl.tsx`

**Add elimination count calculator:**
```typescript
const getEliminationCount = useCallback((number: number, type: "mens" | "womens") => {
  const numbers = type === "mens" ? mensNumbers : womensNumbers;
  return numbers.filter(n => n.eliminated_by_number === number).length;
}, [mensNumbers, womensNumbers]);
```

**Update ActiveWrestlerCard usage (Men's):**
```tsx
<ActiveWrestlerCard
  key={wrestler.id}
  number={wrestler.number}
  wrestlerName={wrestler.wrestler_name || "Unknown"}
  ownerName={getPlayerName(wrestler.assigned_to_player_id)}
  duration={getDuration(wrestler.entry_timestamp)}
  eliminationCount={getEliminationCount(wrestler.number, "mens")}
  onEliminate={() => {...}}
/>
```

**Update ActiveWrestlerCard usage (Women's):**
```tsx
<ActiveWrestlerCard
  key={wrestler.id}
  number={wrestler.number}
  wrestlerName={wrestler.wrestler_name || "Unknown"}
  ownerName={getPlayerName(wrestler.assigned_to_player_id)}
  duration={getDuration(wrestler.entry_timestamp)}
  eliminationCount={getEliminationCount(wrestler.number, "womens")}
  onEliminate={() => {...}}
/>
```

---

## Change 2: Final Four Prop Scoring

### Current State
The Props tab includes Rumble Props but is missing the Final Four predictions (4 individual wrestler picks per player).

### New State
Add 4 Final Four prop scoring cards that:
- Auto-detect when exactly 4 wrestlers remain active
- Allow host to Accept or Override
- Score each pick individually (+10 points per correct wrestler)

### File: `src/pages/HostControl.tsx`

**Update `getDerivedPropValues` to return array for Final Four:**
```typescript
const getDerivedPropValues = (numbers: RumbleNumber[], type: "mens" | "womens") => {
  // ... existing props ...
  
  // Final Four - array of 4 wrestler names when exactly 4 remain
  const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
  const finalFourArray = active.length === 4 
    ? active.map(n => n.wrestler_name).filter(Boolean) as string[]
    : [];
  
  return {
    // ... existing props ...
    [`${type}_final_four_1`]: finalFourArray[0] || null,
    [`${type}_final_four_2`]: finalFourArray[1] || null,
    [`${type}_final_four_3`]: finalFourArray[2] || null,
    [`${type}_final_four_4`]: finalFourArray[3] || null,
  };
};
```

**Add Final Four section to Men's Rumble Props:**
```tsx
{/* Final Four - 4 individual picks */}
<div className="border-t border-border pt-4 mt-4">
  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Final Four Predictions</h4>
  {[1, 2, 3, 4].map((slot) => (
    <RumblePropScoringCard
      key={`mens_final_four_${slot}`}
      propId={`mens_final_four_${slot}`}
      title={`Final Four Pick #${slot}`}
      question={`Player's ${slot === 1 ? '1st' : slot === 2 ? '2nd' : slot === 3 ? '3rd' : '4th'} Final Four pick`}
      scoredResult={getMatchResult(`mens_final_four_${slot}`)}
      derivedValue={mensDerivedProps[`mens_final_four_${slot}`]}
      onScore={handleScoreRumbleProp}
      onReset={handleResetRumbleProp}
    />
  ))}
</div>
```

**Add Final Four section to Women's Rumble Props (same pattern):**
```tsx
<div className="border-t border-border pt-4 mt-4">
  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Final Four Predictions</h4>
  {[1, 2, 3, 4].map((slot) => (
    <RumblePropScoringCard
      key={`womens_final_four_${slot}`}
      propId={`womens_final_four_${slot}`}
      title={`Final Four Pick #${slot}`}
      question={`Player's ${slot === 1 ? '1st' : slot === 2 ? '2nd' : slot === 3 ? '3rd' : '4th'} Final Four pick`}
      scoredResult={getMatchResult(`womens_final_four_${slot}`)}
      derivedValue={womensDerivedProps[`womens_final_four_${slot}`]}
      onScore={handleScoreRumbleProp}
      onReset={handleResetRumbleProp}
    />
  ))}
</div>
```

---

## Visual Summary

### Active Wrestler Card (Before → After)

```text
Before:
┌─────────────────────────────────────────┐
│ #5 John Cena                [Eliminate] │
│ Player1 • 4:32                          │
└─────────────────────────────────────────┘

After:
┌─────────────────────────────────────────┐
│ #5 John Cena  [3 KOs]       [Eliminate] │
│ Player1 • 4:32                          │
└─────────────────────────────────────────┘
```

### Final Four Prop Cards

```text
┌─────────────────────────────────────────┐
│ Final Four Pick #1                      │
│ Player's 1st Final Four pick            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Auto-detected: Randy Orton          │ │
│ │          [Accept]  [Override]       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/host/ActiveWrestlerCard.tsx` | Add `eliminationCount` prop + badge UI |
| `src/pages/HostControl.tsx` | Add `getEliminationCount`, update derived props, add Final Four scoring cards |

---

## Auto-Detection Logic

**Final Four triggers when:**
- Exactly 4 wrestlers have `entry_timestamp` set
- Those 4 have NO `elimination_timestamp`

At this point, the system shows the 4 remaining wrestlers as "Auto-detected" values for Final Four props. Host can accept or override each one.

**Scoring:** Each correct Final Four pick awards +10 points (uses existing `SCORING.FINAL_FOUR_PICK`).

