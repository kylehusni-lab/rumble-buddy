
# Host Party Participation Feature

## Overview

This plan enables hosts to easily join their own party and make picks by routing them through the same player registration flow after party creation. This keeps the "Create Party" and "Join Party" experiences consistent.

## Current Problem

When a host creates a party:
- They are stored as `host_session_id` in the `parties` table
- Their localStorage session has `isHost: true` but **no `playerId`**
- They are NOT added to the `players` table
- The picks page requires a `playerId` to save picks
- **Result**: Hosts cannot participate in their own party

## Proposed Solution

Route the host through the player registration flow immediately after party creation, then to the Host Setup page.

### User Flow (Updated)

```text
Index Page
    |
    v
"Create Party" clicked
    |
    v
Party created in database
    |
    v
/player/join?code=XXXX&host=true  <-- NEW: Host goes through join flow
    |
    v
Host enters name + email (same as regular players)
    |
    v
Host added to players table with playerId
    |
    v
/host/setup/XXXX  <-- Redirected to host setup (not player picks)
```

### Key Behaviors

| Scenario | Behavior |
|----------|----------|
| Host creates party | Goes to PlayerJoin with `?host=true` flag |
| Host submits join form | Creates player record, then redirects to Host Setup |
| Regular player joins | Same flow as before, redirects to Player Picks |
| Host returns later | Can access both Host Setup/Control AND Player Dashboard |

## File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Change redirect from `/host/setup/{code}` to `/player/join?code={code}&host=true` |
| `src/pages/PlayerJoin.tsx` | Detect `host=true` param and redirect to `/host/setup/{code}` after registration |
| `src/components/host/QuickActionsSheet.tsx` | Add "Make My Picks" action to let host access player picks/dashboard |

### QuickActionsSheet Updates

Add two new actions for host participation:

1. **"Make My Picks"** - Takes host to `/player/picks/{code}` (pre-event) or `/player/dashboard/{code}` (live)
2. **"My Dashboard"** - Takes host to their player dashboard to see their numbers, points, etc.

## Technical Details

### Index.tsx Changes

```typescript
// Before:
navigate(`/host/setup/${partyCode}`);

// After:
navigate(`/player/join?code=${partyCode}&host=true`);
```

### PlayerJoin.tsx Changes

```typescript
const isHostJoining = searchParams.get("host") === "true";

// In handleSubmit, after creating/updating player:
setPlayerSession({
  sessionId,
  playerId,
  partyCode,
  displayName: displayName.trim(),
  email: email.toLowerCase().trim(),
  isHost: isHostJoining, // Set isHost based on URL param
});

// Redirect logic:
if (isHostJoining) {
  // Host goes to setup page after registering
  navigate(`/host/setup/${partyCode}`);
} else if (partyStatus === "live") {
  navigate(`/player/dashboard/${partyCode}`);
} else {
  navigate(`/player/picks/${partyCode}`);
}
```

### QuickActionsSheet.tsx Updates

Add new actions array entries:

```typescript
{
  icon: ClipboardList, // or UserCircle
  title: "Make My Picks",
  subtitle: "Submit your predictions",
  onClick: handleMakeMyPicks,
},
{
  icon: Trophy,
  title: "My Dashboard", 
  subtitle: "View your numbers & points",
  onClick: handleMyDashboard,
},
```

Handler functions:

```typescript
const handleMakeMyPicks = () => {
  // Check if player session exists
  const session = getPlayerSession();
  if (session?.playerId) {
    navigate(`/player/picks/${code}`);
  } else {
    toast.info("Please join the party first");
    navigate(`/player/join?code=${code}&host=true`);
  }
  onOpenChange(false);
};

const handleMyDashboard = () => {
  const session = getPlayerSession();
  if (session?.playerId) {
    navigate(`/player/dashboard/${code}`);
  } else {
    toast.info("Please join the party first");
    navigate(`/player/join?code=${code}&host=true`);
  }
  onOpenChange(false);
};
```

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Host created party before this change | Quick Actions shows "Make My Picks" which routes them to join flow with `host=true` |
| Host tries to re-register | PlayerJoin detects existing email and updates session (existing behavior) |
| Host loses session | Can re-join via Quick Actions or join party modal with same email |
| Party status is "live" | Host can still access dashboard via Quick Actions |

## UI Considerations

- The join form looks identical for hosts and regular players
- Form title could optionally say "Join Your Party" for hosts
- The only difference is the redirect destination after submission
- Quick Actions menu provides easy access to player features from host screens

## Session Data Structure

After implementation, a host's session will contain all fields:

```typescript
{
  sessionId: "uuid",
  playerId: "uuid",      // Now populated for hosts
  partyCode: "1234",
  displayName: "Host Name",
  email: "host@example.com",
  isHost: true
}
```

This allows hosts to use all player features while retaining host privileges.

## Benefits

1. **Consistency** - Same registration flow for everyone
2. **Simplicity** - No separate host registration system
3. **Full participation** - Hosts get numbers, can make picks, see their dashboard
4. **Backward compatible** - Existing hosts can join via Quick Actions
