

## Plan: Host Control Scoring UX Improvements

This plan addresses four key improvements to make the host control panel work better as a second-screen experience during live viewing.

---

### 1. Replace Text Override with Wrestler Picker

**Current State**: When overriding an auto-detected prop value, hosts type into a plain text input field.

**Change**: Replace the text input with the existing `WrestlerPickerModal` component for a visual wrestler selection experience.

**Files to Modify**:
- `src/components/host/RumblePropScoringCard.tsx`
  - Add state for wrestler picker modal
  - Pass the `availableWrestlers` prop (already defined in interface but unused)
  - Replace the override `<Input>` and submit button with a button that opens `WrestlerPickerModal`
  - On wrestler selection, call `onScore` with the selected name

---

### 2. Final Four Props Scoring with Confirmation

**Current State**: The "Auto-Score Final Four Predictions" button immediately scores all 4 slots without confirmation.

**Issue**: The scoring logic compares picks slot-by-slot rather than checking if a player picked any of the actual Final Four wrestlers regardless of which slot they used.

**Changes**:
- Add a confirmation dialog before auto-scoring Final Four that shows:
  - The 4 wrestlers detected as Final Four
  - How many correct predictions will be awarded
- Update scoring logic to check if a player's Final Four pick (any slot) matches any of the actual Final Four wrestlers
  
**Files to Modify**:
- `src/pages/HostControl.tsx`
  - Add confirmation modal state
  - Create new `handleScoreFinalFourWithConfirmation` function that:
    1. Shows a confirmation dialog with the detected Final Four wrestlers
    2. Previews how many players will receive points
    3. On confirmation, scores by checking if each player's picks (across all 4 slots) match any of the final four wrestlers

---

### 3. Remove Celebration Overlays from TV Display

**Current State**: The TV Display shows full-screen celebration overlays for Final Four and Winner events that interrupt live viewing.

**User Request**: Since this is a second screen for watching alongside TV, the large animations are disruptive.

**Change**: Remove the `CelebrationOverlay` component usage from TvDisplay entirely. The activity ticker at the bottom already shows these events.

**Files to Modify**:
- `src/pages/TvDisplay.tsx`
  - Remove `CelebrationOverlay` import
  - Remove `celebration` state and related logic
  - Remove `shownCelebrations` ref
  - Remove the `setCelebration` calls in realtime handlers
  - Remove the `AnimatePresence` block rendering `CelebrationOverlay`

---

### 4. Remove Scoreboard Navigation from Winner Declaration

**Current State**: After confirming a winner, the modal closes but the view stays in place.

**Verification**: Looking at `handleConfirmWinner`, it already just closes the modal without navigation (`setWinnerData(null)`). No redirect exists currently.

**Action**: No code changes needed - confirmed behavior is already correct.

---

### Technical Summary

| Component | Change |
|-----------|--------|
| `RumblePropScoringCard.tsx` | Add `WrestlerPickerModal` for override selection |
| `HostControl.tsx` | Add Final Four confirmation dialog with scoring preview |
| `TvDisplay.tsx` | Remove `CelebrationOverlay` entirely |

### Implementation Order
1. Update `RumblePropScoringCard` with wrestler picker
2. Add Final Four confirmation dialog to `HostControl`
3. Remove celebration overlays from `TvDisplay`
4. Test the full scoring workflow end-to-end

