

# Remove Match Progress Bar + Make Number Reveal User-Driven

## Overview

Two changes to implement:
1. Remove the MatchProgressBar component from the TV Display header
2. Make the Number Reveal animation fully user-controlled (no auto-timers)

---

## Change 1: Remove MatchProgressBar

### Current State
The TV Display header shows a "Matches: 0 of 9 Complete" progress bar widget with an "UP NEXT" section.

### Action
Remove the MatchProgressBar from the TV Display header entirely.

### File: `src/pages/TvDisplay.tsx`

| Line(s) | Change |
|---------|--------|
| 8 | Remove import for MatchProgressBar |
| 447-450 | Remove the MatchProgressBar wrapper div |

The header will retain just the Logo, party code, and Status indicator.

---

## Change 2: Make Number Reveal User-Driven

### Current Behavior (Automated)

| Phase | Behavior |
|-------|----------|
| Instant | Auto-completes after 3 seconds |
| Dramatic | Auto-advances every 1.5 seconds |
| Complete | Auto-calls onComplete after 1 second |

### New Behavior (User-Driven)

| Phase | New Behavior | User Action |
|-------|--------------|-------------|
| Instant | Shows all players, waits for user | Tap "Continue" button |
| Dramatic | Shows one player, waits for user | Tap card or "Next" button |
| Complete | Shows final message, waits for user | Tap "Let's Go!" button |

### File: `src/components/NumberRevealAnimation.tsx`

**Remove these auto-timer effects:**
- Lines 38-44: Complete phase auto-callback
- Lines 46-54: Instant mode auto-complete
- Lines 56-70: Dramatic mode auto-advance

**Add user action handlers:**
```typescript
const handleNextPlayer = () => {
  if (currentPlayerIndex < players.length - 1) {
    setCurrentPlayerIndex(prev => prev + 1);
  } else {
    setPhase("complete");
  }
};

const handleContinueFromInstant = () => {
  setPhase("complete");
};

const handleFinish = () => {
  onComplete();
};
```

**Update Instant Mode UI** - Add "Continue" button:
```tsx
<Button variant="gold" size="lg" className="mt-6" onClick={handleContinueFromInstant}>
  Continue
</Button>
```

**Update Dramatic Mode UI** - Make clickable + add button:
```tsx
<motion.div onClick={handleNextPlayer} className="cursor-pointer ...">
  {/* Player card */}
  <Button variant="gold" size="lg" className="mt-6" onClick={...}>
    {currentPlayerIndex < players.length - 1 ? "Next Player" : "Finish"}
  </Button>
  <p className="text-sm text-muted-foreground mt-2">Tap anywhere to continue</p>
</motion.div>
```

**Update Complete Phase UI** - Add "Let's Go!" button:
```tsx
<Button variant="gold" size="xl" onClick={handleFinish} className="mt-6">
  Let's Go!
</Button>
```

---

## User Experience Flow

**Instant Mode:**
1. User selects "Instant Reveal"
2. All player numbers appear
3. User reviews at their own pace
4. User taps "Continue"
5. "LET'S RUMBLE!" screen
6. User taps "Let's Go!" to exit

**Dramatic Mode:**
1. User selects "Dramatic Reveal"
2. First player's numbers appear
3. User taps card or "Next Player"
4. Repeat for each player
5. Last player → tap "Finish"
6. "LET'S RUMBLE!" screen
7. User taps "Let's Go!" to exit

---

## Summary of Files

| File | Change |
|------|--------|
| `src/pages/TvDisplay.tsx` | Remove MatchProgressBar import and usage |
| `src/components/NumberRevealAnimation.tsx` | Remove auto-timers, add user control buttons |

