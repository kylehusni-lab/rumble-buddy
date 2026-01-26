
# PlayerPicks UI/UX Enhancement Plan

## Overview
Transform the player picks page from a basic form layout into a polished, visually engaging experience with wrestler photos, collapsible sections, progress tracking, and celebratory animations.

---

## Part 1: Install Dependencies

### New Package Required
- **canvas-confetti**: For confetti burst animation when selecting Rumble winners

---

## Part 2: Create Wrestler Data with Photos

### New File: `src/lib/wrestler-data.ts`
Create a data structure mapping wrestler names to their headshot images.

Since we don't have actual WWE wrestler photos, we'll use placeholder avatar URLs that can be easily replaced. Each wrestler will have:
- `name`: string
- `imageUrl`: string (placeholder or actual URL)
- `gender`: 'male' | 'female'

For now, use generated avatar placeholders (e.g., UI Avatars service or placeholder images). The host can later configure custom images.

---

## Part 3: Progress Header Component

### Enhancement: Sticky Progress Bar
Add a progress bar to the existing sticky header showing pick completion:

**Visual Design:**
```text
+------------------------------------------+
| <- Party 1294 - Hey Kyle!                |
| [============================---] 8/11   |
+------------------------------------------+
```

**Implementation:**
- Calculate completed picks count vs required (11 total)
- Use the existing `Progress` component with gold styling
- Show "X/11 complete" text
- Animate progress bar on changes with Framer Motion

---

## Part 4: Collapsible Section Cards

### Redesign: Progressive Disclosure Layout

Replace flat sections with 3 collapsible accordion-style cards:

**Section 1: Match Winners (75 pts possible)**
- Header shows: Icon + Title + Points + Summary ("2/3 selected")
- Collapsed: Shows mini summary of picks
- Expanded: Full match cards with wrestler selectors

**Section 2: Rumble Winners (100 pts possible)**
- Header shows: Crown icon + "Rumble Winners" + "100 pts possible"
- Collapsed: Shows "Roman Reigns" and "Rhea Ripley" or "Not selected"
- Expanded: Full-screen wrestler picker modal (see Part 5)

**Section 3: Chaos Props (60 pts possible)**
- Header shows: Zap icon + "Chaos Props" + "4/6 complete"
- Collapsed: Summary chips
- Expanded: Toggle switches for each prop

**Card Styling:**
- Background: `bg-card` with subtle shadow (`shadow-[0_4px_6px_rgba(0,0,0,0.3)]`)
- Border: `border border-border`
- Border radius: `rounded-xl`
- Gold border-left accent for completed sections

---

## Part 5: Wrestler Picker Full-Screen Modal

### New Component: `src/components/WrestlerPickerModal.tsx`

**Layout Structure:**
```text
+------------------------------------------+
| [X Close]    Men's Rumble Winner         |
| +--------------------------------------+ |
| | [Search wrestlers...]                | |
| +--------------------------------------+ |
|                                          |
| +----+ +----+ +----+ +----+             |
| |    | |    | |    | |    |  <- 4 cols  |
| | RR | | CR | | GU | | JU |     mobile  |
| |    | |    | |    | |    |             |
| +----+ +----+ +----+ +----+             |
| Roman  Cody   Gunther Jey               |
|                                          |
| +----+ +----+ +----+ +----+             |
| | SS | | JF | | RM | | DL |             |
| +----+ +----+ +----+ +----+             |
| Solo   Jacob  Rey     Dragon            |
|                                          |
| ... more wrestlers                       |
+------------------------------------------+
```

**Wrestler Card Design:**
- Size: 100px x 100px container
- Photo: Circular crop (70px diameter) with placeholder/image
- Border: 3px solid transparent (default), 3px solid gold (selected)
- Name: 12px font, centered below image
- Tap animation: `scale: [1, 1.05, 1]` with 200ms duration

**Features:**
- Search bar with instant filtering
- Responsive grid: 4 columns mobile, 6 columns tablet+
- Selected wrestler shows gold border + checkmark overlay
- Auto-close on selection
- Confetti burst animation when picking Rumble winner

---

## Part 6: iOS-Style Toggle Switches for Props

### Enhancement: Replace Radio Buttons

**Current Design:**
```text
The "Kofi/Logan Save"
○ YES   ○ NO
```

**New Design:**
```text
+------------------------------------------+
| The "Kofi/Logan Save"                    |
| Will someone use a prop to stay in?      |
|                                          |
|    NO  [====O] YES         +10 pts       |
+------------------------------------------+
```

**Implementation:**
- Use existing `Switch` component
- Style: Gold background when checked (YES)
- Labels: "NO" on left, "YES" on right
- Points badge: "+10 pts" in muted text
- Animation: Smooth slide transition (already in Switch component)

---

## Part 7: Submit Button States

### Enhancement: Dynamic Button Styling

**State 1: Incomplete (< 11 picks)**
```text
+------------------------------------------+
|  [Submit Picks] (disabled, gray)         |
|  7/11 picks complete                     |
+------------------------------------------+
```

**State 2: Complete (11/11 picks)**
```text
+------------------------------------------+
|  [LOCK IN YOUR PREDICTIONS] (gold shimmer)|
|  All picks complete!                      |
+------------------------------------------+
```

**State 3: Submitting**
```text
+------------------------------------------+
|  [Submitting...] (spinner icon)          |
+------------------------------------------+
```

---

## Part 8: Framer Motion Animations

### Animation Specifications

**1. Selection Bounce (wrestler cards):**
```javascript
animate={{ scale: [1, 1.05, 1] }}
transition={{ duration: 0.2 }}
```

**2. Fade In (sections):**
```javascript
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}
```

**3. Card Expand/Collapse:**
```javascript
// Using AnimatePresence + motion.div
initial={{ height: 0, opacity: 0 }}
animate={{ height: "auto", opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
```

**4. Confetti Burst (Rumble winner selection):**
```javascript
import confetti from 'canvas-confetti';

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#D4AF37', '#4B0082', '#FFFFFF']
});
```

**5. Progress Bar Animation:**
```javascript
// Animate value change smoothly
transition={{ type: "spring", stiffness: 100 }}
```

---

## Part 9: New CSS Utilities

### Add to `src/index.css`

```css
/* Wrestler card styles */
.wrestler-card {
  @apply relative flex flex-col items-center p-2 rounded-xl transition-all duration-200;
}

.wrestler-card-selected {
  @apply ring-2 ring-primary ring-offset-2 ring-offset-background;
}

/* Prop toggle container */
.prop-toggle-container {
  @apply flex items-center justify-between gap-3;
}
```

---

## Files to Create

1. **src/components/WrestlerPickerModal.tsx** - Full-screen wrestler grid modal
2. **src/lib/wrestler-data.ts** - Wrestler name/photo mapping

## Files to Modify

1. **src/pages/PlayerPicks.tsx** - Major redesign with collapsible sections
2. **src/index.css** - Add new utility classes
3. **package.json** - Add canvas-confetti dependency

---

## Technical Implementation Details

### PlayerPicks.tsx Restructure

**State Additions:**
```typescript
const [expandedSection, setExpandedSection] = useState<string | null>('matches');
const [showWrestlerPicker, setShowWrestlerPicker] = useState<{
  type: 'mens' | 'womens';
  isOpen: boolean;
} | null>(null);
```

**Helper Functions:**
```typescript
const getCompletedCount = () => {
  const required = [...UNDERCARD_MATCHES.map(m => m.id), ...CHAOS_PROPS.map(p => p.id), 'mens_rumble_winner', 'womens_rumble_winner'];
  return required.filter(id => picks[id]).length;
};

const getSectionSummary = (section: 'matches' | 'rumble' | 'props') => {
  // Return summary text for collapsed state
};
```

**Section Structure:**
```tsx
<Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection}>
  <AccordionItem value="matches">
    <AccordionTrigger>
      <MatchesSectionHeader completed={...} total={3} />
    </AccordionTrigger>
    <AccordionContent>
      {/* Match cards with wrestler photos */}
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="rumble">
    <AccordionTrigger>
      <RumbleSectionHeader mensPick={...} womensPick={...} />
    </AccordionTrigger>
    <AccordionContent>
      {/* Wrestler picker triggers */}
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="props">
    <AccordionTrigger>
      <PropsSectionHeader completed={...} total={6} />
    </AccordionTrigger>
    <AccordionContent>
      {/* Toggle switches */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Wrestler Photo Strategy

Since we don't have actual WWE wrestler photos, the implementation will:

1. Use UI Avatars API for initial placeholders: `https://ui-avatars.com/api/?name=Roman+Reigns&background=D4AF37&color=0A0A0A&size=100`
2. Create a `wrestler-data.ts` file that can easily be updated with real image URLs later
3. Support the host's custom entrant lists by generating placeholder avatars dynamically

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| PlayerPicks.tsx | Major Rewrite | Collapsible sections, progress bar, new layout |
| WrestlerPickerModal.tsx | New File | Full-screen wrestler selection grid |
| wrestler-data.ts | New File | Wrestler photo/data mapping |
| index.css | Minor Addition | New utility classes |
| package.json | Dependency | Add canvas-confetti |
