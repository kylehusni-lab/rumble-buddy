

# TV Display Picks Sync + Match Card Update + Sami Zayn Image

## Overview

Three changes needed:
1. **Sync Participant Picks with Current View** - The picks panel should show picks for the match currently displayed in the navigator
2. **Update CM Punk Undercard Match** - Remove Logan Paul (now in Rumble) and replace his opponent
3. **Add Sami Zayn Image** - Copy the uploaded image and add to wrestler data

---

## Issue 1: Picks Panel Not Syncing with Current View

### Current Behavior

The `ParticipantPicksView` component independently determines which match to show picks for (lines 33-55 in `ParticipantPicksView.tsx`). It always shows the first incomplete undercard match, regardless of what the TV navigator is displaying.

### Solution

Pass the current view index from `TvViewNavigator` to sync the picks display.

**Option A (Preferred):** Move `ParticipantPicksView` inside `TvViewNavigator` so it has access to `currentViewIndex`

**Changes:**

| File | Change |
|------|--------|
| `TvViewNavigator.tsx` | Add `players` and `picks` props, render `ParticipantPicksView` internally with current match context |
| `TvDisplay.tsx` | Pass `players` and `picks` to `TvViewNavigator`, remove standalone `ParticipantPicksView` |
| `ParticipantPicksView.tsx` | Accept optional `currentMatchId` prop to override auto-detection |

**Implementation:**

```typescript
// TvViewNavigator.tsx - Add props
interface TvViewNavigatorProps {
  matchResults: MatchResult[];
  mensNumbers: RumbleNumber[];
  womensNumbers: RumbleNumber[];
  players: Player[];          // NEW
  picks: Pick[];              // NEW
  getPlayerInitials: (id: string | null) => string;
  getNumberStatus: (num: RumbleNumber) => "pending" | "active" | "eliminated";
}

// Inside component, after the view content:
{currentView.type === "undercard" && (
  <ParticipantPicksView
    players={players}
    picks={picks}
    matchResults={matchResults}
    currentMatchId={currentView.id}  // Force sync to current view
  />
)}
```

```typescript
// ParticipantPicksView.tsx - Add currentMatchId prop
interface ParticipantPicksViewProps {
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
  currentMatchId?: string;  // NEW - optional override
}

// Update displayMatch logic to use override if provided:
const displayMatch = useMemo(() => {
  if (currentMatchId) {
    const match = UNDERCARD_MATCHES.find(m => m.id === currentMatchId);
    if (match) {
      const result = matchResults.find(r => r.match_id === currentMatchId);
      return { 
        match, 
        isComplete: !!result, 
        result: result?.result || null 
      };
    }
  }
  // ... existing auto-detection logic as fallback
}, [currentMatchId, activeMatch, matchResults]);
```

---

## Issue 2: Update CM Punk Match (Logan Paul Now in Rumble)

### Current (Line 12 in constants.ts)

```typescript
{ id: 'undercard_2', title: 'CM Punk vs Logan Paul', options: ['CM Punk', 'Logan Paul'] },
```

### Problem

Logan Paul is now confirmed for the Men's Royal Rumble (added in recent update), so he can't also be in an undercard match.

### Solution

Replace Logan Paul with a different opponent. Common options based on WWE storylines:
- Seth Rollins (classic rivalry)
- The Miz (feud history)
- Drew McIntyre (but he's in undercard_1)

**Recommendation:** Change to **CM Punk vs Seth Rollins** (more likely based on current WWE storylines)

### Changes Required

| File | Location | Change |
|------|----------|--------|
| `src/lib/constants.ts` | Line 12 | Change `'CM Punk vs Logan Paul'` to `'CM Punk vs Seth Rollins'` |
| `src/lib/constants.ts` | Line 12 | Change options to `['CM Punk', 'Seth Rollins']` |
| `src/lib/constants.ts` | Line 112 | Same update in CARD_CONFIG |
| `src/lib/wrestler-data.ts` | Add entry | Add Seth Rollins image to DEFAULT_MALE_WRESTLERS |

---

## Issue 3: Add Sami Zayn Image

### Current State

Sami Zayn is in DEFAULT_MENS_ENTRANTS but NOT in DEFAULT_MALE_WRESTLERS, so he uses a placeholder avatar.

### Solution

1. Copy the uploaded image to project assets
2. Add Sami Zayn to the wrestler data

**File Operations:**

| Action | Source | Destination |
|--------|--------|-------------|
| Copy | `user-uploads://zayn.webp` | `src/assets/wrestlers/sami-zayn.webp` |

**Code Change in `wrestler-data.ts`:**

```typescript
// Import the local image (at top of file)
import samiZaynImage from '@/assets/wrestlers/sami-zayn.webp';

// Add to DEFAULT_MALE_WRESTLERS array:
{ name: 'Sami Zayn', imageUrl: samiZaynImage, gender: 'male' },
```

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/assets/wrestlers/sami-zayn.webp` | **NEW** - Copy uploaded image |
| `src/lib/constants.ts` | Update undercard_2 match from Logan Paul to Seth Rollins |
| `src/lib/wrestler-data.ts` | Add Sami Zayn with local image, add Seth Rollins entry |
| `src/components/tv/TvViewNavigator.tsx` | Add players/picks props, render ParticipantPicksView with sync |
| `src/components/tv/ParticipantPicksView.tsx` | Add currentMatchId prop for syncing |
| `src/pages/TvDisplay.tsx` | Pass players/picks to TvViewNavigator, remove standalone ParticipantPicksView |

---

## Visual Result

When navigating between views on TV:
- **Undercard 1 (Drew vs Sami)** - Shows picks for this specific match
- **Undercard 2 (Punk vs Seth)** - Shows picks for this specific match (NEW opponent)
- **Undercard 3 (AJ vs Gunther)** - Shows picks for this specific match
- **Men's Rumble** - No picks panel (only relevant for undercard)
- **Women's Rumble** - No picks panel (only relevant for undercard)

