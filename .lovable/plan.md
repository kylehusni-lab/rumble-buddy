

# Update Features Section with 4 Core Features

## Overview

Replace the current 2-feature grid with 4 features that accurately represent the app's value propositions. The inaccurate "Real-time Updates" will be replaced with "Watch at Your Pace" to reflect the host-driven scoring model.

---

## New Features List

| # | Title | Icon | Description |
|---|-------|------|-------------|
| 1 | **Solo Mode** | `User` | Play by yourself - make picks and score your own match without a group. |
| 2 | **Party Mode** | `Users` | Host a watch party with up to 9 friends and compete on a live leaderboard. |
| 3 | **Watch at Your Pace** | `Clock` (or `Pause`) | Host controls scoring, so it works whether you're live or slightly behind. |
| 4 | **TV Display Mode** | `Tv` | Cast to your big screen so everyone can follow along. |

---

## Layout Update

**Current**: 2-column grid, max-width 2xl (centered)

**New**: 2x2 grid on desktop, stacked on mobile

```text
+----------------------+----------------------+
|     Solo Mode        |     Party Mode       |
+----------------------+----------------------+
|  Watch at Your Pace  |   TV Display Mode    |
+----------------------+----------------------+
```

### Grid Classes
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
```

Expanding from `max-w-2xl` to `max-w-3xl` gives the 4 cards more breathing room.

---

## Code Changes

**File: `src/components/home/FeaturesSection.tsx`**

### 1. Update imports
```tsx
import { User, Users, Clock, Tv } from "lucide-react";
```

### 2. Replace features array
```tsx
const features = [
  {
    icon: User,
    title: "Solo Mode",
    description: "Play by yourself - make picks and score your own match without a group.",
  },
  {
    icon: Users,
    title: "Party Mode",
    description: "Host a watch party with up to 9 friends and compete on a live leaderboard.",
  },
  {
    icon: Clock,
    title: "Watch at Your Pace",
    description: "Host controls scoring, so it works whether you're live or slightly behind.",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    description: "Cast to your big screen so everyone can follow along.",
  },
];
```

### 3. Update grid container
Change `max-w-2xl` to `max-w-3xl` for better spacing with 4 items:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
```

---

## Visual Preview

**Mobile (375px)**:
```text
+----------------------------------+
|  FEATURES                        |
|  Built for the big night         |
+----------------------------------+

+----------------------------------+
|  [User Icon]                     |
|  Solo Mode                       |
|  Play by yourself - make picks   |
|  and score your own match...     |
+----------------------------------+

+----------------------------------+
|  [Users Icon]                    |
|  Party Mode                      |
|  Host a watch party with up to   |
|  9 friends and compete...        |
+----------------------------------+

+----------------------------------+
|  [Clock Icon]                    |
|  Watch at Your Pace              |
|  Host controls scoring, so it    |
|  works whether you're live...    |
+----------------------------------+

+----------------------------------+
|  [TV Icon]                       |
|  TV Display Mode                 |
|  Cast to your big screen so      |
|  everyone can follow along.      |
+----------------------------------+
```

**Desktop (1024px+)**:
```text
+------------------+------------------+
|  Solo Mode       |  Party Mode      |
+------------------+------------------+
|  Watch at Your   |  TV Display      |
|  Pace            |  Mode            |
+------------------+------------------+
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/home/FeaturesSection.tsx` | Update imports, replace features array, expand grid max-width |

---

## Testing Checklist

1. View Features section on mobile - verify 4 cards stack vertically
2. View Features section on tablet/desktop - verify 2x2 grid layout
3. Confirm icons display correctly for each feature
4. Verify scroll animations trigger on viewport entry

