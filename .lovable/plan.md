# Plan: Event-Based Pick History - COMPLETED

## Summary
Added `event_id` column to `parties`, `picks`, and `solo_picks` tables to enable historical pick tracking per event.

## Completed Changes

### Database (Migration)
- Added `event_id TEXT NOT NULL DEFAULT 'mania_41'` to `parties` table
- Added `event_id TEXT NOT NULL DEFAULT 'mania_41'` to `picks` table
- Added `event_id TEXT NOT NULL DEFAULT 'mania_41'` to `solo_picks` table
- Updated unique constraint on `picks` to `(player_id, match_id, event_id)`
- Updated unique constraint on `solo_picks` to `(solo_player_id, match_id, event_id)`
- Updated `save_solo_pick` RPC to accept `p_event_id` parameter

### Code Changes
| File | Change |
|------|--------|
| `src/lib/events/index.ts` | Added `getActiveEventId()` function |
| `src/components/picks/PickCardStack.tsx` | Includes `event_id` when saving picks |
| `src/pages/PlayerPicks.tsx` | Filters picks by `event_id` when loading |
| `src/hooks/useSoloCloud.ts` | Syncs/saves picks with `event_id` |

## Technical Notes
- WrestleMania 41 (and other non-Rumble events) already exclude rumble-winner cards via `MANIA_41_CARD_CONFIG`
- All existing picks backfilled with `event_id = 'mania_41'`
- Switching events only requires changing `ACTIVE_EVENT_ID` in `src/lib/events/index.ts`
