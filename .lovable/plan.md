

# Cinematic Story Section Redesign

## Overview

Transform the "Our Story" section into a high-energy, sports broadcast visual experience with three distinct sections: The Origin (timeline layout), The Manifesto (bento grid with icon trifecta), and The Gateway (centered closer).

---

## Design System Alignment

Using existing CSS variables and utilities:
- **Gold accent**: `--ott-accent` / `text-yellow-500`
- **Dark surfaces**: `bg-zinc-900`, `bg-background`
- **Muted text**: `text-zinc-400`, `text-muted-foreground`

---

## Section A: The Origin (Vertical Timeline)

### Layout Structure

```text
+------------------------------------------+
|  OUR STORY  (gold badge)                 |
|                                          |
|  [Gold dot] ──────────────────           |
|  THE EXPERIMENT                          |
|  Three years ago...                      |
|           │ (gold timeline line)         |
|           │                              |
|  [Gold dot] ──────────────────           |
|  THE SPARK  (Gold headline)              |
|  "...electric." (white highlight)        |
|           │                              |
|           ▼                              |
|  +------------------------------------+  |
|  │ OVER THE TOP  (Feature Card)       │  |
|  │ Gold left border, dark bg          │  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Component Changes

| Element | Styling |
|---------|---------|
| Timeline line | `border-l-2 border-yellow-500/30` with padding-left |
| Timeline dots | `w-3 h-3 rounded-full bg-yellow-500` absolute positioned |
| "The Experiment" | `text-2xl font-bold text-white` |
| "The Spark" | `text-2xl font-bold text-yellow-500` |
| "electric" phrase | `<span className="text-white">` within zinc-400 paragraph |
| Evolution card | `bg-zinc-900 border-l-4 border-yellow-500 p-8 rounded-r-lg` |

---

## Section B: The Manifesto (Bento Grid)

### Layout Structure

```text
+------------------------------------------+
|                                          |
|         WHY WE'RE OBSESSED               |
|     (Massive uppercase, 5xl-6xl)         |
|                                          |
|  "People always ask: 'Why wrestling?'"   |
|           (Italic, Gold)                 |
|                                          |
|  +----------+----------+----------+      |
|  | [Clapper]| [Laugh]  | [Trophy] |      |
|  | Intense  | Comedy   | World-   |      |
|  | Movie    |          | Class    |      |
|  | Action   |          | Athletics|      |
|  +----------+----------+----------+      |
|                                          |
+------------------------------------------+
```

### Icon Trifecta Grid

Using `lucide-react` icons:
- `Clapperboard` - Intense Movie Action
- `Laugh` - Laugh-Out-Loud Comedy  
- `Trophy` - World-Class Athletics

Grid: `grid-cols-1 md:grid-cols-3 gap-6`

Each card:
```tsx
<div className="flex flex-col items-center text-center space-y-3 p-6">
  <Icon className="w-12 h-12 text-yellow-500" />
  <span className="text-lg font-bold text-white">Label</span>
</div>
```

---

## Section C: The Gateway (Centered Closer)

### Layout Structure

```text
+------------------------------------------+
|                                          |
|       But if you don't watch every       |
|       week, it can be hard to keep up.   |
|                                          |
|       That's why the **Royal Rumble**    |
|       is perfect. 30 superstars,         |
|       constant action, one winner.       |
|                                          |
|       It is the ultimate gateway event,  |
|       and **OTT** is the key to          |
|       unlocking it.                      |
|                                          |
+------------------------------------------+
```

### Typography

- Container: `text-center max-w-2xl mx-auto`
- Text: `text-xl lg:text-2xl font-light text-zinc-300`
- Highlighted terms: `<span className="font-bold text-yellow-500">Royal Rumble</span>` and `<span className="font-bold text-yellow-500">OTT</span>`

---

## Spacing & Transitions

| Between | Gap |
|---------|-----|
| Section A → Section B | `py-32` or `gap-32` (large vertical spacer) |
| Section B → Section C | `py-20` (moderate spacer) |

---

## Code Structure

```tsx
import { motion } from "framer-motion";
import { Clapperboard, Laugh, Trophy } from "lucide-react";

export function StorySection({ id }: StorySectionProps) {
  return (
    <>
      {/* Section A: The Origin - Timeline Layout */}
      <section id={id} className="bg-background py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          {/* Timeline with 3 steps */}
          {/* Evolution Feature Card */}
        </div>
      </section>

      {/* Section B: The Manifesto */}
      <section className="bg-zinc-950 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Massive headline */}
          {/* Italic gold subhead */}
          {/* 3-column icon grid */}
        </div>
      </section>

      {/* Section C: The Gateway */}
      <section className="bg-background py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Closing statement with highlighted terms */}
        </div>
      </section>
    </>
  );
}
```

---

## Animation Details

All sections use Framer Motion scroll-triggered animations:
- `initial={{ opacity: 0, y: 30 }}`
- `whileInView={{ opacity: 1, y: 0 }}`
- `viewport={{ once: true }}`
- Staggered delays for timeline steps (0, 0.1, 0.2)
- Icon grid uses stagger animation (0.1s between each)

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/home/StorySection.tsx` | Complete rewrite with timeline, manifesto grid, and gateway sections |

---

## Visual Summary

**Section A (The Origin)**:
- Dark background with left-aligned timeline
- Gold vertical line connecting 3 milestones
- Feature card for "Over The Top" conclusion

**Section B (The Manifesto)**:
- Near-black background (`bg-zinc-950`) for maximum contrast
- Massive condensed headline
- 3-column icon bento grid

**Section C (The Gateway)**:
- Centered, elegant closer
- Light, readable typography
- Gold highlights on key terms

