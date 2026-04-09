

## Plan: Create WrestleMania 42 Event Configuration

### Context
The current static config is for WrestleMania **41** (placeholder). The actual event is **WrestleMania 42** (April 18-19, 2026, Allegiant Stadium, Las Vegas). Here is the full card from WWE.com:

### WrestleMania 42 Match Card

**Saturday / Night 1 (7 matches):**

| # | Match | Type | Options |
|---|-------|------|---------|
| 1 | Undisputed WWE Championship | singles | Cody Rhodes (c), Randy Orton |
| 2 | Women's World Championship | singles | Stephanie Vaquer (c), Liv Morgan |
| 3 | Seth Rollins vs. Gunther | singles | Seth Rollins, Gunther |
| 4 | Women's Intercontinental Championship | singles | AJ Lee (c), Becky Lynch |
| 5 | WWE Women's Tag Team Championship | fatal_four | Nia Jax & Lash Legend (c), Charlotte Flair & Alexa Bliss, Bayley & Lyra Valkyria, The Bella Twins |
| 6 | Unsanctioned Match | singles | Jacob Fatu, Drew McIntyre |
| 7 | Six-Man Tag Team Match | tag | Logan Paul, Austin Theory & IShowSpeed; The Usos & LA Knight |

**Sunday / Night 2 (6 matches):**

| # | Match | Type | Options |
|---|-------|------|---------|
| 1 | World Heavyweight Championship | singles | CM Punk (c), Roman Reigns |
| 2 | WWE Women's Championship | singles | Jade Cargill (c), Rhea Ripley |
| 3 | Finn Balor vs. Dominik Mysterio | singles | Finn Balor, Dominik Mysterio |
| 4 | United States Championship | singles | Sami Zayn (c), Trick Williams |
| 5 | Oba Femi vs. Brock Lesnar | singles | Oba Femi, Brock Lesnar |
| 6 | Intercontinental Championship Ladder Match | ladder | Penta (c), Je'Von Evans, Dragon Lee, JD McDonagh, Rusev, Rey Mysterio |

### Implementation

**1. Create new file: `src/lib/events/mania-42.ts`**
- Full config for WrestleMania 42 with all 13 matches across 2 nights
- 8 props (same style as current: main event length, title changes, surprise returns, celebrity, total titles)
- Scoring: 25 pts per match, 10 pts per prop
- totalPicks: 13 matches + 8 props = 21

**2. Update `src/lib/events/index.ts`**
- Import `MANIA_42_CONFIG` from `mania-42.ts`
- Add to `EVENT_REGISTRY` as `'mania_42'`
- Change `ACTIVE_EVENT_ID` from `'mania_41'` to `'mania_42'`

**3. Update `src/pages/DemoMode.tsx`** (no change needed -- already locked to rumble_2026)

**4. Update `parties` table default**
- Database migration to change `event_id` default from `'mania_41'` to `'mania_42'`

**5. Seed database**
- Insert `mania_42` record into `events` table (status: active, is_active: true)
- Insert all 13 matches into `event_matches`
- Insert 8 props into `event_props`

**6. Keep `mania-41.ts`** as-is for backward compatibility with any existing data

