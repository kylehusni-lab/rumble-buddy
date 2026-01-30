

## Update Chaos Props Bets

This plan updates all Chaos Props to match the new 7-bet configuration across the entire application, with improved UI to ensure titles and explanations are always visible.

---

### New Chaos Props Configuration

| # | Title | Question |
|---|-------|----------|
| 1 | The Floor is Lava | A wrestler uses a stunt (chair, handstand, etc.) to keep their feet from touching |
| 2 | The Revolving Door | A wrestler is thrown out in under 10 seconds of entering |
| 3 | Betrayal! | Tag team partners or allies eliminate each other |
| 4 | Over/Under: Surprises | Will there be more than 2.5 unannounced/legend entrants? |
| 5 | The Giant Slayer | It takes 3 or more wrestlers working together to eliminate one person |
| 6 | Brought a Toy | A chair, kendo stick, or other weapon is brought into the ring |
| 7 | Left on Read | Music hits but no one appears, or the wrestler is attacked before reaching the ring |

---

### Files to Update

#### 1. Constants Definition
**File:** `src/lib/constants.ts`

- Replace `CHAOS_PROPS` array with new 7 props
- Update `MATCH_IDS` to include `MENS_PROP_7` and `WOMENS_PROP_7`
- Add `shortName` field (same as title for mobile-friendly display)

#### 2. Pick Card Display
**File:** `src/components/picks/cards/ChaosPropsCard.tsx`

- Ensure title and question are both visible even on small screens
- Reduce spacing between props to fit more content
- Use slightly smaller text for the question while keeping title bold

#### 3. Dashboard Chaos Tab
**File:** `src/components/dashboard/UnifiedChaosTab.tsx`

- Uses `shortName` from constants (already working, just data change)

#### 4. TV Display
**File:** `src/components/tv/ChaosPropsDisplay.tsx`

- Uses `shortName` and `question` from constants (already working)

#### 5. Host Control Scoring
**File:** `src/pages/HostControl.tsx`

- Uses CHAOS_PROPS dynamically (no code changes needed, just data)

#### 6. Bulk Props Modal
**File:** `src/components/host/BulkPropsModal.tsx`

- Uses CHAOS_PROPS dynamically (no code changes needed)

#### 7. Solo Scoring Modal
**File:** `src/components/solo/SoloScoringModal.tsx`

- Uses CHAOS_PROPS dynamically (no code changes needed)

#### 8. Pick Validation
**File:** `src/lib/pick-validation.ts`

- Uses `CHAOS_PROPS.length` dynamically (no code changes needed)

---

### Database Consideration

Existing pick data in the database for the old props will become orphaned but won't cause errors. The new props will use the same match_id pattern (`mens_chaos_prop_1`, `womens_chaos_prop_1`, etc.) so the structure remains compatible. Users will need to re-submit their Chaos Props picks if they had already made them.

---

### Technical Details

```typescript
// New CHAOS_PROPS in constants.ts
export const CHAOS_PROPS = [
  { id: 'prop_1', title: 'The Floor is Lava', question: 'A wrestler uses a stunt (chair, handstand, etc.) to keep their feet from touching.', shortName: 'Floor is Lava' },
  { id: 'prop_2', title: 'The Revolving Door', question: 'A wrestler is thrown out in under 10 seconds of entering.', shortName: 'Revolving Door' },
  { id: 'prop_3', title: 'Betrayal!', question: 'Tag team partners or allies eliminate each other.', shortName: 'Betrayal!' },
  { id: 'prop_4', title: 'Over/Under: Surprises', question: 'Will there be more than 2.5 unannounced/legend entrants?', shortName: 'O/U Surprises' },
  { id: 'prop_5', title: 'The Giant Slayer', question: 'It takes 3+ wrestlers working together to eliminate one person.', shortName: 'Giant Slayer' },
  { id: 'prop_6', title: 'Brought a Toy', question: 'A chair, kendo stick, or other weapon is brought into the ring.', shortName: 'Brought a Toy' },
  { id: 'prop_7', title: 'Left on Read', question: 'Music hits but no one appears, or attacked before reaching the ring.', shortName: 'Left on Read' },
] as const;

// Add to MATCH_IDS
MENS_PROP_7: 'mens_chaos_prop_7',
WOMENS_PROP_7: 'womens_chaos_prop_7',
```

---

### Summary

| Change | Scope |
|--------|-------|
| Update constants | 1 file |
| Improve card readability | 1 file |
| Total files modified | 2 files |
| Database changes | None required |
| Existing picks | Will need to be re-submitted |

