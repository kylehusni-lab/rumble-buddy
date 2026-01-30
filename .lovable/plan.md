

# Combined Plan: Demo Mode Fixes + Solo Mode Rumble Engine

## Overview

This plan combines two sets of changes:
1. **Demo Mode Fixes**: Winner state UI, No-Show prop relocation, Final Four scoring race condition
2. **Solo Mode Enhancement**: Add full rumble tracking engine to Solo scoring (same as Party mode)

---

## Part 1: Winner State UI

### Problem
When the last wrestler remains, the timer continues running and the "Eliminate" button is still visible.

### Solution

**File: `src/components/host/ActiveWrestlerCard.tsx`**

Add `isWinner?: boolean` prop:
- When true, freeze timer display at final duration
- Replace "Eliminate" button with trophy icon and "WINNER" label
- Add golden styling/glow effect

```typescript
interface ActiveWrestlerCardProps {
  // ... existing props
  isWinner?: boolean;
}

// In render:
{isWinner ? (
  <div className="flex items-center gap-2 text-primary">
    <Trophy size={16} />
    <span className="font-bold">WINNER</span>
  </div>
) : (
  <Button variant="destructive" onClick={onEliminate} ... />
)}
```

**File: `src/pages/HostControl.tsx`**

Pass winner status to ActiveWrestlerCard:
```typescript
const mensWinner = getMatchResult("mens_rumble_winner");
const womensWinner = getMatchResult("womens_rumble_winner");

// In active wrestler rendering:
<ActiveWrestlerCard
  isWinner={mensWinner === wrestler.wrestler_name}
  ...
/>
```

**File: `src/components/tv/TvNumberCell.tsx`**

Add winner flair to grid cell:
- Add `isWinner?: boolean` prop
- Show crown icon overlay when true
- Add golden glow animation

---

## Part 2: Move No-Show to Chaos Props

### Problem
"No-Show" is currently in Rumble Props but it's a YES/NO question like other Chaos Props.

### Solution

**File: `src/lib/constants.ts`**

Add No-Show as prop_7 in CHAOS_PROPS:
```typescript
export const CHAOS_PROPS = [
  { id: 'prop_1', title: 'Kofi/Logan Save', ... },
  { id: 'prop_2', title: 'Bushwhacker Exit', ... },
  { id: 'prop_3', title: 'Friendly Fire', ... },
  { id: 'prop_4', title: 'First Blood', ... },
  { id: 'prop_5', title: 'Mystery Entrant', ... },
  { id: 'prop_6', title: 'The Weapon', ... },
  { id: 'prop_7', title: 'No-Show', question: 'Will anyone not make it to the ring?', shortName: 'No-Show' },
] as const;
```

Remove `no_show` from RUMBLE_PROPS (if present) and remove MENS_NO_SHOW/WOMENS_NO_SHOW from MATCH_IDS.

**File: `src/pages/HostControl.tsx`**

Remove No-Show RumblePropScoringCard from Rumble Props sections. The Chaos Props section already uses `CHAOS_PROPS.map()` so it will automatically include the new prop.

---

## Part 3: Fix Final Four Scoring Race Condition

### Problem
Final Four scoring shows checkmarks and "+40 pts" but leaderboard stays at 0 points.

### Root Cause
`handleConfirmFinalFourScoring()` uses cached player points from local state. When multiple players have correct picks, each update overwrites the previous one instead of accumulating.

### Solution

**File: `src/pages/HostControl.tsx`**

In `handleConfirmFinalFourScoring()`, fetch fresh player data for each update:

```typescript
// Before (buggy - uses cached points):
const player = getPlayer(playerId);
await supabase.from("players").update({ points: player.points + bonus });

// After (correct - fetches fresh data):
const { data: freshPlayer } = await supabase
  .from("players")
  .select("points")
  .eq("id", playerId)
  .single();

if (freshPlayer) {
  await supabase.from("players").update({ 
    points: freshPlayer.points + bonus 
  }).eq("id", playerId);
}
```

This pattern already exists in `handleConfirmWinner()` and should be applied consistently.

---

## Part 4: Unified Solo/Party Rumble Engine

### Problem
Solo Mode uses simple dropdowns for scoring. User wants the full rumble tracking experience (entry search, active cards, timers, eliminations) like Party mode.

### Solution

Add conditional props to existing components to hide player/owner references when in Solo mode:

**File: `src/components/host/RumbleEntryControl.tsx`**

Add `showOwner?: boolean` prop (default: true):
```typescript
interface RumbleEntryControlProps {
  // ... existing props
  showOwner?: boolean;
}

// In render, conditionally show owner:
{showOwner !== false && (
  <div className="text-sm">
    Owner: <span className="font-semibold">{ownerName || "Vacant"}</span>
  </div>
)}
```

**File: `src/components/host/ActiveWrestlerCard.tsx`**

Add `showOwner?: boolean` prop (default: true):
```typescript
interface ActiveWrestlerCardProps {
  // ... existing props
  showOwner?: boolean;
}

// In render, conditionally show owner:
<div className="text-sm text-muted-foreground">
  {showOwner !== false && <>{ownerName || "Vacant"} - </>}
  {formatDuration(duration)}
</div>
```

**File: `src/components/solo/SoloScoringModal.tsx`**

Replace simple dropdown selects with full rumble tracking:

1. Add local state for rumble numbers:
```typescript
const [mensNumbers, setMensNumbers] = useState<SoloRumbleNumber[]>([]);
const [womensNumbers, setWomensNumbers] = useState<SoloRumbleNumber[]>([]);
```

2. Integrate existing components with `showOwner={false}`:
```typescript
<RumbleEntryControl
  showOwner={false}
  nextNumber={nextEntrantNumber}
  ownerName={null}
  entrants={availableEntrants}
  onConfirmEntry={handleSoloEntry}
  ...
/>

<ActiveWrestlerCard
  showOwner={false}
  number={wrestler.number}
  wrestlerName={wrestler.wrestler_name}
  ownerName={null}
  duration={calculateDuration(wrestler)}
  onEliminate={() => handleSoloEliminate(wrestler)}
  ...
/>
```

3. Auto-derive props when rumble completes (no point awards, just save results):
- First Elimination, Most Eliminations, Iron Man
- Final Four wrestlers
- Winner

**File: `src/lib/solo-storage.ts`**

Add rumble number storage functions:
```typescript
const SOLO_MENS_NUMBERS_KEY = 'rumble_solo_mens_numbers';
const SOLO_WOMENS_NUMBERS_KEY = 'rumble_solo_womens_numbers';

export interface SoloRumbleNumber {
  number: number;
  wrestler_name: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
  eliminated_by_number: number | null;
}

export function saveSoloRumbleNumbers(gender: 'mens' | 'womens', numbers: SoloRumbleNumber[]): void;
export function getSoloRumbleNumbers(gender: 'mens' | 'womens'): SoloRumbleNumber[];
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/lib/constants.ts` | Add No-Show as prop_7 to CHAOS_PROPS |
| `src/pages/HostControl.tsx` | Fix Final Four scoring race condition; Pass winner state to components; Remove No-Show from Rumble Props |
| `src/components/host/ActiveWrestlerCard.tsx` | Add `isWinner` and `showOwner` props |
| `src/components/host/RumbleEntryControl.tsx` | Add `showOwner` prop |
| `src/components/tv/TvNumberCell.tsx` | Add `isWinner` prop with crown/glow styling |
| `src/components/solo/SoloScoringModal.tsx` | Integrate full rumble tracking engine |
| `src/lib/solo-storage.ts` | Add rumble numbers storage functions |

---

## Testing Checklist

### Demo Mode Fixes
1. Create demo party, simulate rumble to Final Four
2. Verify No-Show appears in Chaos Props (not Rumble Props)
3. Score Final Four - verify ALL correct picks get points (check leaderboard updates)
4. Eliminate to winner - verify timer stops and Eliminate button becomes trophy
5. Verify winner grid cell shows crown/flair (no large banner)

### Solo Mode Engine
1. Open Solo scoring modal, go to Men's tab
2. Verify "Owner" is NOT shown on entry control or active cards
3. Enter wrestlers using search, verify timer starts
4. Eliminate wrestlers, select eliminators
5. Complete to Final Four - verify auto-saved
6. Declare winner - verify all derived props auto-populate
7. Save and verify score calculates correctly

