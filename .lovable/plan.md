

# Solo Dashboard UI Fixes

## Issues from Screenshot

| Issue | Current State | Fix |
|-------|--------------|-----|
| **Duplicate Progress Bar** | `CompactPickProgress` component adds redundant thumbnails below score card (already shows completion in tab bar) | Remove `CompactPickProgress` entirely |
| **Blurry Photos** | 56px photos (w-14 h-14) are too small and appear blurry | Increase to 64px (w-16 h-16) on mobile |
| **Redundant Headers** | "Undercard Matches" and "Rumble Winners" headers when tab already indicates content | Remove section headers from all tabs |
| **Tap to Select Broken** | Button has `disabled` attribute blocking clicks when `canEdit` is false or result exists | Remove `disabled` attribute, handle click logic properly |
| **No Clear Edit Indicator** | When pick IS made, not obvious you can tap to change | Add pencil icon visible on selected items |

---

## Detailed Fixes

### 1. Remove `CompactPickProgress` Component

Delete lines 192-198 in the Score Card that render the progress component:
```typescript
// REMOVE THIS BLOCK
<CompactPickProgress 
  picks={picks}
  tabCompletion={tabCompletion}
  onTabClick={setActiveTab}
/>
```

Also remove the entire `CompactPickProgress` component definition (lines 316-413).

---

### 2. Increase Photo Size for Clarity

Change avatar sizes from `w-14 h-14` (56px) to `w-16 h-16` (64px):

**MatchesTab** (line 459):
```typescript
// Before
"w-14 h-14 rounded-full"

// After
"w-16 h-16 rounded-full"
```

**RumbleTab mobile** (line 612):
```typescript
// Before
"w-14 h-14 rounded-full"

// After  
"w-16 h-16 rounded-full"
```

Also update the empty circle placeholder to match:
```typescript
// Before
"w-14 h-14 rounded-full border-2 border-dashed"

// After
"w-16 h-16 rounded-full border-2 border-dashed"
```

---

### 3. Remove Redundant Section Headers

**MatchesTab** - Remove lines 522 and 535:
```typescript
// REMOVE
<h3 className="text-lg font-bold text-foreground mb-4">Undercard Matches</h3>

// REMOVE
<h3 className="text-lg font-bold text-foreground mt-6 mb-4">Rumble Winners</h3>
```

**RumbleTab** - Remove line 578:
```typescript
// REMOVE
<h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
```

---

### 4. Fix Tappability - Remove `disabled` Attribute

The `disabled` attribute on buttons blocks all clicks. Instead, handle logic inside onClick:

**MatchesTab MatchRow** (lines 440-443):
```typescript
// Before
<button
  onClick={() => canEdit && !result && onEditPick?.(id, pick || "")}
  disabled={!canEdit || !!result}
  
// After
<button
  onClick={() => {
    if (canEdit && !result) {
      onEditPick?.(id, pick || "");
    }
  }}
  // Remove disabled entirely
```

**RumbleTab mobile** (lines 592-595):
```typescript
// Before
<button
  onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
  disabled={!canEdit || !!result}

// After
<button
  onClick={() => {
    if (canEdit && !result) {
      onEditPick?.(matchId, pick || "");
    }
  }}
  // Remove disabled entirely
```

---

### 5. Clear Edit Indicator for Selected Items

When a pick IS made and is editable, show a pencil icon clearly on the right:

**MatchesTab** - Update right side section (lines 506-515):
```typescript
{/* Right side - edit indicator or points */}
<div className="flex-shrink-0 flex items-center gap-2">
  {isCorrect && (
    <span className="text-xs font-bold text-success bg-success/20 px-2 py-1 rounded">
      +{points}
    </span>
  )}
  {canEdit && !result && (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Pencil size={14} />
      <ChevronRight size={16} />
    </div>
  )}
</div>
```

**RumbleTab mobile** - Update right side (lines 654-663):
```typescript
{/* Right side - edit indicator or points */}
<div className="flex-shrink-0 flex items-center gap-2">
  {isCorrect && (
    <span className="text-xs font-bold text-success bg-success/20 px-2 py-1 rounded">
      +{points}
    </span>
  )}
  {canEdit && !result && (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Pencil size={14} />
      <ChevronRight size={16} />
    </div>
  )}
</div>
```

---

### 6. Remove "Tap to select" Text for Empty States

Replace with simpler point hint:

**MatchesTab** (line 496):
```typescript
// Before
{pick ? getEntrantDisplayName(pick) : "Tap to select"}

// After
{pick ? getEntrantDisplayName(pick) : `+${points} pts`}
```

**RumbleTab** (line 649):
```typescript
// Before
{pick ? getEntrantDisplayName(pick) : "Tap to select"}

// After
{pick ? getEntrantDisplayName(pick) : `+${points} pts`}
```

---

## Visual Before/After

**Before:**
```text
+--------------------------------------+
|  Undercard Matches                   |  <-- Redundant header
+--------------------------------------+
| [56px blurry]  Drew vs Sami      [>] |
|                Tap to select         |
+--------------------------------------+
| [CompactPickProgress bar below]      |  <-- Duplicate progress
+--------------------------------------+
```

**After:**
```text
+--------------------------------------+
| [64px clear]  Drew vs Sami   [P] [>] |  <-- Pencil + chevron
|                +25 pts               |  <-- Point hint
+--------------------------------------+
```

---

## Files to Change

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Remove `CompactPickProgress` render and component; Remove section headers; Increase photo sizes to 64px; Remove `disabled` from buttons; Add pencil+chevron for editable items; Replace "Tap to select" with point hints |

---

## Testing Checklist

1. Verify compact progress bar no longer appears below score card
2. Verify wrestler photos are larger (64px) and clearer
3. Verify no "Undercard Matches" or "Rumble Winners" headers appear
4. Tap an empty prop row - verify WrestlerPickerModal opens
5. Verify selected items show pencil + chevron icons on right
6. Tap a selected item - verify modal opens to change pick
7. Verify empty items show "+X pts" instead of "Tap to select"

