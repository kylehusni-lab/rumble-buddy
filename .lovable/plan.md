

# Demo Mode Feature

## Overview

Add a "Demo Mode" button to the Index page that creates a pre-configured party with 6 guests, complete with picks and ready for testing TV mode and other features.

## What Gets Seeded

| Data Type | Count | Details |
|-----------|-------|---------|
| Party | 1 | Demo party with code like "DEMO" or random 4-digit |
| Players | 6 | Demo Host + 5 guests with fun wrestling-themed names |
| Picks | 7 per player (42 total) | Random picks for all 7 pick cards |

## Demo Guest Names

Using fun wrestling-themed names:
1. Demo Host (you)
2. Randy Savage
3. Macho Man
4. Hulk Hogan
5. Stone Cold
6. The Rock

## User Flow

```text
Index Page
    |
    v
"Try Demo Mode" button (secondary style, below main buttons)
    |
    v
Creates demo party automatically
Creates demo host as player
Creates 5 additional demo guests with picks
    |
    v
Redirects to /host/setup/{code}
    |
    v
Host can:
- Open TV Display (fully populated leaderboard)
- Start Event (distributes numbers)
- Use Host Control features
```

## File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add "Try Demo Mode" button and seeding logic |
| `src/lib/constants.ts` | Add demo guest names constant (optional) |

## Technical Implementation

### Demo Seeding Logic

```typescript
const handleDemoMode = async () => {
  setIsCreating(true);
  
  try {
    const sessionId = getSessionId();
    const demoCode = await generatePartyCode(); // Use same function
    
    // 1. Create demo party
    await supabase.from("parties").insert({
      code: demoCode,
      host_session_id: sessionId,
      status: "pre_event",
    });
    
    // 2. Create demo host as player first
    const { data: hostPlayer } = await supabase
      .from("players")
      .insert({
        party_code: demoCode,
        email: "demo-host@example.com",
        display_name: "Demo Host",
        session_id: sessionId,
      })
      .select("id")
      .single();
    
    // 3. Create 5 demo guests
    const demoGuests = [
      { name: "Randy Savage", email: "randy@example.com" },
      { name: "Macho Man", email: "macho@example.com" },
      { name: "Hulk Hogan", email: "hulk@example.com" },
      { name: "Stone Cold", email: "stone@example.com" },
      { name: "The Rock", email: "rock@example.com" },
    ];
    
    const guestInserts = demoGuests.map(g => ({
      party_code: demoCode,
      email: g.email,
      display_name: g.name,
      session_id: crypto.randomUUID(), // Random session for each
    }));
    
    const { data: guests } = await supabase
      .from("players")
      .insert(guestInserts)
      .select("id");
    
    // 4. Generate random picks for all players
    const allPlayerIds = [hostPlayer.id, ...guests.map(g => g.id)];
    await generateDemoPicksForPlayers(allPlayerIds, demoCode);
    
    // 5. Set session and redirect
    setPlayerSession({
      sessionId,
      playerId: hostPlayer.id,
      partyCode: demoCode,
      displayName: "Demo Host",
      email: "demo-host@example.com",
      isHost: true,
    });
    
    // Skip PIN for demo - auto-store a PIN
    localStorage.setItem(`party_${demoCode}_pin`, "0000");
    
    toast.success("Demo party created!");
    navigate(`/host/setup/${demoCode}`);
    
  } catch (err) {
    console.error("Error creating demo:", err);
    toast.error("Failed to create demo party");
  } finally {
    setIsCreating(false);
  }
};
```

### Pick Generation Logic

Each player needs 7 picks covering all card types:

```typescript
const generateDemoPicksForPlayers = async (playerIds: string[], partyCode: string) => {
  const picks = [];
  
  // Get platform entrants for rumble winner picks
  const mensEntrants = DEFAULT_MENS_ENTRANTS; // or fetch from platform_config
  const womensEntrants = DEFAULT_WOMENS_ENTRANTS;
  
  for (const playerId of playerIds) {
    // Undercard matches (3 picks)
    UNDERCARD_MATCHES.forEach(match => {
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
    
    // Men's Chaos Props (6 picks bundled as 1 card type)
    CHAOS_PROPS.forEach((prop, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "yes" : "no",
      });
    });
    
    // Women's Chaos Props (6 picks bundled as 1 card type)
    CHAOS_PROPS.forEach((prop, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "yes" : "no",
      });
    });
  }
  
  await supabase.from("picks").insert(picks);
};
```

## UI Design

### Demo Button Placement

```text
+---------------------------+
|      ROYAL RUMBLE         |
|       2026 LOGO           |
+---------------------------+
|      [Countdown Timer]    |
+---------------------------+
|  [ 👑 Create Party ]      |  <-- Primary gold button
+---------------------------+
|  [ 👥 Join Party ]        |  <-- Secondary purple button
+---------------------------+
|                           |
|   [ 🧪 Try Demo Mode ]    |  <-- Tertiary ghost/outline button
|                           |
|   No signup required      |
+---------------------------+
```

### Button Styling

The demo button should be styled as a less prominent option:
- Use `variant="ghost"` or `variant="outline"`
- Smaller size (`size="default"` vs `size="xl"`)
- Subtle icon like `Beaker` or `TestTube2` from Lucide

## What Demo Mode Enables

Once created, the demo party allows testing:

1. **TV Display** - Shows 6 players on leaderboard, ready for number reveal
2. **Host Setup** - All 6 guests appear with complete picks
3. **Start Event** - Distributes numbers to all demo guests
4. **Host Control** - Full scoring, eliminations, and celebrations
5. **Player Dashboard** - Switch to player view via Quick Actions

## PIN Handling

For demo mode simplicity:
- Auto-set host PIN to "0000" 
- Store it in localStorage so host can access immediately
- No need for PIN verification modal in demo flow

## Implementation Steps

1. Add demo guest names constant
2. Create `generateDemoPicksForPlayers` utility function
3. Add `handleDemoMode` handler in Index.tsx
4. Add demo mode button to Index.tsx UI
5. Auto-store demo PIN for instant host access

