

# Update "Our Story" Section & Footer Legal Disclaimer

## Overview

This update replaces the current single-block "Our Story" section with two distinct, visually separated sections (Origin Story + Philosophy), and updates the footer with the official legal disclaimer text.

---

## Part 1: Story Section Redesign

**File: `src/components/home/StorySection.tsx`**

### New Structure

The section will be split into two visually distinct parts:

| Section | Name | Visual Style |
|---------|------|--------------|
| A | **The Origin Story** | Personal, warm, founder's note feel with softer styling |
| B | **Why Wrestling?** | Bold, high-contrast manifesto with dark background |

### Section A: The Origin Story

- Light badge: "Our Story"
- Personal tone with subsections: "The Experiment" and "The Spark"
- Warm background (`bg-ott-surface`) with standard text styling
- Concluding paragraph about OTT being the "digital evolution of that poster board"

### Section B: The Philosophy (Why Wrestling?)

- Bold manifesto style with darker, high-contrast background (`bg-background`)
- Large, punchy headline
- Subsection: "The Gateway" with the Royal Rumble as the perfect entry point
- Border accent to separate visually from Section A

### Layout Code Structure

```text
<section> (bg-ott-surface)
  Section A: Origin Story
    - Badge: "Our Story"
    - H2: "The Experiment"
    - Paragraphs about the poster board experiment
    - Subsection: "The Spark"
    - Concluding paragraph about OTT
</section>

<section> (bg-background - darker, manifesto feel)
  Section B: Philosophy
    - H2: "Why we're obsessed with this stuff"
    - "Why wrestling?" paragraph
    - Subsection: "The Gateway"
    - Royal Rumble as the perfect entry point
</section>
```

---

## Part 2: Footer Legal Disclaimer

**File: `src/components/home/FooterSection.tsx`**

### Current Footer Layout
- Logo | Short disclaimer | Legal link

### Updated Footer Layout
- Logo row (unchanged)
- **New**: Full legal disclaimer paragraph below in small gray text
- Legal link (unchanged)

### Disclaimer Text (exact copy)
> "Over The Top (OTT) is an unofficial companion app and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with World Wrestling Entertainment (WWE). The name 'Royal Rumble' as well as related names, marks, emblems, and images are registered trademarks of their respective owners."

### Styling
- `text-xs text-gray-500` (or `text-muted-foreground/70`)
- Centered, max-width constrained for readability
- Stacked below the main footer row

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/home/StorySection.tsx` | Complete rewrite with two distinct sections (Origin Story + Philosophy) |
| `src/components/home/FooterSection.tsx` | Add detailed legal disclaimer text |

---

## Visual Preview

### Story Sections (After)

```text
+--------------------------------------------------+
|  [bg-ott-surface - warm, personal]               |
|                                                  |
|  OUR STORY                                       |
|                                                  |
|  The Experiment                                  |
|  Three years ago, we invited a group of friends  |
|  over for the Royal Rumble with a crazy idea...  |
|                                                  |
|  The Spark                                       |
|  It worked. Suddenly people who had never        |
|  watched a match were screaming at the TV...     |
|                                                  |
|  Over The Top (OTT) is the digital evolution...  |
+--------------------------------------------------+

+--------------------------------------------------+
|  [bg-background - dark, bold manifesto]          |
|                                                  |
|  Why we're obsessed with this stuff              |
|                                                  |
|  People always ask: "Why wrestling?"...          |
|                                                  |
|  The Gateway                                     |
|  The Royal Rumble is perfect. 30 superstars,     |
|  constant action, one winner...                  |
+--------------------------------------------------+
```

### Footer (After)

```text
+--------------------------------------------------+
|  [OTT Logo]  Over The Top            [Legal]     |
|                                                  |
|  Over The Top (OTT) is an unofficial companion   |
|  app and is not affiliated, associated,          |
|  authorized, endorsed by, or in any way          |
|  officially connected with World Wrestling       |
|  Entertainment (WWE). The name 'Royal Rumble'    |
|  as well as related names, marks, emblems, and   |
|  images are registered trademarks of their       |
|  respective owners.                              |
+--------------------------------------------------+
```

---

## Key Design Notes

1. **No trademark symbols** in body text or headings (keeps reading clean)
2. **Origin Story** uses warm, softer styling to feel personal
3. **Philosophy** uses dark, high-contrast styling to feel like a manifesto
4. **Footer disclaimer** uses `text-xs` and subdued gray color for legal text
5. Both story sections use motion animations for scroll-triggered reveals

