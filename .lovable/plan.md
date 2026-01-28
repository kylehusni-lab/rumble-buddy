
## Plan: TV-Optimized Navigation Bar Redesign

This plan redesigns the TvTabBar and related components to create a premium, 10-foot readable navigation system with consolidated tabs, Riyadh-inspired gold and green accents, and a clear visual hierarchy.

---

### 1. Consolidate Navigation Structure

**Current State**: 5 tabs (Leaderboard, Match 1, Match 2, Men's, Women's)

**New Structure**: 4 tabs
| Tab | Icon | Purpose |
|-----|------|---------|
| **Leaderboard** | Trophy | Player rankings - front and center |
| **Undercard** | Swords | Opens a 2-match selector for Drew vs Sami and Gunther vs AJ |
| **Men's Rumble** | Users | Men's Royal Rumble with sub-tabs |
| **Women's Rumble** | Users | Women's Royal Rumble with sub-tabs |

**Benefits**:
- Reduces visual clutter from 5 buttons to 4
- More horizontal space for larger text
- Clear hierarchy between main events (Rumbles) and supporting content

---

### 2. Enhanced Visual Design

**Color Palette**:
- **Active tab**: Riyadh Gold (#D4AF37) with a glowing underline and slight gold background tint
- **Rumble tabs (Main Events)**: Larger text, bolder weight to emphasize importance
- **Inactive tabs**: Desaturated gray with muted icons to reduce visual noise

**Size Targets for 10-Foot Readability**:
- Tab icons: 28px minimum (currently 20px)
- Tab labels: 20px font-size (currently 14px)
- Tab buttons: 56px height minimum
- Overall bar padding: Increased for visual breathing room

**Active State**:
- Heavy 4px gold bottom border with glow effect
- Subtle gold background tint
- Full color saturation on icon and text

---

### 3. Undercard Sub-Navigation

When "Undercard" is selected, the view will show a mini-selector or cycle between the two matches. Two implementation options:

**Option A: Inline Match Switcher (Recommended)**
- Below the main tab bar, show a simple toggle: `Drew vs Sami | Gunther vs AJ`
- Users can tap to switch between matches
- Keyboard shortcuts: Hold `2` and tap left/right arrows

**Option B: Tabbed Sub-View**
- Similar to how Rumble views have sub-tabs for Grid/Props/Chaos
- Add a `UndercardSubTabs` component with the two matches

---

### 4. Technical Implementation

**Files to Modify**:

| File | Changes |
|------|---------|
| `src/components/tv/TvTabBar.tsx` | Complete redesign with new styling, larger sizes, gold accents |
| `src/components/tv/TvViewNavigator.tsx` | Update VIEWS array, add undercard state management |
| `src/pages/TvDisplay.tsx` | Pass undercard sub-view state to navigator |
| `src/index.css` | Add new TV navigation CSS classes for gold glow, active underline |

**New TvTabBar Structure**:
```tsx
// Simplified view config for 4 tabs
const TAB_CONFIG = [
  { id: "leaderboard", icon: Trophy, label: "Leaderboard", shortcut: "1", isMainEvent: false },
  { id: "undercard", icon: Swords, label: "Undercard", shortcut: "2", isMainEvent: false },
  { id: "mens", icon: Users, label: "Men's Rumble", shortcut: "3", isMainEvent: true },
  { id: "womens", icon: Users, label: "Women's Rumble", shortcut: "4", isMainEvent: true },
];
```

**New CSS Classes**:
```css
/* TV Tab Bar - Gold accent styling */
.tv-tab-active {
  background: linear-gradient(180deg, hsla(43, 75%, 52%, 0.15) 0%, transparent 100%);
  border-bottom: 4px solid hsl(43 75% 52%);
  box-shadow: 0 4px 20px hsla(43, 75%, 52%, 0.3);
}

.tv-tab-inactive {
  color: hsl(0 0% 50%);
  opacity: 0.7;
}

.tv-tab-main-event {
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
}
```

---

### 5. Undercard Match Selector Component

Create a new `UndercardMatchSelector` component for the inline match toggle:

```tsx
// src/components/tv/UndercardMatchSelector.tsx
interface UndercardMatchSelectorProps {
  matches: { id: string; title: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}
```

**Styling**:
- Horizontal pills showing match names
- Active match has green accent (success color) to differentiate from gold tabs
- Matches the existing `RumbleSubTabs` aesthetic

---

### 6. View Flow Updates

**Updated VIEWS Array**:
```tsx
export const VIEWS: View[] = [
  { type: "leaderboard", id: "leaderboard", title: "Leaderboard" },
  { type: "undercard", id: "undercard", title: "Undercard" }, // Single undercard entry
  { type: "rumble", id: "mens", title: "Men's Royal Rumble", gender: "mens" },
  { type: "rumble", id: "womens", title: "Women's Royal Rumble", gender: "womens" },
];
```

**Undercard State Management**:
- Add `undercardMatchIndex` state to track which match is being displayed
- Pass to `TvViewNavigator` to render the correct `ActiveMatchDisplay`
- Keyboard: When on Undercard tab, left/right arrows cycle between matches

---

### 7. Visual Hierarchy Summary

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [🏆 Leaderboard]  [⚔ Undercard]  [👥 MEN'S RUMBLE]  [👥 WOMEN'S RUMBLE]        │
│        ─────            ═════         ════════════       ════════════            │
│      inactive          ACTIVE          Main Event          Main Event            │
│       (gray)           (gold)           (larger)            (larger)             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 ▼
                When Undercard is active:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Drew vs Sami  ●────○  Gunther vs AJ                          │
│                      (selected)            (available)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 8. Keyboard Shortcuts Update

| Key | Action |
|-----|--------|
| `1` | Jump to Leaderboard |
| `2` | Jump to Undercard |
| `3` | Jump to Men's Rumble |
| `4` | Jump to Women's Rumble |
| `←` / `→` | When on Undercard: cycle between matches |
| `←` / `→` | When on Rumble: cycle between main tabs |

---

### 9. Implementation Order

1. **Add CSS classes** in `src/index.css` for TV tab styling
2. **Create UndercardMatchSelector** component for the match toggle
3. **Refactor TvTabBar** with new 4-tab structure and visual design
4. **Update TvViewNavigator** to consolidate undercard handling
5. **Update TvDisplay** with undercard match state management
6. **Update keyboard navigation** for new tab structure

---

### 10. Accessibility Considerations

- All tabs maintain keyboard focus indicators
- Tab role and aria-selected attributes for screen readers
- Sufficient color contrast (gold on dark exceeds WCAG AA)
- Status indicators (complete/active) remain visible with icons not just color
