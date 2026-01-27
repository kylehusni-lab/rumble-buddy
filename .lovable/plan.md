
# TV Display Phase 1 Implementation - Go Live MVP

## Overview

Implement the Phase 1 TV Display enhancements to create an engaging group viewing experience for the Royal Rumble watch party. This focuses on five key features from the provided specification.

---

## Current State Analysis

**Existing Implementation:**
- 10x3 number grid for Men's/Women's Rumbles
- Basic leaderboard sidebar (shows top 10 players)
- Entry overlay animation (5 seconds)
- Celebration overlays (Final Four, Iron Man, Winner)
- Number reveal animation on event start
- Real-time subscriptions via Supabase

**Key Files:**
- `src/pages/TvDisplay.tsx` - Main display (490 lines)
- `src/lib/wrestler-data.ts` - Wrestler photos with WWE CDN URLs
- `src/components/CelebrationOverlay.tsx` - Existing celebration animations
- `src/lib/constants.ts` - Match/prop definitions

---

## Features to Implement

### 1. Active Match Display with Wrestler Photos

Show the current undercard match with large wrestler photos.

```text
+-----------------------------------------------+
|  [LIVE]           ROYAL RUMBLE 2026           |
+-----------------------------------------------+
|                                               |
|    [Photo]           VS          [Photo]      |
|   CM Punk                       Logan Paul    |
|                                               |
|          CM Punk vs Logan Paul                |
+-----------------------------------------------+
```

**Data Flow:**
- Query `match_results` to find active match (no result yet)
- Use `getWrestlerImageUrl()` from wrestler-data.ts
- Fallback to UI Avatars placeholder for unknowns

**New Component:** `src/components/tv/ActiveMatchDisplay.tsx`

---

### 2. Participant Picks - Horizontal Scroll View

Show what each player picked for the current match.

```text
+----------------------------------------------------------+
|  Who Did They Pick?                            [< >]     |
+----------------------------------------------------------+
|  [Photo]     [Photo]     [Photo]     [Photo]            |
|  CM Punk     L. Paul     CM Punk     L. Paul            |
|  Demo Host   Randy S.    Hulk H.     Macho Man          |
|    [lock]      [lock]      [lock]      [lock]           |
+----------------------------------------------------------+
```

**Data Flow:**
- Query `picks` table for current match_id
- Join with `players` for display names
- Show wrestler photo + participant name

**New Component:** `src/components/tv/ParticipantPicksView.tsx`

---

### 3. Leaderboard Collapse/Expand Toggle

Allow hiding/collapsing the leaderboard for more screen space.

**States:**
- `expanded` - Full leaderboard (top 10)
- `collapsed` - Top 3 only
- `hidden` - Minimal tab on right edge

**Persist state:** localStorage

**New Component:** `src/components/tv/LeaderboardPanel.tsx`

---

### 4. Match Progress Counter

Show how many matches are complete with an "Up Next" preview.

```text
+------------------------------------------+
|  Matches: 2 of 7 Complete                |
|  [========--------] 29%                  |
|                                          |
|  UP NEXT: Men's Royal Rumble             |
+------------------------------------------+
```

**Logic:**
- Count `match_results` entries
- Total matches from `CARD_CONFIG` (7 cards)
- Next match = first without a result

**New Component:** `src/components/tv/MatchProgressBar.tsx`

---

### 5. Big Board - Wrestler Photos on Numbers

Enhance number grid cells to show wrestler photos when claimed.

```text
Current:    Enhanced:
+----+      +--------+
| 1  |      |   1    |
| DH |      | [Photo]|
+----+      | CM Punk|
            |   DH   |
            +--------+
```

**Changes:**
- Active cells show wrestler photo (small, 48px)
- Wrestler name (first name only)
- Owner initials below
- Eliminated cells: grayscale photo, X overlay

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/components/tv/ActiveMatchDisplay.tsx` | Current match with photos |
| `src/components/tv/ParticipantPicksView.tsx` | Horizontal scroll of picks |
| `src/components/tv/LeaderboardPanel.tsx` | Collapsible leaderboard |
| `src/components/tv/MatchProgressBar.tsx` | Progress counter |
| `src/components/tv/NumberCell.tsx` | Enhanced grid cell |
| `src/components/tv/WrestlerImage.tsx` | Reusable image with fallback |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Integrate new components, update layout |
| `src/index.css` | Add TV-specific CSS classes |

---

## Technical Implementation

### WrestlerImage Component

```typescript
// src/components/tv/WrestlerImage.tsx
interface WrestlerImageProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallbackIcon?: boolean;
}

// Uses getWrestlerImageUrl() from wrestler-data.ts
// Handles onError -> fallback to UI Avatars
// Size variants: sm=48px, md=80px, lg=180px, xl=400px
```

### Updated TvDisplay Layout

```text
+----------------------------------------------------------------+
|  Header: Logo + Status + Match Progress                        |
+----------------------------------------------------------------+
|                                                    |           |
|  [Active Match Display - when undercard]           | Leaderboard
|       OR                                           | (collapsible)
|  [Number Grids - when Rumble active]               |           |
|                                                    |           |
+----------------------------------------------------------------+
|  [Participant Picks - horizontal scroll]                       |
+----------------------------------------------------------------+
```

### Data Queries Needed

```typescript
// Active match detection
const activeMatch = UNDERCARD_MATCHES.find(m => 
  !matchResults.some(r => r.match_id === m.id)
);

// Participant picks for current match
const { data: picks } = await supabase
  .from("picks")
  .select("player_id, prediction")
  .eq("match_id", activeMatchId);
```

### Leaderboard State Management

```typescript
type LeaderboardState = "expanded" | "collapsed" | "hidden";

const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>(
  () => localStorage.getItem("tv-leaderboard-state") as LeaderboardState || "expanded"
);

useEffect(() => {
  localStorage.setItem("tv-leaderboard-state", leaderboardState);
}, [leaderboardState]);
```

---

## Styling Updates

### New CSS Classes for `src/index.css`

```css
/* TV Active Match */
.tv-match-display { ... }
.tv-wrestler-card { ... }
.tv-vs-graphic { ... }

/* TV Participant Picks */
.tv-picks-scroll { ... }
.tv-pick-card { ... }
.tv-pick-card.correct { ... }
.tv-pick-card.incorrect { ... }

/* TV Leaderboard States */
.tv-leaderboard.expanded { ... }
.tv-leaderboard.collapsed { ... }
.tv-leaderboard.hidden { ... }

/* Enhanced Number Cells */
.number-cell-enhanced { ... }
.number-cell-photo { ... }
```

---

## Implementation Order

1. **WrestlerImage** - Reusable component (foundation)
2. **NumberCell** - Enhanced grid cells with photos
3. **LeaderboardPanel** - Collapsible leaderboard
4. **MatchProgressBar** - Progress counter
5. **ActiveMatchDisplay** - Current match view
6. **ParticipantPicksView** - Horizontal picks scroll
7. **TvDisplay Integration** - Wire everything together

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Wrestler image fails to load | Fallback to UI Avatars placeholder |
| No active match | Show "Waiting for next match" state |
| All matches complete | Show final standings view |
| 0 participants | Hide picks section |
| Unknown wrestler (surprise entrant) | Generate placeholder with name initials |
| Long participant names | Truncate with ellipsis (max 12 chars) |

---

## Responsive Considerations

- Optimized for 1920x1080 (Full HD TV)
- Text sized for viewing from 10+ feet
- High contrast colors for visibility
- Minimal scrolling required during viewing

---

## Testing Checklist

- [ ] Wrestler photos load correctly
- [ ] Fallback placeholders work
- [ ] Leaderboard state persists on refresh
- [ ] Match progress updates in real-time
- [ ] Picks scroll smoothly with 10+ participants
- [ ] Number cells show photos for active wrestlers
- [ ] Eliminated cells show grayscale + X
- [ ] Layout works on 1920x1080 display
