

# Solo Dashboard UI Enhancements

## Issues Identified

Based on the screenshots:

| Issue | Current State | Desired State |
|-------|--------------|---------------|
| **Matches Tab** | Text-only ("Your Pick: Drew McIntyre") | Show wrestler headshot photos alongside text |
| **Rumble Props** | Empty circles with "+" look static | Clear tappable appearance with hover states and "Tap to select" hint |
| **Progress Indicator** | Only tab badges (3/4, 9/9) | Compact visual progress strip with wrestler photo thumbnails |

---

## Solution

### Part 1: Add Wrestler Photos to Matches Tab

Update the `MatchesTab` component to display wrestler headshots for picks.

**Undercard Matches:**
```text
+------------------------------------------------+
| Drew McIntyre vs Sami Zayn                     |
|                                                |
| [56px Photo]  Drew McIntyre      [Check] +25   |
|               Your Pick                        |
+------------------------------------------------+
```

**Rumble Winners:**
```text
+------------------------------------------------+
| Men's Rumble Winner                            |
|                                                |
| [56px Photo]  Brock Lesnar       [Check] +50   |
|               Your Pick                        |
+------------------------------------------------+
```

**Changes to `MatchesTab`:**
- Add wrestler image display (56px circular) for both undercard and rumble winner picks
- Show dashed circle with "+" when no pick is made
- Add image error handling with placeholder fallback

---

### Part 2: Improve Rumble Props Tappability

Make empty prop rows clearly interactive on mobile:

**Before (empty):**
```text
| [+]  #1 ENTRANT                    |
|      +15 pts                       |
```

**After (empty - more inviting):**
```text
| [+]  #1 ENTRANT                [>] |
|      Tap to select                 |
+------------------------------------+
```

**Changes:**
- Add subtle pulsing/breathing animation to empty circles to indicate they're tappable
- Change "+15 pts" to "Tap to select" when no pick exists
- Add a chevron-right icon on the right side to indicate tappability
- Add more prominent hover/active states (border-primary/50 on hover, scale-[0.98] on press)

---

### Part 3: Compact Pick Progress Indicator

Add a visual progress strip below the score card showing wrestler photo thumbnails for completed picks.

**Design:**
```text
+--------------------------------------------------------------------+
|  Hey John!                                               [Trophy]  |
|  125 pts                                                           |
+--------------------------------------------------------------------+
|  Matches [Avatar][Avatar] 2/4  |  Men's [...] 9/9  |  Women's 0/9  |
+--------------------------------------------------------------------+
```

Each category shows:
- Small (28px) circular photo thumbnails of completed picks
- Remaining count badge
- Tappable to navigate to that tab

**New Component: `CompactPickProgress`**

```typescript
const CompactPickProgress = memo(function CompactPickProgress({
  picks,
  tabCompletion,
  onTabClick,
}: {
  picks: Record<string, string>;
  tabCompletion: Record<string, { complete: number; total: number }>;
  onTabClick: (tab: TabType) => void;
}) {
  const groups = [
    { 
      id: "matches" as const, 
      label: "Matches",
      pickKeys: ["undercard_1", "undercard_3", "mens_rumble_winner", "womens_rumble_winner"],
    },
    { 
      id: "mens" as const, 
      label: "Men's",
      pickKeys: [...RUMBLE_PROPS.map(p => `mens_${p.id}`), ...Array.from({length: 4}, (_, i) => `mens_final_four_${i+1}`)],
    },
    { 
      id: "womens" as const, 
      label: "Women's",
      pickKeys: [...RUMBLE_PROPS.map(p => `womens_${p.id}`), ...Array.from({length: 4}, (_, i) => `womens_final_four_${i+1}`)],
    },
  ];

  return (
    <div className="flex gap-2 mt-3">
      {groups.map((group) => {
        const completedPicks = group.pickKeys
          .filter(key => picks[key])
          .slice(0, 3); // Show max 3 thumbnails
        const { complete, total } = tabCompletion[group.id];
        const isComplete = complete === total;

        return (
          <button
            key={group.id}
            onClick={() => onTabClick(group.id)}
            className={cn(
              "flex-1 rounded-lg border p-2 transition-all",
              isComplete 
                ? "border-success/50 bg-success/5" 
                : "border-border bg-muted/30 hover:border-primary/50"
            )}
          >
            {/* Photo Thumbnails Row */}
            <div className="flex items-center gap-1 mb-1">
              {completedPicks.map((key, i) => (
                <img
                  key={key}
                  src={getWrestlerImageUrl(getEntrantDisplayName(picks[key]))}
                  className="w-7 h-7 rounded-full border border-primary/50 object-cover"
                />
              ))}
              {completedPicks.length < complete && (
                <span className="text-[10px] text-muted-foreground">
                  +{complete - completedPicks.length}
                </span>
              )}
            </div>
            
            {/* Label and Count */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                {group.label}
              </span>
              <span className={cn(
                "text-[10px] font-bold",
                isComplete ? "text-success" : "text-muted-foreground"
              )}>
                {isComplete && <Check className="w-3 h-3 inline mr-0.5" />}
                {complete}/{total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Add `CompactPickProgress` component below score card; Update `MatchesTab` to show wrestler photos; Update `RumbleTab` to improve empty state UI with "Tap to select" and chevron icons |

---

## Visual Comparison

**Before (Matches Tab):**
```text
| Drew McIntyre vs Sami Zayn                |
| Your Pick: Drew McIntyre  +25       [V]   |
```

**After (Matches Tab):**
```text
| Drew McIntyre vs Sami Zayn                     |
| [56px]  Drew McIntyre              [V] +25     |
|         Your Pick                              |
```

**Before (Empty Rumble Prop):**
```text
| [+]  #1 ENTRANT                           |
|      +15 pts                              |
```

**After (Empty Rumble Prop):**
```text
| [+]  #1 ENTRANT                      [>]  |
|      Tap to select                        |
```

---

## Testing Checklist

1. Open Solo Dashboard, verify compact progress indicator appears below score card
2. Check that wrestler photo thumbnails appear in the progress indicator for completed picks
3. Tap a progress group to navigate to that tab
4. Go to Matches tab - verify wrestler photos display for undercard and rumble winners
5. Go to Men's/Women's tab - verify empty props show "Tap to select" text and chevron icon
6. Tap an empty prop row - verify WrestlerPickerModal opens
7. Select a wrestler - verify photo appears in the row and progress indicator updates
8. Verify all interactive elements have clear hover/active states

