
# Unified Dashboard Architecture and Solo TV Enhancement Plan

## Overview

This plan establishes a clear dashboard hierarchy with three distinct experiences, ensuring users always have easy navigation back to their unified hub (`/my-parties`). Additionally, Solo TV will be upgraded to match Party TV features.

---

## Dashboard Hierarchy

```
/my-parties (Unified Hub)
    |
    +-- Solo Mode
    |       +-- /solo/dashboard (Player Dashboard - Solo)
    |       +-- /solo/tv (TV Display - Solo)
    |
    +-- Party Mode (Host)
    |       +-- /host/setup/:code (Host Setup)
    |       +-- /host/control/:code (Host Dashboard - scoring & management)
    |       +-- /player/dashboard/:code (Player Dashboard - Party, for host's own picks)
    |       +-- /tv/:code (TV Display - Party)
    |
    +-- Party Mode (Player)
            +-- /player/dashboard/:code (Player Dashboard - Party)
            +-- /tv/:code (TV Display - Party, view only)
```

---

## Part 1: Navigation Improvements

### Current Issue
- `PlayerDashboard` back button goes to `/` (homepage) instead of `/my-parties`
- `HostHeader` back button goes to `/` instead of `/my-parties`
- `SoloDashboard` logout goes to `/` instead of `/my-parties`
- `QuickActionsSheet` sign out goes to `/` instead of keeping user logged in

### Solution: Add "Back to Hub" Navigation

**Files to Modify:**

| File | Change |
|------|--------|
| `src/pages/PlayerDashboard.tsx` | Update back arrow to go to `/my-parties` |
| `src/components/host/HostHeader.tsx` | Update back arrow to go to `/my-parties` |
| `src/components/host/QuickActionsSheet.tsx` | Add "My Dashboard" action that goes to `/my-parties` |
| `src/pages/SoloDashboard.tsx` | Add back arrow (not just logout) to `/my-parties` |
| `src/components/dashboard/UnifiedDashboardHeader.tsx` | Add `onBack` prop for navigation |

### Navigation UX Changes

1. **Player Dashboard Header**: Back arrow navigates to `/my-parties` instead of `/`
2. **Host Header**: Back arrow navigates to `/my-parties` instead of `/`
3. **Solo Dashboard Header**: Add back arrow (alongside logout) to `/my-parties`
4. **Quick Actions Sheet**: Replace "Sign Out" behavior - keep user logged in, just navigate to hub

---

## Part 2: Unified Player Dashboard for Party Mode

### Current State
- `SoloDashboard` uses modern unified components (`UnifiedDashboardHeader`, `UnifiedTabNavigation`, `UnifiedMatchesTab`, etc.)
- `PlayerDashboard` uses legacy components (`BottomNavBar`, `MatchesSection`, `RumblePropsSection`)

### Solution: Refactor PlayerDashboard to Use Unified Components

**Files to Modify:**

| File | Change |
|------|--------|
| `src/pages/PlayerDashboard.tsx` | Major refactor to use unified components |
| `src/components/dashboard/UnifiedDashboardHeader.tsx` | Add `onBack` prop, enhance party mode display |

### PlayerDashboard Refactoring

1. **Replace Header**: Use `UnifiedDashboardHeader` with:
   - `mode="party"`
   - `partyCode={code}`
   - `rank` and `totalPlayers` for party context
   - `onBack` navigation to `/my-parties`

2. **Replace Tab Navigation**: Use `UnifiedTabNavigation` with:
   - `showNumbers={true}` when party is live
   - `numbersCompletion` for numbers tab badge

3. **Replace Content Components**:
   - Replace `MatchesSection` with `UnifiedMatchesTab`
   - Replace `RumblePropsSection` with `UnifiedRumblePropsTab`
   - Keep `NumbersSection` as-is (unique to party mode)
   - Use `UnifiedChaosTab` for chaos props

4. **Preserve Party Features**:
   - Number reveal animation stays
   - Celebration overlays stay
   - Realtime subscriptions stay
   - Pre-event "Edit Picks" link stays

### Updated UnifiedDashboardHeader Props

```typescript
interface UnifiedDashboardHeaderProps {
  mode: "solo" | "party";
  displayName: string;
  score: number;
  rank?: number | null;           // Party mode
  totalPlayers?: number;          // Party mode
  isSynced?: boolean;             // Solo mode
  partyCode?: string;             // Party mode
  onLogout?: () => void;
  onOpenTv?: () => void;
  onBack?: () => void;            // NEW: Hub navigation
}
```

---

## Part 3: Enhanced Solo TV Display

### Current State
- Solo TV is very basic (simple list of picks)
- Missing grid view, props display, activity ticker, etc.
- No visual parity with Party TV

### Solution: Port Party TV Features to Solo Mode

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/components/tv/TvSoloScoreDisplay.tsx` | Replaces leaderboard with cumulative score |

**Files to Modify:**

| File | Change |
|------|--------|
| `src/pages/SoloTvDisplay.tsx` | Complete rewrite using shared TV components |
| `src/components/tv/TvViewNavigator.tsx` | Add `mode` prop to conditionally hide owner data |
| `src/components/tv/TvNumberCell.tsx` | Hide owner label/initials in solo mode |
| `src/components/tv/RumblePropsDisplay.tsx` | Hide player picks column in solo mode |

### Solo TV Architecture

| Tab | Party TV | Solo TV |
|-----|----------|---------|
| Scores/Leaderboard | Ranked player list | Single player's cumulative score with breakdown |
| Undercard | Match results with all player picks | Match results with your picks only |
| Men's Rumble | Grid/Props/Chaos with owner colors | Grid/Props/Chaos without owner info |
| Women's Rumble | Grid/Props/Chaos with owner colors | Grid/Props/Chaos without owner info |

### New Component: TvSoloScoreDisplay

```
+------------------------------------------+
|              YOUR SCORE                  |
|         +-------------------+            |
|         |       127         |            |
|         |      points       |            |
|         +-------------------+            |
|                                          |
|   SCORING BREAKDOWN                      |
|   +----------------------------------+   |
|   | Undercard 1 (Roman Reigns) | +25 |   |
|   | Men's First Elim (Kofi)    | +10 |   |
|   | Women's Winner (Bianca)    | +50 |   |
|   +----------------------------------+   |
|                                          |
+------------------------------------------+
```

### Mode Prop for Shared Components

Add `mode?: "solo" | "party"` to these components:
- `TvViewNavigator`: Conditionally pass through mode
- `TvNumberCell`: Hide owner initials/color when `mode="solo"`
- `RumblePropsDisplay`: Hide "Players" column when `mode="solo"`
- `ChaosPropsDisplay`: Hide "Players" column when `mode="solo"`

---

## Part 4: Host Quick Actions Enhancement

### Current Issue
- "Sign Out" clears session and goes to homepage
- No easy way to get back to unified hub while staying logged in

### Solution: Add Hub Navigation

**Modify `QuickActionsSheet.tsx`:**

1. Add "My Dashboard" action at top of list:
   - Icon: `LayoutDashboard`
   - Title: "My Dashboard"
   - Subtitle: "Back to all parties"
   - Action: Navigate to `/my-parties`

2. Keep "Sign Out" but clarify it clears both PIN and auth:
   - Title: "Sign Out"
   - Subtitle: "Clear session & PIN"

---

## Implementation Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/tv/TvSoloScoreDisplay.tsx` | Solo TV score display (replaces leaderboard) |

### Files to Modify

| File | Change Scope |
|------|--------------|
| `src/pages/PlayerDashboard.tsx` | Major refactor - use unified components |
| `src/pages/SoloTvDisplay.tsx` | Major refactor - use shared TV components |
| `src/components/dashboard/UnifiedDashboardHeader.tsx` | Add `onBack` prop |
| `src/components/host/HostHeader.tsx` | Update back navigation to `/my-parties` |
| `src/components/host/QuickActionsSheet.tsx` | Add "My Dashboard" action |
| `src/components/tv/TvViewNavigator.tsx` | Add `mode` prop |
| `src/components/tv/TvNumberCell.tsx` | Conditionally hide owner in solo mode |
| `src/components/tv/RumblePropsDisplay.tsx` | Conditionally hide player column |
| `src/components/tv/ChaosPropsDisplay.tsx` | Conditionally hide player column |

---

## Data Flow for Solo TV

Solo TV will use local storage + cloud sync:

1. **Picks**: `getSoloPicks()` from local storage (synced via `useSoloCloud`)
2. **Results**: `getSoloResults()` from local storage (synced via `useSoloCloud`)
3. **Score Calculation**: `calculateSoloScore(picks, results)` utility
4. **Entrants**: `usePlatformConfig()` for wrestler data

No realtime subscriptions needed - refresh on page load or manual sync.

---

## Testing Checklist

After implementation, verify:

- [ ] Back arrow from Player Dashboard goes to `/my-parties`
- [ ] Back arrow from Host Dashboard goes to `/my-parties`
- [ ] Back arrow from Solo Dashboard goes to `/my-parties`
- [ ] Solo TV shows cumulative score (not leaderboard)
- [ ] Solo TV grid shows entries without owner colors/names
- [ ] Solo TV props show only your picks (not all players)
- [ ] Party Player Dashboard uses same visual style as Solo Dashboard
- [ ] Number reveal animation still works in Party mode
- [ ] Celebration overlays still trigger correctly
- [ ] Pre-event editing still works
