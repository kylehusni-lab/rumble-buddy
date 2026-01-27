
# Mobile Player Dashboard Redesign

## Overview

Redesign the PlayerDashboard page to improve mobile UX with:
1. **Bottom Navigation Bar** - Tab-based navigation to switch between grouped content
2. **Grouped Picks** - Organize picks into logical categories
3. **Persistent Points Display** - Always-visible score with rank

---

## Current Issues (from screenshot)

- Long scrolling list of all picks mixed together
- Points only visible in header (easy to lose context)
- No quick way to jump between pick categories
- "Your Numbers" section only appears after event starts, wasting space pre-event

---

## New Layout Structure

```text
┌─────────────────────────────────────┐
│ ← Party 8210           🏆 45 pts    │
│     Kyle               #3 of 7      │
├─────────────────────────────────────┤
│                                     │
│    [Content Area - Scrollable]      │
│                                     │
│    Based on active tab:             │
│    - My Numbers (during event)      │
│    - Undercard Picks                │
│    - Rumble Winners                 │
│    - Men's Props                    │
│    - Women's Props                  │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🔢    🏆    👔    👗    ⚡         │
│ Numbers Matches Men's Women's Props │
└─────────────────────────────────────┘
```

---

## Implementation Details

### 1. Bottom Navigation Bar Component

Create a new component for the tab bar:

```typescript
// File: src/components/dashboard/BottomNavBar.tsx

interface NavTab {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number; // For showing pending picks count
}

const TABS: NavTab[] = [
  { id: "numbers", icon: Hash, label: "Numbers" },
  { id: "matches", icon: Trophy, label: "Matches" },
  { id: "mens", icon: User, label: "Men's" },
  { id: "womens", icon: User, label: "Women's" },
  { id: "chaos", icon: Zap, label: "Chaos" },
];
```

**Styling:**
- Fixed to bottom of screen
- 44px+ tap targets (mobile-first)
- Active tab highlighted with primary color
- Safe area padding for iOS notch devices

### 2. Tab Content Sections

Each tab shows a specific category of picks:

**Numbers Tab** (only during/after event):
- Men's Rumble numbers assigned to player
- Women's Rumble numbers assigned to player
- Status indicators (pending/active/eliminated)

**Matches Tab**:
- 3 Undercard match picks
- Men's Rumble Winner pick
- Women's Rumble Winner pick

**Men's Tab**:
- First Elimination
- Most Eliminations
- Iron Man
- #1 Entrant
- #30 Entrant
- Final Four (4 picks)
- No-Show

**Women's Tab**:
- Same structure as Men's

**Chaos Tab**:
- Men's 6 Chaos Props (YES/NO)
- Women's 6 Chaos Props (YES/NO)

### 3. Points Badge Enhancement

Keep the header points display but make it more prominent:
- Larger font size
- Animated pulse when points change
- Show breakdown on tap (optional enhancement)

### 4. State Management

```typescript
const [activeTab, setActiveTab] = useState<string>("matches");

// During event, default to "numbers" tab
useEffect(() => {
  if (partyStatus === "live" && numbers.length > 0) {
    setActiveTab("numbers");
  }
}, [partyStatus, numbers.length]);
```

---

## Pick Categories & Match IDs

**Matches Tab:**
- `undercard_1`, `undercard_2`, `undercard_3`
- `mens_rumble_winner`, `womens_rumble_winner`

**Men's Props Tab:**
- `mens_first_elimination`
- `mens_most_eliminations`
- `mens_longest_time`
- `mens_entrant_1`
- `mens_entrant_30`
- `mens_final_four_1` through `mens_final_four_4`
- `mens_no_show`

**Women's Props Tab:**
- Same pattern with `womens_` prefix

**Chaos Props Tab:**
- `mens_chaos_prop_1` through `mens_chaos_prop_6`
- `womens_chaos_prop_1` through `womens_chaos_prop_6`

---

## Visual Design

### Bottom Nav Bar
- Background: `bg-background/95 backdrop-blur`
- Border: `border-t border-border`
- Height: ~64px (safe area aware)
- Icons: 24px with label below
- Active state: Primary color with subtle background

### Content Cards
- Each category in a bordered card
- Consistent spacing between items
- Status chips (pending/correct/incorrect)
- Points awarded shown inline

### Points Header
- Large number with animated transitions
- Rank badge below
- Optional: Tap to show score breakdown

---

## File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/BottomNavBar.tsx` | New component for tab navigation |
| `src/components/dashboard/PicksSection.tsx` | New component for grouped picks display |
| `src/pages/PlayerDashboard.tsx` | Refactor to use tabs, add bottom nav, adjust layout |

---

## Mobile-First Considerations

- Bottom nav in "thumb zone" for easy one-handed use
- 44px minimum tap targets on all interactive elements
- Safe area insets for iOS devices (`pb-safe` or `env(safe-area-inset-bottom)`)
- Content area scrollable with bottom padding to clear nav bar
- No horizontal scrolling within tabs

---

## Technical Notes

### CSS for Bottom Nav Fixed Positioning
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.content-area {
  padding-bottom: 80px; /* Height of nav + buffer */
}
```

### Pick Grouping Logic
```typescript
const getPicksForTab = (tab: string, picks: Pick[]) => {
  const matchIds = TAB_MATCH_IDS[tab] || [];
  return picks.filter(p => matchIds.includes(p.match_id));
};
```
