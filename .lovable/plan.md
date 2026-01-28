
# Streamline Edit Modal Flow

## Overview
Simplify the pick editing experience by removing unnecessary intermediate steps for wrestler-based picks and chaos props.

## Current Flow (Problem)
- **Wrestler picks** (Rumble Winner, Rumble Props, Final Four): User clicks pencil → sees intermediate dialog with current value → taps "Select wrestler" button → WrestlerPickerModal opens → selects wrestler → closes picker → clicks Save
- **Chaos Props**: Opens dialog → select YES/NO → clicks Save

## Proposed Flow (Solution)
- **Wrestler picks**: User clicks pencil → WrestlerPickerModal opens directly → selects wrestler → auto-saves and closes
- **Chaos Props**: User clicks pencil → simple dialog with just YES/NO buttons → taps YES or NO → auto-saves and closes (no Save button needed)

## File to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/SinglePickEditModal.tsx` | Refactor wrestler and chaos prop flows |

## Technical Changes

### Wrestler Picker (Rumble Winner, Rumble Props, Final Four)
- Skip the intermediate dialog entirely
- Open `WrestlerPickerModal` immediately when `isOpen` is true
- On wrestler selection, call `onSave()` directly and close

### Chaos Props (YES/NO)
- Remove the Cancel/Save buttons
- Auto-save when user taps YES or NO
- Simpler, faster interaction

### Code Changes

**For wrestler type:**
```tsx
if (config.type === "wrestler") {
  return (
    <WrestlerPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={(wrestler) => {
        onSave(matchId, wrestler);
        onClose();
      }}
      title={config.title}
      wrestlers={config.entrants}
      triggerConfetti={false}
    />
  );
}
```

**For chaos props (yesno):**
```tsx
if (config.type === "yesno") {
  const handleSelect = (option: string) => {
    onSave(matchId, option);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3 py-4">
          {["YES", "NO"].map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 text-center font-bold text-lg transition-all",
                currentPick === option
                  ? option === "YES"
                    ? "border-success bg-success/10 text-success"
                    : "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-card hover:border-muted-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Result
- **Wrestler picks**: 2 taps instead of 4 (pencil → wrestler = done)
- **Chaos props**: 2 taps instead of 3 (pencil → YES/NO = done)
- More intuitive, faster editing experience
