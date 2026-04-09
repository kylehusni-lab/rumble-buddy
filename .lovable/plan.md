

## Plan: Remove (c) from Wrestler Names and Add Night Grouping

### Part 1: Remove `(c)` from Wrestler Options

The `(c)` champion designation in options like `"Cody Rhodes (c)"` breaks wrestler image lookups because the lookup functions try to match "Cody Rhodes (c)" against the wrestler database which stores "Cody Rhodes". Instead of stripping `(c)` at display time, we should move the champion indicator to match metadata and keep names clean.

**File: `src/lib/events/mania-42.ts`**
- Remove `(c)` from all option strings across both nights
- Affected matches: Undisputed WWE Championship, Women's World Championship, Women's IC Championship, Women's Tag Team Championship, World Heavyweight Championship, WWE Women's Championship, United States Championship, IC Championship Ladder Match
- Example: `'Cody Rhodes (c)'` becomes `'Cody Rhodes'`

**Database: `event_matches` table**
- Update the `options` JSONB column for all affected matches in the `mania_42` event to remove `(c)` from wrestler names

**File: `src/lib/entrant-utils.ts`**
- Add a safety net: update `getEntrantDisplayName` to also strip ` (c)` suffix, so any legacy data or picks stored with `(c)` still resolve correctly

### Part 2: Group Matches by Night in Dashboard

Currently `UnifiedMatchesTab` renders all matches in a flat list. For 2-night events, matches should be grouped under "Night 1" and "Night 2" headers.

**File: `src/components/dashboard/UnifiedMatchesTab.tsx`**
- Check if the event has multiple nights (cards have `night` property)
- If multi-night: group `matchCards` by `night`, render a section header ("Night 1 - Saturday", "Night 2 - Sunday") before each group
- If single-night: keep current flat rendering
- Use the event config's `nights` array to get display labels

### Summary

| Change | Description |
|--------|-------------|
| Static config | Remove `(c)` from all wrestler option strings in `mania-42.ts` |
| Database | Update `event_matches` options to remove `(c)` |
| Entrant utils | Add `(c)` stripping as safety fallback |
| Dashboard | Group matches by night with section headers |

