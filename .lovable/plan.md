
# Unified Dashboard and Premium Pick Cards Redesign

## Overview

This plan consolidates the Solo Dashboard and Party Player Dashboard into unified components, implements premium visual redesigns for pick cards, and adds TV mode support for solo users. The goal is to create a consistent, visually stunning experience across both modes while maximizing screen real estate and reducing code duplication.

---

## Architecture Changes

### Current State
- **SoloDashboard.tsx** (836 lines) - Standalone solo-specific dashboard with inline tab components
- **PlayerDashboard.tsx** (579 lines) - Party-specific dashboard with different structure
- **SoloPicks.tsx** (461 lines) - Solo pick flow with cloud sync
- **PlayerPicks.tsx** (89 lines) - Wrapper around PickCardStack for party mode
- Duplicate logic for picks display, editing, and scoring

### New State
- **UnifiedDashboard.tsx** - Single dashboard component that adapts based on mode (solo vs party)
- **UnifiedPickFlow.tsx** - Single pick submission flow for both modes
- Shared dashboard section components with mode-aware rendering
- Solo users get TV mode access at `/solo/tv`

---

## Component Architecture

```text
+------------------------------------------+
|           UnifiedDashboard               |
|  (mode: "solo" | "party")                |
+------------------------------------------+
          |
          +---> DashboardHeader (scores, sync status, mode badge)
          +---> TabNavigation (matches, mens, womens, chaos, [numbers - party only])
          +---> MatchesSummaryTab (unified)
          +---> RumblePropsSummaryTab (unified)
          +---> ChaosPropsSummaryTab (unified)
          +---> NumbersTab (party only)
          +---> BottomActions (Score/TV for solo, Party functions for party)
```

---

## Phase 1: Premium Match Card Redesign ("Face-Off" Style)

### Current Issue
The MatchCard displays small wrestler avatars in an empty dark container, wasting space.

### New Design: Split-Screen Face-Off

**Layout Structure:**
- Card background splits diagonally or vertically
- Left/Top side: Red tint gradient
- Right/Bottom side: Blue tint gradient
- Wrestler images fill their respective halves (80% of card height)
- "VS" badge centered with heavy gold drop shadow

**Mobile (Stacked):**
```text
+---------------------------+
|    [Wrestler 1 - 70%]     |  <- Red gradient bg
|        NAME               |
+---------------------------+
|         VS (gold)         |
+---------------------------+
|    [Wrestler 2 - 70%]     |  <- Blue gradient bg
|        NAME               |
+---------------------------+
```

**Tablet/Desktop (Side-by-Side):**
```text
+---------------------------+------------------------+
|                           |        VS (gold)       |
|    [Wrestler 1]           |    [Wrestler 2]        |
|    80% height             |    80% height          |
|                           |                        |
+---------------------------+------------------------+
     Red gradient                Blue gradient
```

**Selection Feedback:**
- Selected side: Gold (#FFD700) glow border + subtle scale(1.02)
- Unselected side: Opacity reduced to 0.4, desaturated
- Transition: `transition-all duration-300 ease-out`

**Technical Implementation:**
```typescript
// New file: src/components/picks/cards/FaceOffMatchCard.tsx
interface FaceOffMatchCardProps {
  title: string;
  options: [string, string];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Uses glassmorphism for VS badge:
// backdrop-filter: blur(12px); bg-opacity-20; border: 1px solid rgba(255,255,255,0.1)
```

---

## Phase 2: Rumble Props Grid Refinement

### Current Issue
- Fixed 3-column grid causes name truncation ("Cod...", "The...")
- Outlined card style lacks depth
- Final Four section cramps avatars

### New Design

**Responsive Grid:**
- Mobile: `grid-cols-2` (gives full names room)
- Tablet: `grid-cols-3`
- Desktop: `grid-cols-4`

**Card Styling:**
- Remove outlined border style
- Use filled cards: `bg-gray-800` with subtle gradient
- Add depth: `shadow-lg` with subtle inner glow

**Final Four: Horizontal Carousel**
- Mobile: Swipeable carousel instead of static row
- Uses `embla-carousel-react` (already installed)
- Each slot: 80px avatar with wrestler name below
- Save vertical space, prevent avatar cramping

**Technical Implementation:**
```typescript
// Updated: src/components/picks/cards/RumblePropsCard.tsx
// Add responsive grid classes
// Replace Final Four static grid with carousel on mobile
```

---

## Phase 3: Rumble Winner Screen Optimization

### Current Issue
- "Your Pick" header takes 30% of screen height
- Excessive scrolling required to see roster
- Selected wrestler not visually distinct enough

### New Design

**Sticky Bottom Selection:**
- Move "Your Pick" summary to bottom as sticky footer
- Glassmorphism effect: `backdrop-blur-[12px] bg-black/70 border-t border-white/10`
- Always visible, doesn't block roster view

**Pinned Search:**
- Search bar sticks to top of the scrollable grid area
- `position: sticky; top: 0;`

**Grid Density:**
- Reduce gap from `gap-3` to `gap-2`
- Slightly smaller avatars: `max-w-[65px]` instead of `max-w-[70px]`

**Selection Spotlight:**
- Selected wrestler: Full opacity + gold ring
- All other wrestlers: Opacity 0.4 (dimmed)
- Creates visual spotlight effect

**Technical Implementation:**
```typescript
// Updated: src/components/picks/cards/RumbleWinnerCard.tsx
// Move selection preview to sticky bottom footer
// Add opacity dimming for non-selected wrestlers
```

---

## Phase 4: Unified Dashboard Component

### New Component: UnifiedDashboard.tsx

**Mode Detection:**
```typescript
interface UnifiedDashboardProps {
  mode: "solo" | "party";
  partyCode?: string;  // Required for party mode
  playerId?: string;   // Required for party mode
}
```

**Shared Features (Both Modes):**
- Score display with trophy icon
- Tab navigation (Matches, Men's, Women's, Chaos)
- Pick summary with edit capability (pre-event only)
- Real-time results display (during/after event)

**Solo-Specific Features:**
- Cloud sync indicator
- "Score Results" button (self-scoring)
- TV Mode access button
- No "Numbers" tab (solo doesn't have assigned numbers)

**Party-Specific Features:**
- "Numbers" tab showing assigned rumble numbers
- Number reveal animation on event start
- Celebration overlays for wins
- View other players' picks

### Shared Section Components

**Refactor existing components to accept mode prop:**
```typescript
interface MatchesSectionProps {
  picks: Pick[];
  results: MatchResult[];
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
  mode: "solo" | "party";  // NEW
}
```

---

## Phase 5: Solo TV Mode

### New Route: `/solo/tv`

**Implementation:**
- Reuse existing TvDisplay.tsx structure
- Adapt for solo mode: single viewer, no party code
- Data source: `solo_picks` and `solo_results` from localStorage + cloud

**TvDisplay Adaptations:**
```typescript
// Modified: src/pages/TvDisplay.tsx (or new SoloTvDisplay.tsx)
interface TvDisplayProps {
  mode: "party" | "solo";
  partyCode?: string;  // For party mode
}

// Solo mode shows:
// - 30-number grid (no player assignments, just entry tracking)
// - User's picks with correctness indicators
// - Personal leaderboard (just score, no rank)
```

**Solo TV Features:**
- Fullscreen rumble grid view
- Real-time entry tracking (manually updated via scoring modal)
- Pick correctness overlays as results come in
- No party leaderboard (solo is single-player)

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/picks/cards/FaceOffMatchCard.tsx` | Premium match card with face-off layout |
| `src/pages/UnifiedDashboard.tsx` | Combined solo/party dashboard |
| `src/pages/SoloTvDisplay.tsx` | TV mode for solo users |
| `src/components/dashboard/UnifiedMatchesSection.tsx` | Mode-aware matches display |
| `src/components/dashboard/FinalFourCarousel.tsx` | Swipeable Final Four selector |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/picks/cards/MatchCard.tsx` | Replace with FaceOffMatchCard or update in-place |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Sticky bottom selection, spotlight effect |
| `src/components/picks/cards/RumblePropsCard.tsx` | Responsive grid, carousel Final Four |
| `src/components/dashboard/MatchesSection.tsx` | Add mode prop, unify with solo version |
| `src/components/dashboard/RumblePropsSection.tsx` | Add mode prop, responsive improvements |
| `src/pages/SoloDashboard.tsx` | Refactor to use UnifiedDashboard |
| `src/pages/PlayerDashboard.tsx` | Refactor to use UnifiedDashboard |
| `src/App.tsx` | Add `/solo/tv` route |

### Files to Deprecate (After Migration)

- Inline tab components in SoloDashboard.tsx (MatchesTab, RumbleTab, ChaosTab)
- Duplicate styling logic between solo and party dashboards

---

## Styling Standards

### Glassmorphism (Sticky Elements)
```css
.glass-panel {
  backdrop-filter: blur(12px);
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Gold Accent (Active States)
```css
.gold-accent {
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}
```

### Selection Spotlight
```css
.wrestler-dimmed {
  opacity: 0.4;
  filter: grayscale(30%);
  transition: all 300ms ease-out;
}

.wrestler-selected {
  opacity: 1;
  transform: scale(1.05);
  border-color: #FFD700;
}
```

### Responsive Grid
```css
.props-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3;
}
```

---

## Implementation Order

1. **FaceOffMatchCard** - Create new premium match card component
2. **RumbleWinnerCard updates** - Sticky footer, spotlight effect
3. **RumblePropsCard updates** - Responsive grid, carousel Final Four
4. **UnifiedDashboard** - Create base component with mode switching
5. **Migrate SoloDashboard** - Use UnifiedDashboard with mode="solo"
6. **Migrate PlayerDashboard** - Use UnifiedDashboard with mode="party"
7. **SoloTvDisplay** - Add TV mode for solo users
8. **Testing and polish** - Verify all flows work correctly

---

## User Experience Summary

### Before
- Two separate dashboard experiences (solo vs party)
- Flat, empty match cards
- Truncated wrestler names in props grid
- Excessive scrolling in wrestler selection
- Solo users have no TV mode

### After
- Unified dashboard with mode-aware features
- Dynamic "Face-Off" match cards with team-colored backgrounds
- Responsive props grid with full names visible
- Spotlight selection with sticky footer in wrestler picker
- Solo users can access fullscreen TV mode for scoring
- Consistent premium visual language across all screens
