

# Implementation Plan: Final Four, Iron Man/Woman Bonuses & UI Fixes

## Overview
This plan implements automatic bonus calculations with visual celebrations during the Rumble, and fixes the Join Party modal being cut off on mobile screens.

---

## Part 1: Fix Join Party Modal Position

### Problem
The modal uses `fixed top-1/2` positioning which can cause the input fields to be cut off on smaller screens or when the keyboard is open.

### Solution
Adjust the modal positioning to use a safer position that accounts for the viewport and adds proper scrolling.

### File Changes
- **src/components/JoinPartyModal.tsx**
  - Change positioning from `top-1/2 -translate-y-1/2` to `top-20` with max-height and overflow handling
  - Add safe area padding for mobile devices

---

## Part 2: Final Four Automatic Bonus Calculation

### How It Works
When the number of active wrestlers in a Rumble drops to exactly 4, automatically award +10 points to each owner of those 4 numbers.

### Technical Approach
1. After each elimination in `HostControl.tsx`, check the count of active wrestlers
2. When count equals 4:
   - Get the 4 remaining numbers and their owners
   - Award +10 points to each owner (skip Vacant numbers)
   - Show a toast notification: "Final Four bonus awarded!"
   - Broadcast a celebration event to TV display

### File Changes
- **src/pages/HostControl.tsx**
  - Add `checkFinalFour()` function after elimination confirmation
  - Track which Rumbles have already awarded Final Four (prevent double-awarding)
  - Award points and show toast

- **src/pages/TvDisplay.tsx**
  - Add new overlay type for "Final Four" celebration
  - Display dramatic animation showing the 4 remaining wrestlers and their owners
  - Add gold confetti/glow effect

- **src/pages/PlayerDashboard.tsx**
  - Listen for Final Four events and show celebration if player's number is in the Final Four

---

## Part 3: Iron Man/Woman Automatic Bonus Calculation

### How It Works
When a Rumble ends (1 wrestler remaining), calculate which wrestler lasted the longest from their entry time to elimination (or current time for the winner). Award +20 points to that number's owner.

### Technical Approach
1. Add a "Declare Winner" flow in Host Control when only 1 active wrestler remains
2. On winner declaration:
   - Calculate duration for all wrestlers: `elimination_timestamp - entry_timestamp`
   - For the winner, use current time instead of elimination
   - Find the wrestler with the longest duration
   - Award +20 pts to the Iron Man/Woman number's owner
   - Award +50 pts to the winner's number owner
   - Award +50 pts to all players who picked the winner

### File Changes
- **src/pages/HostControl.tsx**
  - Detect when only 1 wrestler remains
  - Show "Declare Winner" button/modal
  - `calculateIronMan()` function to find longest duration
  - Award all Rumble-end bonuses (Iron Man +20, Winner +50, Picker +50)

- **src/pages/TvDisplay.tsx**
  - Add "Winner" overlay with dramatic reveal
  - Add "Iron Man/Woman" celebration overlay showing longest survivor

- **src/pages/PlayerDashboard.tsx**
  - Show celebration if player owns the winner or Iron Man number

---

## Part 4: Celebration Overlay Component

### Create Reusable Celebration Component
A shared component for displaying bonus/achievement celebrations across all views.

### File to Create
- **src/components/CelebrationOverlay.tsx**
  - Props: `type` (final-four | iron-man | winner), `data` (relevant info), `onComplete`
  - Animated overlay with gold shimmer effects
  - Auto-dismiss after 5 seconds
  - Different layouts for each celebration type

---

## Detailed Technical Implementation

### 1. JoinPartyModal.tsx Changes
```text
- Change modal container positioning:
  - From: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
  - To: "fixed inset-x-0 top-0 flex items-start justify-center pt-20 overflow-y-auto max-h-screen"
- Add padding-bottom for safe area on mobile
```

### 2. HostControl.tsx - Final Four Logic
```text
Add state:
- finalFourAwarded: { mens: boolean, womens: boolean }

Add function checkFinalFour(type: 'mens' | 'womens'):
- Get active wrestlers count
- If count === 4 and not already awarded for this type:
  - Get the 4 active numbers
  - For each number with an owner:
    - Fetch player's current points
    - Add SCORING.FINAL_FOUR (+10)
    - Update player
  - Set finalFourAwarded[type] = true
  - Show toast with player names
  - Trigger celebration overlay broadcast
```

### 3. HostControl.tsx - Winner Declaration
```text
Add function handleDeclareWinner(type: 'mens' | 'womens'):
- Get the single remaining active wrestler
- Calculate Iron Man:
  - For all numbers that entered (entry_timestamp exists):
    - Duration = (elimination_timestamp || now) - entry_timestamp
  - Find max duration
  - Award +20 to that number's owner
- Award +50 to winner's number owner
- Award +50 to all players who picked this wrestler
- Record match result (mens_rumble_winner or womens_rumble_winner)
- Mark Rumble as complete
- Trigger winner celebration overlay
```

### 4. CelebrationOverlay.tsx
```text
Component displays:
- Final Four: "FINAL FOUR!" with 4 wrestler cards showing name + owner
- Iron Man: "IRON MAN/WOMAN!" with wrestler name, duration, owner
- Winner: "WINNER!" with wrestler name, number, owner
- All include gold shimmer animation and auto-dismiss
```

### 5. TvDisplay.tsx Updates
```text
Add state:
- showCelebration: { type: string, data: any } | null

Listen for Rumble changes:
- On elimination, check if active count === 4 -> show Final Four
- On winner recorded -> show Winner + Iron Man celebrations

Render CelebrationOverlay when showCelebration is set
```

---

## Scoring Summary

| Event | Points | When Triggered |
|-------|--------|----------------|
| Final Four | +10 per number | Active wrestlers = 4 |
| Iron Man/Woman | +20 | Rumble winner declared |
| Winner Number | +50 | Rumble winner declared |
| Winner Pick | +50 | Rumble winner declared |

---

## Files Modified

1. **src/components/JoinPartyModal.tsx** - Fix positioning
2. **src/components/CelebrationOverlay.tsx** - New component
3. **src/pages/HostControl.tsx** - Add Final Four, Iron Man, Winner logic
4. **src/pages/TvDisplay.tsx** - Add celebration overlays
5. **src/pages/PlayerDashboard.tsx** - Add celebration displays

---

## User Experience Flow

1. **Final Four**: As eliminations happen and 4 remain, all screens show a brief "FINAL FOUR!" celebration with the 4 wrestlers highlighted. Owners get +10 points each.

2. **Winner Declaration**: When 1 wrestler remains, host sees a "Declare Winner" prompt. Upon confirmation:
   - TV shows dramatic winner reveal animation
   - Iron Man/Woman celebration follows (longest survivor)
   - Points are distributed automatically
   - All player dashboards update with celebrations if they won bonuses

