
# Solo Mode Feature

## Overview
Add a "Solo Mode" option for users who want to make their Royal Rumble predictions and track results by themselves, without creating or joining a party. This provides a streamlined, single-player experience.

---

## User Experience

### Entry Point (Home Screen)
A new "Go Solo" button on the home page, positioned below the existing buttons with a distinct style (perhaps subtle/ghost variant with a User icon).

### Solo Mode Flow
1. **Tap "Go Solo"** - Creates a hidden "solo session" stored locally
2. **Enter Name** (optional) - Quick single-field entry, or skip with default "Me"
3. **Make Picks** - Same swipeable card flow (matches, rumble winners, props)
4. **View Dashboard** - Personal dashboard showing your picks and results
5. **Follow Along** - During the event, manually mark results to see your score update

---

## Key Differences from Party Mode

| Feature | Party Mode | Solo Mode |
|---------|------------|-----------|
| Backend Storage | Supabase database | localStorage only |
| Leaderboard | Multi-player rankings | Just your score |
| Rumble Numbers | Randomly assigned | Not applicable |
| TV Display | Party-wide view | Not available |
| Real-time sync | Yes | No (manual scoring) |
| Host controls | Yes | Self-scoring |

---

## Implementation Steps

### 1. Update Session Management
Add a `isSolo` flag to the `PlayerSession` interface to distinguish solo users:

```typescript
// src/lib/session.ts
export interface PlayerSession {
  sessionId: string;
  playerId?: string;
  partyCode?: string;
  displayName?: string;
  email?: string;
  isHost?: boolean;
  isSolo?: boolean;  // NEW
}
```

### 2. Create Solo Storage Utilities
New file `src/lib/solo-storage.ts` to handle localStorage-based pick and result storage:

- `saveSoloPicks(picks: Record<string, string>)` - Save picks to localStorage
- `getSoloPicks(): Record<string, string>` - Retrieve saved picks
- `saveSoloResults(results: Record<string, string>)` - Save match results
- `getSoloResults(): Record<string, string>` - Retrieve results
- `calculateSoloScore(picks, results): number` - Calculate points

### 3. Add Home Screen Button
Update `src/pages/Index.tsx`:
- Add a "Go Solo" button below "Try Demo Mode"
- Style as a subtle ghost button with User icon
- On click, navigate to `/solo/setup`

### 4. Create Solo Setup Page
New file `src/pages/SoloSetup.tsx`:
- Simple form with just a display name field (optional)
- "Let's Go!" button that creates solo session and navigates to picks
- Skip option that uses "Me" as default name

### 5. Create Solo Picks Page
New file `src/pages/SoloPicks.tsx`:
- Reuses `PickCardStack` component with minor adaptations
- Saves picks to localStorage instead of Supabase
- On submit, navigates to solo dashboard

### 6. Create Solo Dashboard
New file `src/pages/SoloDashboard.tsx`:
- Shows picks organized by category (same as party dashboard)
- Includes a "Score Results" floating button
- Self-scoring interface for marking match outcomes
- Real-time score calculation based on marked results

### 7. Create Solo Scoring Modal
New component `src/components/solo/SoloScoringModal.tsx`:
- Lists all matches/props
- Allows user to select winners/outcomes
- Updates localStorage results and recalculates score

### 8. Update App Routes
Add new routes in `src/App.tsx`:
```typescript
<Route path="/solo/setup" element={<SoloSetup />} />
<Route path="/solo/picks" element={<SoloPicks />} />
<Route path="/solo/dashboard" element={<SoloDashboard />} />
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/solo-storage.ts` | localStorage utilities for solo mode |
| `src/pages/SoloSetup.tsx` | Quick name entry page |
| `src/pages/SoloPicks.tsx` | Picks flow wrapper for solo |
| `src/pages/SoloDashboard.tsx` | Personal dashboard with self-scoring |
| `src/components/solo/SoloScoringModal.tsx` | UI for marking results |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/session.ts` | Add `isSolo` to `PlayerSession` interface |
| `src/pages/Index.tsx` | Add "Go Solo" button |
| `src/App.tsx` | Add solo routes |
| `src/components/picks/PickCardStack.tsx` | Add prop to control save destination (Supabase vs localStorage) |

---

## Visual Design

The solo mode will share the same visual language as the party experience:
- Same gold/purple theme and wrestler cards
- Same swipeable pick interface
- Dashboard layout matches party dashboard (minus leaderboard)
- Scoring modal uses existing card/button styles

### Home Screen Addition
```
[Create Party]  (hero button)
[Join Party]    (purple button)
[Try Demo Mode] (ghost button)
[Go Solo]       (ghost button, subtle) <-- NEW
```

---

## Future Enhancements (Not in Scope)
- Sync solo picks to cloud when user later creates account
- Share solo score card as image
- Compare with friends who also went solo
