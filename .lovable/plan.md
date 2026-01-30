
## Streamlined Pick Editing and Visual Improvements

This plan implements three improvements to enhance the pick editing experience across the app.

---

### Changes Overview

| Area | Change |
|------|--------|
| Chaos Props | Show title + explanation expanded by default (remove toggle) |
| Edit Picks Button | Remove from dashboard - users edit inline only |
| Undercard Match Picker | Replace text buttons with visual Face-Off style |

---

### 1. Chaos Props - Always Show Explanation

**File:** `src/components/dashboard/UnifiedChaosTab.tsx`

Remove the `expandedProp` state and the toggle mechanism. Show both title and question (explanation) on all screen sizes in a consistent layout.

- Remove `useState` for `expandedProp`
- Remove the `toggleExpand` function
- Remove the `Info` icon button and tooltip wrapper
- Display title and question in a stacked layout for all viewports
- Use `text-xs` for the question to keep it compact while visible

---

### 2. Remove Edit Picks Button

**File:** `src/pages/PlayerDashboard.tsx`

Remove both instances of the "Edit Picks" button:

1. **Pre-event banner** (lines 549-555): Remove the `Link` and `Button` component that navigates to `/player/picks/{code}`
2. **Fixed bottom actions** (lines 619-626): Remove the "Edit Picks" button from the bottom action bar, leaving only the "TV Mode" button

The dashboard already supports inline editing via the pencil icon on each pick row - this becomes the only way to edit picks.

---

### 3. Visual Undercard Match Picker

**File:** `src/components/dashboard/SinglePickEditModal.tsx`

Replace the plain text buttons for undercard matches with a visual Face-Off style picker featuring wrestler photos.

Current implementation:
```typescript
// Binary options - plain text buttons
{config.options.map((option) => (
  <button className="w-full p-4 rounded-xl border-2 text-left font-semibold">
    <span>{option}</span>
  </button>
))}
```

New implementation:
- Display wrestler photos (72px circles) with names
- Two stacked buttons with a centered "VS" badge between them
- Selection state with primary border glow and checkmark overlay
- Uses existing `getWrestlerImageUrl` utility for photos
- Auto-save on selection (no Cancel/Save buttons needed)

---

### Technical Details

#### UnifiedChaosTab - Simplified Layout

```typescript
// Remove expandedProp state entirely
// Replace mobile/desktop conditional with unified layout:
<td className="px-3 py-2.5">
  <div>
    <div className="text-sm font-medium text-foreground">{prop.title}</div>
    <div className="text-xs text-muted-foreground leading-tight mt-0.5">
      {prop.question}
    </div>
  </div>
</td>
```

#### SinglePickEditModal - Visual Match Picker

```typescript
// Binary options with wrestler photos
if (config.type === "binary") {
  const handleSelect = (option: string) => {
    onSave(matchId, option);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 relative">
          {config.options.map((option, index) => (
            <Fragment key={option}>
              <button
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full p-3 rounded-xl border-2 flex items-center gap-4 transition-all",
                  currentPick === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img
                  src={getWrestlerImageUrl(option)}
                  className="w-[72px] h-[72px] rounded-full object-cover border-2"
                />
                <span className="text-lg font-bold">{option}</span>
                {currentPick === option && <Check />}
              </button>
              {index === 0 && (
                <div className="flex justify-center py-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/50 flex items-center justify-center">
                    <span className="text-sm font-black text-primary">VS</span>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/UnifiedChaosTab.tsx` | Remove toggle state, show explanation always |
| `src/pages/PlayerDashboard.tsx` | Remove both Edit Picks buttons |
| `src/components/dashboard/SinglePickEditModal.tsx` | Add visual Face-Off style for undercard matches |

---

### User Flow After Changes

1. **Chaos Props**: Users see both prop title and explanation immediately - no tap required
2. **Editing Picks**: Users tap directly on any pick row to open its edit modal
3. **Undercard Matches**: Users see wrestler photos in the edit modal, tap to select and auto-save
