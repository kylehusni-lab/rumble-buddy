
# Clear Database & Fix Demo Mode

## Overview
Clear all existing test data from the database and update demo mode to use generic, non-confusing names instead of wrestler names.

## Current Database State
| Table | Records |
|-------|---------|
| parties | 52 |
| players | 189 |
| picks | 5,525 |
| match_results | 21 |
| rumble_numbers | 1,080 |
| solo_players | 1 |
| solo_picks | 37 |

## Part 1: Clear All Data

Will execute SQL commands to truncate all game data tables in the correct order (respecting dependencies):

```sql
-- Clear in dependency order
DELETE FROM picks;
DELETE FROM rumble_numbers;
DELETE FROM match_results;
DELETE FROM players;
DELETE FROM parties;
DELETE FROM solo_picks;
DELETE FROM solo_results;
DELETE FROM solo_players;
```

## Part 2: Update Demo Names

Change the demo guest names from wrestler names to generic friend names:

**Before (confusing):**
- Randy Savage
- Macho Man
- Hulk Hogan
- Stone Cold
- The Rock

**After (clear):**
- Melanie
- Mike
- Jon
- Chris
- Steve
- Kyle (host - already set correctly)

### File: `src/lib/demo-seeder.ts`

Update the `DEMO_GUESTS` array:
```typescript
export const DEMO_GUESTS = [
  { name: "Melanie", email: "melanie@demo.local" },
  { name: "Mike", email: "mike@demo.local" },
  { name: "Jon", email: "jon@demo.local" },
  { name: "Chris", email: "chris@demo.local" },
  { name: "Steve", email: "steve@demo.local" },
] as const;
```

## Files to Modify
| File | Changes |
|------|---------|
| `src/lib/demo-seeder.ts` | Update DEMO_GUESTS array with generic names |

## Database Operations
| Operation | Description |
|-----------|-------------|
| DELETE | Clear all existing records from all game tables |

## Result
- Fresh database with no test data
- Demo mode creates 6 players with clear, distinguishable names:
  - **Kyle** (you/host)
  - **Melanie**, **Mike**, **Jon**, **Chris**, **Steve** (guests)
