
# Seed Wrestlers Table & Update All Data References

## Current State Analysis

The system currently has a disconnection between two data sources:

1. **`platform_config` table** - Contains wrestler names as JSON arrays under keys `mens_rumble_entrants` and `womens_rumble_entrants`:
   - Men's: 36 wrestlers (Roman Reigns, Cody Rhodes, Gunther, etc.)
   - Women's: 28 wrestlers (Liv Morgan, Rhea Ripley, etc.)
   - Uses `*` prefix to mark unconfirmed entrants

2. **`wrestlers` table** - Currently **empty**, but has the proper schema with:
   - `is_rumble_participant` (boolean)
   - `is_confirmed` (boolean)
   - `division` (mens/womens)
   - `image_url` (for uploaded images)

3. **`usePlatformConfig` hook** - Already updated to fetch from `wrestlers` table, but returns empty lists because the table is empty

4. **Fallback behavior** - Several components fall back to `DEFAULT_MENS_ENTRANTS`/`DEFAULT_WOMENS_ENTRANTS` from constants when no data is available

## Implementation Plan

### Phase 1: Seed the Wrestlers Table

Create a one-time migration to populate the `wrestlers` table from the current `platform_config` data:

- Parse all wrestler names from `mens_rumble_entrants` and `womens_rumble_entrants`
- Strip `*` prefix and set `is_confirmed = false` for those wrestlers
- Set `is_rumble_participant = true` for all seeded wrestlers
- Assign correct `division` based on source list
- Skip "Surprise/Other Entrant" (this is handled in code)

### Phase 2: Update Demo Seeder

The `demo-seeder.ts` currently imports `DEFAULT_MENS_ENTRANTS` and `DEFAULT_WOMENS_ENTRANTS` from constants. Update it to:

- Accept entrant lists as parameters OR
- Fetch from `usePlatformConfig` where it's called

### Phase 3: Update SoloScoringModal

This component directly imports and uses `DEFAULT_MENS_ENTRANTS` and `DEFAULT_WOMENS_ENTRANTS`. Update it to:

- Accept entrants as props from the parent component
- Use `usePlatformConfig` hook at the parent level

### Phase 4: Verify All Components Use Database

Confirm these components properly use `customEntrants` from `usePlatformConfig`:

| Component | Status |
|-----------|--------|
| `RumbleWinnerCard` | Uses `customEntrants` prop with fallback |
| `RumblePropsCard` | Uses `customEntrants` prop with fallback |
| `WrestlerPickerModal` | Receives `wrestlers` as prop |
| `RumbleEntryControl` | Receives `entrants` as prop |
| `PlayerPicks` | Passes entrants from `usePlatformConfig` |
| `SoloPicks` | Passes entrants from `usePlatformConfig` |
| `HostControl` | Uses `usePlatformConfig` |
| `SinglePickEditModal` | Receives entrants as props with fallback |

## Technical Details

### Database Migration SQL

```sql
-- Seed wrestlers from platform_config
INSERT INTO public.wrestlers (name, division, is_rumble_participant, is_confirmed)
SELECT 
  CASE 
    WHEN value::text LIKE '*%' THEN substring(value::text from 2)
    ELSE value::text
  END as name,
  'mens' as division,
  true as is_rumble_participant,
  NOT (value::text LIKE '*%') as is_confirmed
FROM platform_config, jsonb_array_elements_text(value) as value
WHERE key = 'mens_rumble_entrants'
  AND value::text != 'Surprise/Other Entrant'
UNION ALL
SELECT 
  CASE 
    WHEN value::text LIKE '*%' THEN substring(value::text from 2)
    ELSE value::text
  END as name,
  'womens' as division,
  true as is_rumble_participant,
  NOT (value::text LIKE '*%') as is_confirmed
FROM platform_config, jsonb_array_elements_text(value) as value
WHERE key = 'womens_rumble_entrants'
  AND value::text != 'Surprise/Other Entrant'
ON CONFLICT (name) DO UPDATE SET
  is_rumble_participant = true,
  is_confirmed = EXCLUDED.is_confirmed,
  division = EXCLUDED.division;
```

### Files to Modify

1. **`src/lib/demo-seeder.ts`**
   - Add parameter to accept entrants from caller
   - Remove direct import of `DEFAULT_*` constants for entrants
   - Use provided entrants or fetch dynamically

2. **`src/components/solo/SoloScoringModal.tsx`**
   - Add `mensEntrants` and `womensEntrants` props
   - Remove direct import of `DEFAULT_*` constants
   - Use props for wrestler selection dropdowns

3. **`src/pages/SoloDashboard.tsx`**
   - Pass entrants from `usePlatformConfig` to `SoloScoringModal`

### Data Flow After Migration

```text
wrestlers table (single source of truth)
        ↓
usePlatformConfig hook (fetches participants)
        ↓
    ┌───┴───┬────────────┬────────────┐
    ↓       ↓            ↓            ↓
PlayerPicks  SoloPicks  HostControl  SoloDashboard
    ↓           ↓          ↓            ↓
RumbleCards  RumbleCards  EntryControl  ScoringModal
```

## Benefits After Implementation

- **Single source of truth**: All wrestler data lives in the `wrestlers` table
- **No more fallbacks needed**: Database is populated with real data
- **Images work automatically**: `getWrestlerImageUrl` already prioritizes database images
- **Admin consistency**: Platform Admin and Wrestler Admin both manage the same data
- **Real-time updates**: Changes propagate via existing Supabase subscriptions
