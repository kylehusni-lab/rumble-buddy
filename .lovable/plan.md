
## Touch-ups and Match Picker Enhancement

### 1. Fix Commented Code in Men's/Women's Tab

The line `// MOBILE: Single-column list with large avatars` on line 65 of `UnifiedRumblePropsTab.tsx` is visible as text because it's not wrapped properly - it's a JavaScript comment inside JSX that renders as visible text.

**File**: `src/components/dashboard/UnifiedRumblePropsTab.tsx`
- Remove the stray comment on line 65

---

### 2. Premium Desktop Container

Add a subtle card background with horizontal padding around the centered content for a more polished desktop feel.

**Files to modify**:
- `src/pages/SoloDashboard.tsx`
- `src/pages/PlayerDashboard.tsx`

**Changes**:
```typescript
// Current
<div className="max-w-2xl mx-auto p-4 pb-32">

// Updated - Add card-like wrapper on larger screens
<div className="max-w-2xl mx-auto p-4 pb-32 md:bg-card/30 md:rounded-2xl md:border md:border-border/50 md:my-4 md:mx-auto md:shadow-lg">
```

This applies a subtle card background, border, and shadow on desktop screens only (md: breakpoint), while mobile remains clean and edge-to-edge.

---

### 3. WWE-Style Diagonal Face-Off Match Picker

Completely redesign the undercard match picker modal with a premium diagonal split layout.

**File**: `src/components/dashboard/SinglePickEditModal.tsx`

**New Design Features**:

| Element | Description |
|---------|-------------|
| **Diagonal Split** | Two triangular territories separated by a diagonal line |
| **Wrestler Zones** | Left-top triangle vs Right-bottom triangle |
| **VS Badge** | Centered at the diagonal collision point with glow effect |
| **Action Poses** | Larger wrestler photos angled toward center |
| **Match Title Header** | Prominent display at top with match type styling |
| **Selection Feedback** | Gold glow border on selected wrestler's territory |

┌──────────────────────────────────┐
│   UNDISPUTED WWE CHAMPIONSHIP    │
│              🏆                   │
├──────────────────────────────────┤
│                                  │
│  DREW          ╱                 │
│  McINTYRE    ╱                   │
│  [photo]   ╱                     │
│  CHAMPION ╱      VS              │
│          ╱                       │
│        ╱         [photo]         │
│      ╱           SAMI            │
│    ╱             ZAYN            │
│                  CHALLENGER      │
│                                  │
├──────────────────────────────────┤
│  [ TAP TO SELECT YOUR PICK ]     │
└──────────────────────────────────┘
+-----------------------------+
```

**Implementation approach**:
- Use CSS `clip-path` to create triangular zones
- Apply diagonal gradient backgrounds (Gold/Amber for top, Green for bottom)
- Center the VS badge at the intersection using absolute positioning
- Add subtle animated glow on the diagonal split line
- Selected wrestler zone gets gold border/highlight
- Fullscreen modal for immersive feel

**CSS Classes to Add** (in `src/index.css`):
```css
/* Diagonal Face-Off Modal */
.diagonal-zone-top {
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 65%);
}

.diagonal-zone-bottom {
  clip-path: polygon(0 65%, 100% 35%, 100% 100%, 0 100%);
}

.diagonal-glow-line {
  /* Subtle glow effect along the split */
  background: linear-gradient(to right, transparent, hsl(var(--primary)/0.5), transparent);
  filter: blur(8px);
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/UnifiedRumblePropsTab.tsx` | Remove stray comment on line 65 |
| `src/pages/SoloDashboard.tsx` | Add premium card wrapper styling for desktop |
| `src/pages/PlayerDashboard.tsx` | Add premium card wrapper styling for desktop |
| `src/components/dashboard/SinglePickEditModal.tsx` | Redesign binary type modal with diagonal WWE-style layout |
| `src/index.css` | Add diagonal face-off CSS classes |

---

### Technical Details

**Diagonal Clip-Path Math**:
The diagonal creates two triangular zones. With a container height of ~400px:
- Top zone: `polygon(0 0, 100% 0, 100% 40%, 0 60%)`
- Bottom zone: `polygon(0 60%, 100% 40%, 100% 100%, 0 100%)`

The percentages create a ~20% overlap zone in the center where the diagonal line sits.

**VS Badge Positioning**:
```typescript
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
  {/* VS Badge with glow */}
</div>
```

**Selection State**:
When a wrestler is selected:
- Their zone background intensifies
- A gold border/glow appears around the zone edge
- The opponent's zone dims slightly (opacity reduction)
- The VS badge pulses briefly
