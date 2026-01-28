
# Add Pick Completion Indicators to Solo Dashboard Tabs

This plan adds visual badges showing "X/Y" completion status on each tab in the Solo Dashboard, giving users a quick overview of their progress.

---

## Summary

Add small completion badges beneath each tab label showing how many picks are complete out of the total for that category. Badges will turn green when all picks in a tab are complete.

---

## Visual Design

Each tab will show:
- The existing icon and label
- A small badge below showing completion (e.g., "3/5")
- Badge turns green with a checkmark when 100% complete

```
┌─────────┬─────────┬─────────┬─────────┐
│ Swords  │   #     │    #    │   Zap   │
│ Matches │  Men's  │ Women's │  Chaos  │
│  (3/5)  │  (9/9)  │  (7/9)  │ (10/12) │
│         │   ✓     │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

---

## Changes Overview

### File: `src/pages/SoloDashboard.tsx`

**1. Add a completion calculation function**

Create a `useMemo` hook that calculates completion counts for each tab:

- **Matches Tab**: 3 undercard matches + 2 rumble winners = 5 total picks
- **Men's Tab**: 5 rumble props + 4 final four = 9 total picks  
- **Women's Tab**: 5 rumble props + 4 final four = 9 total picks
- **Chaos Tab**: 6 men's chaos + 6 women's chaos = 12 total picks

```tsx
const tabCompletion = useMemo(() => {
  const matchCards = CARD_CONFIG.filter(c => c.type === "match");
  const matchesComplete = matchCards.filter(c => picks[c.id]).length;
  const winnersComplete = (picks["mens_rumble_winner"] ? 1 : 0) + 
                          (picks["womens_rumble_winner"] ? 1 : 0);
  
  // Men's: 5 props + 4 final four
  let mensComplete = 0;
  RUMBLE_PROPS.forEach(prop => {
    if (picks[`mens_${prop.id}`]) mensComplete++;
  });
  for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
    if (picks[`mens_final_four_${i}`]) mensComplete++;
  }
  
  // Women's: same structure
  let womensComplete = 0;
  RUMBLE_PROPS.forEach(prop => {
    if (picks[`womens_${prop.id}`]) womensComplete++;
  });
  for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
    if (picks[`womens_final_four_${i}`]) womensComplete++;
  }
  
  // Chaos: 6 props x 2 genders
  let chaosComplete = 0;
  ["mens", "womens"].forEach(gender => {
    CHAOS_PROPS.forEach((_, i) => {
      if (picks[`${gender}_chaos_prop_${i + 1}`]) chaosComplete++;
    });
  });
  
  return {
    matches: { complete: matchesComplete + winnersComplete, total: 5 },
    mens: { complete: mensComplete, total: 9 },
    womens: { complete: womensComplete, total: 9 },
    chaos: { complete: chaosComplete, total: 12 },
  };
}, [picks]);
```

**2. Update the tabs array to include completion data**

Modify the tabs configuration to reference the completion stats:

```tsx
const tabs = [
  { id: "matches" as const, icon: Swords, label: "Matches" },
  { id: "mens" as const, icon: Hash, label: "Men's" },
  { id: "womens" as const, icon: Hash, label: "Women's" },
  { id: "chaos" as const, icon: Zap, label: "Chaos" },
];
```

**3. Update the tab button rendering**

Add completion badge display with conditional styling:

```tsx
{tabs.map((tab) => {
  const completion = tabCompletion[tab.id];
  const isComplete = completion.complete === completion.total;
  
  return (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-2 transition-colors relative ${
        activeTab === tab.id
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <tab.icon className="w-4 h-4" />
      <span className="text-xs font-medium">{tab.label}</span>
      <span className={`text-[10px] font-medium ${
        isComplete 
          ? "text-success" 
          : "text-muted-foreground"
      }`}>
        {isComplete ? (
          <span className="flex items-center gap-0.5">
            <Check className="w-3 h-3" />
            {completion.complete}/{completion.total}
          </span>
        ) : (
          `${completion.complete}/${completion.total}`
        )}
      </span>
      {activeTab === tab.id && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );
})}
```

**4. Import Check icon**

Add `Check` to the lucide-react imports at the top of the file.

---

## Technical Details

### Pick ID Structure Reference

| Tab | Pick IDs | Total |
|-----|----------|-------|
| Matches | `undercard_1`, `undercard_2`, `undercard_3`, `mens_rumble_winner`, `womens_rumble_winner` | 5 |
| Men's | `mens_entrant_1`, `mens_entrant_30`, `mens_first_elimination`, `mens_most_eliminations`, `mens_longest_time`, `mens_final_four_1-4` | 9 |
| Women's | `womens_entrant_1`, `womens_entrant_30`, `womens_first_elimination`, `womens_most_eliminations`, `womens_longest_time`, `womens_final_four_1-4` | 9 |
| Chaos | `mens_chaos_prop_1-6`, `womens_chaos_prop_1-6` | 12 |

### Files Modified

- `src/pages/SoloDashboard.tsx` - Add completion calculation and badge rendering

---

## Implementation Notes

- Uses `useMemo` for efficient recalculation only when picks change
- Badge styling uses existing design tokens (text-success, text-muted-foreground)
- Check icon only appears when tab is 100% complete
- Tab height may increase slightly to accommodate the badge - consider reducing icon/label size slightly
