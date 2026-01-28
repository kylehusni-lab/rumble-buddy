
# Add Status Counts to Collapsible Section Headers

## Overview
Add pick completion/status badges to the **Rumble Props** and **Final Four** collapsible section headers in the `RumblePropsSection` component. Currently, only the **Chaos Props** section shows status counts (e.g., "6 pending"). The user wants the same pattern applied to all collapsible sections.

## Current State
- **Chaos Props**: Already shows "X pending" or checkmark with correct count
- **Rumble Props**: No status badge (screenshot shows no count)
- **Final Four**: No status badge (screenshot shows no count)

## What to Add
Display badges showing the status of picks within each section:
- **If any picks are correct**: Show green badge with checkmark and correct count
- **If no correct but some pending**: Show muted badge with "X pending"
- **If all results in but none correct**: No badge needed (section is complete but unsuccessful)

## Implementation Details

### File: `src/components/dashboard/RumblePropsSection.tsx`

**1. Calculate stats for Rumble Props section (similar to existing chaosStats):**
```typescript
const propsStats = mainProps.reduce(
  (acc, prop) => {
    const matchId = `${prefix}_${prop.id}`;
    const pick = picks.find(p => p.match_id === matchId);
    if (!pick) return acc;
    const result = results.find(r => r.match_id === matchId);
    if (!result) {
      acc.pending++;
    } else if (result.result === pick.prediction) {
      acc.correct++;
    }
    return acc;
  },
  { correct: 0, pending: 0 }
);
```

**2. Calculate stats for Final Four section:**
```typescript
const finalFourStats = finalFourPicks.reduce(
  (acc, pick, i) => {
    if (!pick) return acc;
    const matchId = `${prefix}_final_four_${i + 1}`;
    const result = results.find(r => r.match_id === matchId);
    if (!result) {
      acc.pending++;
    } else if (result.result === pick.prediction) {
      acc.correct++;
    }
    return acc;
  },
  { correct: 0, pending: 0 }
);
```

**3. Add badge to Rumble Props header (line ~171-174):**
After `{title} Rumble Props`:
```tsx
{propsStats.correct > 0 && (
  <span className="flex items-center gap-0.5 text-[10px] font-bold text-white point-badge px-1.5 py-0.5 rounded-full">
    <Check size={10} />
    {propsStats.correct}
  </span>
)}
{propsStats.correct === 0 && propsStats.pending > 0 && (
  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
    {propsStats.pending} pending
  </span>
)}
```

**4. Add badge to Final Four header (line ~209-212):**
After `{title} Final Four`:
```tsx
{finalFourStats.correct > 0 && (
  <span className="flex items-center gap-0.5 text-[10px] font-bold text-white point-badge px-1.5 py-0.5 rounded-full">
    <Check size={10} />
    {finalFourStats.correct}
  </span>
)}
{finalFourStats.correct === 0 && finalFourStats.pending > 0 && (
  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
    {finalFourStats.pending} pending
  </span>
)}
```

## Visual Result
After implementation, all three collapsible sections will display consistent status badges:
- **Men's Rumble Props** `5 pending` (or `✓ 2` if 2 correct)
- **Men's Final Four** `4 pending` (or `✓ 3` if 3 correct)  
- **Men's Chaos Props** `6 pending` (already implemented)

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/dashboard/RumblePropsSection.tsx` | Add `propsStats` and `finalFourStats` calculations, add badge JSX to headers |

## Summary
This is a straightforward enhancement that reuses the existing badge pattern from Chaos Props and applies it consistently to the Rumble Props and Final Four sections.
