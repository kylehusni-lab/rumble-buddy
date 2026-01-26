

# Plan: Add Missing Features - Countdown Timer & Event Info

## Overview
The Royal Rumble Party Tracker is nearly complete! After reviewing the codebase against the comprehensive spec, only a few minor features are missing. This plan adds the countdown timer and event venue badge to the landing page.

---

## Current State Analysis

### Already Implemented (Complete)
- Database schema with all 5 tables
- Party creation with 4-digit codes  
- Player join flow with email recovery
- Swipeable 7-card pick flow with framer-motion
- All card types (Match, Rumble Winner with grid, Chaos Props)
- Host setup page with entrant management
- Host control panel with full scoring
- TV display with 30-number grid and leaderboard
- Number distribution algorithm
- All scoring logic (eliminations, Final Four, Iron Man, etc.)
- Realtime subscriptions on all tables
- Number reveal animation (NFL draft style)
- Celebration overlays
- Session management
- Wrestler images with WWE CDN fallbacks
- Official Royal Rumble logo

### Missing Features
1. **Countdown timer on landing page** - Should count down to Feb 1, 2026, 7:00 PM Riyadh time
2. **Event venue badge** - "February 1, 2026 • Kingdom Arena, Riyadh"
3. **EVENT_CONFIG constants** - Centralized event date/venue constants

---

## Files to Modify

### 1. `src/lib/constants.ts`
Add event configuration constants.

```typescript
export const EVENT_CONFIG = {
  DATE: new Date('2026-02-01T19:00:00+03:00'), // Riyadh time (UTC+3)
  VENUE: 'Kingdom Arena',
  LOCATION: 'Riyadh, Saudi Arabia',
  TITLE: 'WWE Royal Rumble 2026',
} as const;
```

### 2. `src/pages/Index.tsx`
Add countdown timer and event venue badge to the landing page.

**New Countdown Component (inline or separate):**
- Shows days, hours, minutes, seconds in styled boxes
- Updates every second using `setInterval`
- Uses tabular-nums for consistent digit width
- Animates individual units

**Event Info Badge:**
- Shows date and venue in a subtle badge below logo
- Uses gold accent styling

---

## Technical Details

### Countdown Timer Logic

```typescript
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

useEffect(() => {
  function calculateTimeRemaining(): TimeRemaining {
    const now = new Date().getTime();
    const distance = EVENT_CONFIG.DATE.getTime() - now;
    
    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  }
  
  setTimeRemaining(calculateTimeRemaining());
  const interval = setInterval(() => {
    setTimeRemaining(calculateTimeRemaining());
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### Visual Layout Changes

```text
Landing Page (Updated):
+---------------------------------------+
|                                       |
|      [ROYAL RUMBLE 2026 LOGO]         |
|      (Party Tracker tagline)          |
|                                       |
|  [February 1, 2026 • Kingdom Arena]   | <- NEW Event Badge
|                                       |
|  +-----+ +-----+ +-----+ +-----+      |
|  | 05  | | 12  | | 34  | | 18  |      | <- NEW Countdown
|  | DAYS| | HRS | | MIN | | SEC |      |
|  +-----+ +-----+ +-----+ +-----+      |
|                                       |
|     [👑 Create Party]                 |
|     [👥 Join Party]                   |
|                                       |
|  Track picks, prop bets & Rumble      |
|  numbers in real-time                 |
+---------------------------------------+
```

---

## Styling

### Countdown Box Styling
```tsx
<div className="bg-card border border-border rounded-xl p-4 min-w-[70px] text-center">
  <div className="text-3xl font-black tabular-nums text-primary">
    {String(value).padStart(2, '0')}
  </div>
  <div className="text-xs text-muted-foreground uppercase tracking-wide">
    {label}
  </div>
</div>
```

### Event Badge Styling
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Calendar size={16} className="text-primary" />
  <span>February 1, 2026 • Kingdom Arena, Riyadh</span>
</div>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/constants.ts` | Add `EVENT_CONFIG` with date, venue, location, title |
| `src/pages/Index.tsx` | Add countdown timer with 4 time units |
| `src/pages/Index.tsx` | Add event venue badge below logo |

---

## Estimated Lines of Code
- `constants.ts` additions: ~8 lines
- `Index.tsx` additions: ~60 lines (countdown logic + JSX)

**Total: ~70 lines of new code**

This completes the implementation to match the full spec!

