
# Consolidate Chaos Props into Single Table

## Current State
The Chaos Props display shows **two separate sections** - one for Men's and one for Women's - each listing the same 6 props vertically with your YES/NO picks. This takes up a lot of vertical space.

## Proposed Change
Create a **single unified table** with the 6 Chaos Props as rows and columns for:
- Prop Name
- Men's Pick (with result indicator)
- Women's Pick (with result indicator)

This cuts the vertical space in half and makes it easy to compare picks across both Rumbles at a glance.

## Visual Layout

```text
+-------------------+------------+------------+
| Chaos Prop        | Men's Pick | Women's Pick|
+-------------------+------------+------------+
| Kofi/Logan Save   |   YES ✓    |   NO       |
| Bushwhacker Exit  |   NO ✗     |   YES ✓    |
| Friendly Fire     |   YES      |   YES      |
| ...               |   ...      |   ...      |
+-------------------+------------+------------+
```

## Files to Update

### 1. SoloDashboard.tsx - ChaosTab Component (lines 414-469)
Replace the current implementation that loops through genders separately with a unified table:
- Single table with prop name in first column
- Men's pick in second column (with green/red styling for correct/incorrect)
- Women's pick in third column
- Show result status inline with colored checkmarks/X marks

### 2. ChaosPropsSection.tsx (Dashboard component for Group mode)
Apply the same unified table approach:
- Combine the two separate card sections into one table
- Prop name | Men's YES/NO + status | Women's YES/NO + status

## Technical Details

**Table Structure:**
- Header row: "Chaos Prop" | "Men's" | "Women's"
- 6 data rows (one per prop)
- Each cell shows: pick value (YES/NO) + result indicator (✓/✗) + points if correct
- Color-coded backgrounds: `bg-success/10` for correct, `bg-destructive/10` for wrong, neutral otherwise
- Responsive design: table fits well on mobile with compact cell padding

**Match ID Pattern:**
- Men's: `mens_chaos_prop_{1-6}`
- Women's: `womens_chaos_prop_{1-6}`

Both will iterate over the same `CHAOS_PROPS` array and look up results from both genders in each row.
