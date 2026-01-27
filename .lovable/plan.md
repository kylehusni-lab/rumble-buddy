
# Personal Number Reveal for Player Dashboard

## Problem

When a player views their dashboard after the event goes live, they see **everyone's** numbers in the reveal animation. This is the same experience as TV mode, but for a mobile player on their personal dashboard, it should be **personal** - showing only their own numbers first.

## Current Flow

```
Event Goes Live
     ↓
loadRevealData() fetches ALL players
     ↓
NumberRevealAnimation shows all 6 players' numbers
     ↓
Player sees everyone's numbers before their own
```

## Proposed Flow

```
Event Goes Live
     ↓
loadRevealData() fetches ONLY current player
     ↓
NumberRevealAnimation shows 1 player (skips choice screen)
     ↓
Player sees "YOUR NUMBERS ARE IN!" with just their numbers
```

## Technical Implementation

### File: `src/pages/PlayerDashboard.tsx`

Update the `loadRevealData()` function to only include the current player's data instead of all players:

**Current (lines 194-223):**
```typescript
const loadRevealData = async () => {
  // Fetches ALL players
  const { data: allPlayersData } = await supabase
    .from("players")
    .select("id, display_name")
    .eq("party_code", code)
    .order("joined_at");

  const { data: allNumbersData } = await supabase
    .from("rumble_numbers")
    .select("number, assigned_to_player_id, rumble_type")
    .eq("party_code", code);

  if (allPlayersData && allNumbersData) {
    // Maps ALL players to the reveal
    const playerData = allPlayersData.map(p => ({ ... }));
    setRevealPlayers(playerData);
    setShowNumberReveal(true);
  }
};
```

**Updated:**
```typescript
const loadRevealData = async () => {
  // Only fetch current player's numbers
  const { data: myNumbersData } = await supabase
    .from("rumble_numbers")
    .select("number, rumble_type")
    .eq("party_code", code)
    .eq("assigned_to_player_id", session.playerId);

  if (myNumbersData && myNumbersData.length > 0) {
    const playerData: PlayerWithNumbers[] = [{
      playerName: session.displayName || "You",
      mensNumbers: myNumbersData
        .filter(n => n.rumble_type === "mens")
        .map(n => n.number)
        .sort((a, b) => a - b),
      womensNumbers: myNumbersData
        .filter(n => n.rumble_type === "womens")
        .map(n => n.number)
        .sort((a, b) => a - b),
    }];
    
    setRevealPlayers(playerData);
    setShowNumberReveal(true);
  }
};
```

### How the Animation Handles Single Player

The `NumberRevealAnimation` component already has special handling for single players (line 21):

```typescript
const [phase, setPhase] = useState<Phase>(players.length === 1 ? "instant" : "choice");
```

When there's only 1 player, it skips the "choice" screen and goes directly to "instant" mode, showing the player's numbers immediately without asking about reveal mode.

## User Experience

**Before:** Player sees a choice screen ("Instant vs Dramatic"), then sees everyone's numbers
**After:** Player sees their own numbers revealed immediately with "YOUR NUMBERS ARE IN!"

## Edge Cases

- If player has no numbers assigned (shouldn't happen), the reveal won't show
- TV display is unaffected - it continues to show all players
- Session storage flag still prevents showing reveal more than once

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PlayerDashboard.tsx` | Update `loadRevealData()` to fetch only current player's numbers |
