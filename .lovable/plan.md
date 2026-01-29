

# TV Display Header Redesign and Wrestler Card Enhancement

## Overview

This plan implements the engineering specs for the TV display mode, focusing on four key areas:
1. Streamlined single-row auto-hiding header
2. Wrestler cards with clear player ownership labels
3. Current entrant gold pulsing glow effect
4. Live scoring popup system

---

## Part 1: Single-Row Auto-Hiding Header

### Current State

The header currently spans 3 rows:
- Row 1: Logo, party code, title, stats pill, controls
- Row 2: Main tab bar (Leaderboard, Undercard, Men's, Women's)
- Row 3: Sub-tabs for Rumble views (Entry Grid, Rumble Props, Chaos Props)

### New Design

Single horizontal bar that auto-hides after 5 seconds of inactivity:

```text
#3158   Leaderboard   Undercard   Men's [▾]   Women's [▾]        Auto   Full
```

### Elements to Remove
- Logo component (only show on waiting screen)
- Large view title ("Women's Royal Rumble")
- Player count display
- Stats pill (active/eliminated counts)
- Settings gear icon

### New Layout Structure

```text
Left Section:
  - Party code: #3158 (gray #666, 14px font)

Center Section - Navigation:
  - Horizontal pill buttons: Leaderboard | Undercard | Men's ▾ | Women's ▾
  - Styling:
    - Inactive: transparent bg, #888 text
    - Hover: rgba(255,255,255,0.1) bg, white text
    - Active: #f5c518 (gold) bg, black text, 600 weight
  - Men's/Women's show dropdown arrow when active

Right Section - Controls:
  - Auto toggle button
  - Full (fullscreen) toggle button
  - Toggle styling:
    - Inactive: rgba(255,255,255,0.1) bg, #aaa text
    - Active: rgba(245,197,24,0.2) bg, #f5c518 text and border
```

### Sub-Navigation Dropdown

When Men's or Women's tab is clicked (if already active), a floating dropdown appears:

```text
┌─────────────────────────────────────────┐
│   Entry Grid   Rumble Props   Chaos Props │
└─────────────────────────────────────────┘
```

- Background: rgba(30, 30, 40, 0.95) with backdrop-filter: blur(10px)
- Border: 1px solid rgba(255,255,255,0.1), 8px radius
- Same gold active state styling
- Closes on sub-item selection or outside click

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Remove Logo import, restructure header to single row, integrate new TvUnifiedHeader component |
| `src/components/tv/TvTabBar.tsx` | Complete rewrite for inline horizontal layout with dropdown support |
| `src/components/tv/TvHeaderStats.tsx` | Remove - no longer needed |
| `src/components/tv/RumbleSubTabs.tsx` | Remove - integrated into TvTabBar dropdown |
| `src/components/tv/TvViewNavigator.tsx` | Remove RumbleSubTabs usage, receive subView as prop |
| `src/hooks/useAutoHideHeader.ts` | New hook for auto-hide behavior |
| `src/index.css` | Update TV tab bar styles for new design |

---

## Part 2: Auto-Hide Behavior

### Implementation

Create a new `useAutoHideHeader` hook:

```typescript
const HIDE_DELAY = 5000; // 5 seconds

export function useAutoHideHeader() {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsVisible(false), HIDE_DELAY);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();
    
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);
  
  return isVisible;
}
```

### Animation Specs

```css
/* Fade out */
.tv-header-hidden {
  opacity: 0;
  transform: translateY(-20px);
  pointer-events: none;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

/* Fade in */
.tv-header-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
```

### Hover Zone

20px invisible zone at top of screen reveals header when mouse enters:

```tsx
{!isHeaderVisible && (
  <div 
    className="fixed top-0 left-0 right-0 h-5 z-50"
    onMouseEnter={() => setIsVisible(true)}
  />
)}
```

### Optional: View Indicator When Hidden

When header is hidden, show current view at 40% opacity in top-right:

```text
Women's: Entry Grid
```

- 13px font, fades out when header visible

---

## Part 3: Wrestler Card Redesign

### Current Implementation

`TvNumberCell.tsx` shows:
- Number badge (top-left corner, circular)
- Wrestler image (full-frame)
- Bottom gradient banner with small color dot + first name

### New Design

#### Card Structure

```text
┌─────────────────────┐
│ [1]                 │  <- Entry number badge (top-left)
│                     │
│    [wrestler        │
│     image]          │
│                     │
├─────────────────────┤
│       KYLE          │  <- Owner banner (full width, solid color)
└─────────────────────┘
```

### Entry Number Badge

- Position: absolute, top 6px, left 8px
- Background: rgba(0,0,0,0.5)
- Padding: 2px 6px
- Border-radius: 4px
- Font: 12px, 600 weight, rgba(255,255,255,0.5) color

### Owner Banner

- Position: absolute bottom, full width
- Background: player's assigned color (SOLID, not transparent)
- Padding: 6px 8px
- Player name: 13px, 700 weight, BLACK text, uppercase, 0.5px letter-spacing
- Text: centered

### Card Border

- Assigned wrestler: 3px solid border in owner's color
- Unassigned: 2px solid rgba(255,255,255,0.1)

### Card States

**Empty (assigned to player, no wrestler yet):**
- Large entry number centered (36px, 300 weight, 15% opacity white)
- Owner banner at bottom with solid color
- Colored border

**Empty (unassigned):**
- Large entry number centered
- No banner
- Subtle border: 2px solid rgba(255,255,255,0.1)

**Active (wrestler revealed, still in match):**
- Wrestler image (object-fit: cover, object-position: top center)
- Entry number badge (top-left)
- Owner banner at bottom
- 3px solid colored border

**Current Entrant (just entered):**
- Everything from Active state, plus:
- Gold border (#f5c518) overrides owner color
- Pulsing glow animation:

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.4); }
  50% { box-shadow: 0 0 35px rgba(245, 197, 24, 0.7); }
}
```

- Animation: 2s ease-in-out infinite

**Eliminated:**
- Card opacity: 0.6
- Owner banner opacity: 0.5
- Wrestler image: grayscale
- Red X overlay on image:
  - Dark overlay: rgba(0,0,0,0.4)
  - SVG X: two crossed lines, #ff4444 stroke, 8px width, round caps
  - X size: ~60% of card, centered

### Props Required

```typescript
interface TvNumberCellProps {
  number: number;
  wrestlerName: string | null;
  ownerName: string | null;      // NEW: player display name
  ownerColor: string | null;     // NEW: hex color like #e91e63
  status: "pending" | "active" | "eliminated" | "current"; // Added "current"
  isAssigned: boolean;           // NEW: whether this number is assigned to a player
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/tv/TvNumberCell.tsx` | Complete rewrite with new banner design, 4 states |
| `src/components/tv/TvViewNavigator.tsx` | Pass ownerName and ownerColor props, detect "current" entrant |
| `src/index.css` | Add pulse-glow keyframes, eliminated X overlay styles |

---

## Part 4: Live Scoring Popups

### Trigger Events

- Wrestler enters (player earns entry points)
- Elimination happens
- Any other scoring event

### Design

```text
┌──────────────────────────────────────┐
│          +10 Kyle!                   │
└──────────────────────────────────────┘
```

- Position: fixed, center of screen (50%/50% with transform)
- Background: linear-gradient from #f5c518 to #e6b800
- Text: 32px, 800 weight, black
- Padding: 16px 32px
- Border-radius: 12px
- Box-shadow: 0 10px 40px rgba(245, 197, 24, 0.5)
- Z-index: 100

### Animation

**Enter (0.5s ease-out):**
- From: opacity 0, scale 0.5
- To: opacity 1, scale 1

**Exit (0.5s ease-in, after 2s delay):**
- From: opacity 1, scale 1
- To: opacity 0, scale 0.8, translateY -20px

### Queue Behavior

Multiple score events queue with 0.5s gap between popups.

### Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/tv/TvScorePopup.tsx` | New component for popup display |
| `src/hooks/useTvScoreQueue.ts` | New hook managing popup queue |
| `src/pages/TvDisplay.tsx` | Integrate score popup system, trigger on realtime events |

---

## Part 5: Technical Specifications

### Color Palette

```typescript
const TV_COLORS = {
  gold: '#f5c518',
  goldDark: '#e6b800',
  goldTransparent: 'rgba(245, 197, 24, 0.2)',
  background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)',
  headerBg: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
  textMuted: '#888',
  textDimmed: '#666',
  borderSubtle: 'rgba(255,255,255,0.1)',
  cardBg: 'rgba(255,255,255,0.03)',
  eliminatedRed: '#ff4444',
};
```

### Player Color System

Update `PLAYER_COLORS` in TvViewNavigator.tsx to use hex values for banner backgrounds:

```typescript
const PLAYER_COLORS = [
  { name: 'pink', hex: '#e91e63', textColor: 'black' },
  { name: 'amber', hex: '#ffc107', textColor: 'black' },
  { name: 'orange', hex: '#ff5722', textColor: 'black' },
  { name: 'green', hex: '#4caf50', textColor: 'black' },
  { name: 'blue', hex: '#2196f3', textColor: 'white' },
  { name: 'purple', hex: '#9c27b0', textColor: 'white' },
  { name: 'cyan', hex: '#00bcd4', textColor: 'black' },
  { name: 'indigo', hex: '#3f51b5', textColor: 'white' },
];
```

### Grid Layout

| Screen Width | Columns |
|--------------|---------|
| 1400px+ | 10 columns |
| 768px - 1399px | 6 columns |
| Below 768px | 5 columns |

Gap: 10px between cards

### Transition Timing

| Element | Duration | Easing |
|---------|----------|--------|
| Hover effects | 0.2s | ease |
| Header show/hide | 0.4s | ease |
| Card state changes | 0.3s | ease |
| Score popup enter | 0.5s | ease-out |
| Score popup exit | 0.5s | ease-in |

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create `useAutoHideHeader` hook | `src/hooks/useAutoHideHeader.ts` |
| 2 | Rewrite `TvTabBar` with inline layout and dropdown | `src/components/tv/TvTabBar.tsx` |
| 3 | Update `TvDisplay.tsx` header structure | `src/pages/TvDisplay.tsx` |
| 4 | Remove unused components | Delete `TvHeaderStats.tsx`, `RumbleSubTabs.tsx` |
| 5 | Update `TvViewNavigator` to receive subView as prop | `src/components/tv/TvViewNavigator.tsx` |
| 6 | Rewrite `TvNumberCell` with new design | `src/components/tv/TvNumberCell.tsx` |
| 7 | Add CSS for new styles | `src/index.css` |
| 8 | Create score popup system | `src/components/tv/TvScorePopup.tsx`, `src/hooks/useTvScoreQueue.ts` |
| 9 | Integrate score popups in TvDisplay | `src/pages/TvDisplay.tsx` |

---

## Summary of Changes

1. **Header**: Single row, auto-hides after 5 seconds, no logo, dropdown sub-navigation
2. **Cards**: Bottom banner with player name in solid color, 3px colored border
3. **Current entrant**: Gold pulsing glow effect (2s animation)
4. **Eliminated**: 0.6 opacity, grayscale image, red X overlay
5. **Scoring**: Centered popup animation when points are earned, queued with 0.5s gaps

This creates an immersive, broadcast-quality TV experience optimized for 10-foot viewing distance.

