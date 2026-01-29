
# Seed Wrestlers Table & Update All Data References

## ✅ COMPLETED

All phases have been implemented:

### Phase 1: Seed the Wrestlers Table ✅
- Added unique constraint on wrestler name
- Seeded 33 men's wrestlers (18 confirmed, 15 unconfirmed)  
- Seeded 28 women's wrestlers (15 confirmed, 13 unconfirmed)
- All parsed from `platform_config` and marked as `is_rumble_participant = true`

### Phase 2: Update Demo Seeder ✅
- Updated `generateDemoPicksForPlayers()` to accept entrants as parameters
- Updated `seedDemoParty()` to fetch entrants from database before generating picks

### Phase 3: Update SoloScoringModal ✅
- Added `mensEntrants` and `womensEntrants` props
- Removed hardcoded `DEFAULT_MENS_ENTRANTS`/`DEFAULT_WOMENS_ENTRANTS` imports
- Updated `RumbleScoring` component to receive entrants as prop

### Phase 4: SoloDashboard Integration ✅
- Added `usePlatformConfig` hook to fetch database entrants
- Passes entrants to `SoloScoringModal` component

## Data Flow (Current)

```text
wrestlers table (single source of truth)
        ↓
usePlatformConfig hook (fetches is_rumble_participant = true)
        ↓
    ┌───┴───┬────────────┬────────────┐
    ↓       ↓            ↓            ↓
PlayerPicks  SoloPicks  HostControl  SoloDashboard
    ↓           ↓          ↓            ↓
RumbleCards  RumbleCards  EntryControl  ScoringModal
```

## Files Modified

- `src/lib/demo-seeder.ts` - Fetches from database, accepts entrant params
- `src/components/solo/SoloScoringModal.tsx` - Uses entrant props
- `src/pages/SoloDashboard.tsx` - Uses usePlatformConfig, passes to modal
- `src/hooks/usePlatformConfig.ts` - Already fetches from wrestlers table
