
# Update Demo Mode Seeder for Complete Coverage

## Problem

The demo seeder currently generates picks for:
- 3 Undercard matches
- 2 Rumble winners (Men's + Women's)
- 12 Chaos Props (6 per Rumble)

**Missing:** The new Rumble Props added recently:
- First Elimination
- Most Eliminations  
- Longest Time (Iron Man/Woman)
- #1 Entrant
- #30 Entrant
- Final Four (4 picks)
- No-Show (YES/NO)

= **10 new predictions per Rumble × 2 Rumbles = 20 missing picks per player**

---

## Solution

Update `generateDemoPicksForPlayers` to include all Rumble Props.

### File: `src/lib/demo-seeder.ts`

**Changes:**

1. Import `RUMBLE_PROPS` and `FINAL_FOUR_SLOTS` from constants
2. Add helper function to pick random unique wrestlers (for Final Four)
3. Generate picks for each new prop type for both Men's and Women's Rumbles

### New Pick Generation Logic

```typescript
// Helper to get N unique random wrestlers
function getRandomUniqueWrestlers(entrants: string[], count: number): string[] {
  const shuffled = [...entrants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// For each player, add:

// Men's Rumble Props (wrestler picks)
['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'].forEach(propId => {
  picks.push({
    player_id: playerId,
    match_id: `mens_${propId}`,
    prediction: mensEntrants[Math.floor(Math.random() * mensEntrants.length)],
  });
});

// Men's Final Four (4 unique wrestlers)
const mensFinalFour = getRandomUniqueWrestlers(mensEntrants, 4);
mensFinalFour.forEach((wrestler, i) => {
  picks.push({
    player_id: playerId,
    match_id: `mens_final_four_${i + 1}`,
    prediction: wrestler,
  });
});

// Men's No-Show (YES/NO)
picks.push({
  player_id: playerId,
  match_id: 'mens_no_show',
  prediction: Math.random() > 0.5 ? 'YES' : 'NO',
});

// Repeat for Women's Rumble...
```

---

## Pick Count Summary (per player)

| Category | Current | After Fix |
|----------|---------|-----------|
| Undercard matches | 3 | 3 |
| Rumble winners | 2 | 2 |
| Rumble Props (wrestler) | 0 | 10 |
| Rumble Props (Final Four) | 0 | 8 |
| Rumble Props (No-Show) | 0 | 2 |
| Chaos Props | 12 | 12 |
| **Total per player** | **17** | **37** |

With 6 players in demo mode: **222 total picks** (was 102)

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/demo-seeder.ts` | Add Rumble Props generation for both genders |

---

## Implementation Details

### Updated `generateDemoPicksForPlayers` function:

```typescript
export async function generateDemoPicksForPlayers(playerIds: string[]) {
  const picks: Array<{
    player_id: string;
    match_id: string;
    prediction: string;
  }> = [];

  const mensEntrants = DEFAULT_MENS_ENTRANTS;
  const womensEntrants = DEFAULT_WOMENS_ENTRANTS;

  // Helper for unique random wrestlers
  const getRandomUniqueWrestlers = (entrants: string[], count: number): string[] => {
    const shuffled = [...entrants].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  for (const playerId of playerIds) {
    // Undercard matches (3 picks)
    UNDERCARD_MATCHES.forEach((match) => {
      picks.push({
        player_id: playerId,
        match_id: match.id,
        prediction: match.options[Math.random() > 0.5 ? 0 : 1],
      });
    });

    // Men's Rumble Winner (1 pick)
    picks.push({
      player_id: playerId,
      match_id: "mens_rumble_winner",
      prediction: mensEntrants[Math.floor(Math.random() * mensEntrants.length)],
    });

    // Women's Rumble Winner (1 pick)
    picks.push({
      player_id: playerId,
      match_id: "womens_rumble_winner",
      prediction: womensEntrants[Math.floor(Math.random() * womensEntrants.length)],
    });

    // Men's Rumble Props - wrestler selections (5 picks)
    const mensWrestlerProps = ['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'];
    mensWrestlerProps.forEach(propId => {
      picks.push({
        player_id: playerId,
        match_id: `mens_${propId}`,
        prediction: mensEntrants[Math.floor(Math.random() * mensEntrants.length)],
      });
    });

    // Men's Final Four (4 unique picks)
    const mensFinalFour = getRandomUniqueWrestlers(mensEntrants, 4);
    mensFinalFour.forEach((wrestler, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_final_four_${i + 1}`,
        prediction: wrestler,
      });
    });

    // Men's No-Show prop (YES/NO)
    picks.push({
      player_id: playerId,
      match_id: "mens_no_show",
      prediction: Math.random() > 0.5 ? "YES" : "NO",
    });

    // Women's Rumble Props - wrestler selections (5 picks)
    const womensWrestlerProps = ['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'];
    womensWrestlerProps.forEach(propId => {
      picks.push({
        player_id: playerId,
        match_id: `womens_${propId}`,
        prediction: womensEntrants[Math.floor(Math.random() * womensEntrants.length)],
      });
    });

    // Women's Final Four (4 unique picks)
    const womensFinalFour = getRandomUniqueWrestlers(womensEntrants, 4);
    womensFinalFour.forEach((wrestler, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_final_four_${i + 1}`,
        prediction: wrestler,
      });
    });

    // Women's No-Show prop (YES/NO)
    picks.push({
      player_id: playerId,
      match_id: "womens_no_show",
      prediction: Math.random() > 0.5 ? "YES" : "NO",
    });

    // Men's Chaos Props (6 picks)
    CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });

    // Women's Chaos Props (6 picks)
    CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });
  }

  const { error } = await supabase.from("picks").insert(picks);
  if (error) throw error;
}
```

---

## Testing

After the update, creating a demo party should:
1. Generate 37 picks per player (6 players = 222 total)
2. TV Display Rumble Props view should show predictions for all props
3. All Final Four sections should have 4 unique wrestlers per player
