

## Fix: WWE Face-Off Match Picker Layout

### Current Issues

Looking at the screenshot:
1. **VS badge overlaps Drew McIntyre's zone** - The `h-0` container causes the VS badge to float on top of the first wrestler
2. **No clear separation** - The divider doesn't create a visual break between the two zones
3. **Unbalanced feel** - Top wrestler bleeds into the VS area

---

### Solution: Proper Divider Row

Replace the `h-0` floating approach with a dedicated divider row that has its own height and properly separates the two zones.

**File**: `src/components/dashboard/SinglePickEditModal.tsx`

---

### Proposed Layout Structure

```text
+--------------------------------+
|    MATCH TITLE HEADER          |
|    "Tap a wrestler to select"  |
+--------------------------------+
|                                |
|  [Photo]  DREW MCINTYRE        |
|           Tap to select        |
|                                |
+--------------------------------+
|    ~~~~~ [ VS ] ~~~~~          |  <-- Dedicated row with padding
+--------------------------------+
|                                |
|        SAMI ZAYN     [Photo]   |
|        Tap to select           |
|                                |
+--------------------------------+
```

---

### Key Changes

**1. Replace the floating `h-0` divider with a proper section:**

```typescript
// CURRENT (broken)
<div className="relative h-0 flex items-center justify-center z-10">
  ...
</div>

// FIXED - Give the VS divider its own row with padding
<div className="relative py-2 flex items-center justify-center z-10">
  <div className="absolute inset-x-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent top-1/2" />
  <div className="vs-badge-glow rounded-full relative z-20">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 ...">
      <span>VS</span>
    </div>
  </div>
</div>
```

**2. Adjust wrestler zone padding:**
- Reduce vertical padding from `py-6` to `py-4` to keep modal compact
- Add slight bottom/top padding overlap with the VS area

**3. Shrink the VS badge slightly:**
- Reduce from `w-14 h-14` to `w-12 h-12` for better proportion
- Keep the glow effect but make it less dominant

---

### Visual Comparison

| Before | After |
|--------|-------|
| VS floats over Drew's zone | VS sits in dedicated row |
| `h-0` creates overlap | `py-2` creates separation |
| Zones feel merged | Clear separation between zones |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/SinglePickEditModal.tsx` | Fix VS divider positioning from `h-0` to `py-2`, adjust sizing |

---

### Technical Details

The fix changes line 167-174:

```typescript
// Current broken approach
<div className="relative h-0 flex items-center justify-center z-10">

// Fixed approach with dedicated row
<div className="relative py-3 flex items-center justify-center">
  {/* Horizontal glow line */}
  <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
  
  {/* VS Badge - properly centered in its own row */}
  <div className="relative z-10 vs-badge-glow rounded-full">
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-3 border-card shadow-lg">
      <span className="text-sm font-black text-primary-foreground">VS</span>
    </div>
  </div>
</div>
```

This gives the VS badge its own visual space while the glow line creates continuity between the zones.

