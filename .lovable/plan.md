

# Responsive TV Display Grid Enhancement

## Overview
Make the TV display automatically adapt to different screen sizes by detecting viewport dimensions and scaling elements accordingly. This will ensure the Rumble grid is optimally sized whether viewed on a 32" monitor, 55" living room TV, or 75" projector setup.

---

## Current Issues

Based on your TV screenshots:
1. **Grid cells are tiny** - Fixed 48px wrestler photos don't scale with screen size
2. **Wasted space** - The 9/3 column split leaves unused area
3. **No viewport awareness** - Sizes are hardcoded regardless of actual TV resolution

---

## Solution: Dynamic Scaling System

Create a responsive scaling system that:
1. Detects the viewport width/height
2. Calculates optimal cell sizes based on available space
3. Scales fonts, photos, and badges proportionally
4. Adapts the layout split based on screen width

---

## Implementation Details

### 1. Create useTvScale Hook

New file `src/hooks/useTvScale.ts` - A custom hook that calculates scale factors based on viewport:

```text
Viewport Detection:
- 1920px (1080p) = base scale (1.0)
- 2560px (1440p) = scale 1.3
- 3840px (4K)    = scale 2.0
- Auto-detect and apply multiplier
```

The hook will return:
- `scale`: Multiplier for sizes (1.0-2.0)
- `cellSize`: Optimal cell dimensions
- `photoSize`: Which WrestlerImage size to use
- `fontSize`: Multipliers for text elements
- `isLargeScreen`: Boolean for 2K+ displays

### 2. Update TvDisplay.tsx Layout

Make the column split responsive:

```text
Screen Width    Main Content    Leaderboard
< 1600px        col-span-9      col-span-3
1600-2560px     col-span-10     col-span-2
> 2560px        col-span-10     col-span-2 (but wider overall)
```

### 3. Update NumberCell.tsx with Dynamic Sizing

Accept a `scale` prop and apply dynamic sizing:

| Element | Current | 1080p (base) | 1440p (1.3x) | 4K (2x) |
|---------|---------|--------------|--------------|---------|
| Cell | aspect-[4/5] | 100px | 130px | 200px |
| Photo | 48px (sm) | 48px (sm) | 80px (md) | 120px (lg) |
| Name | 10px | 12px | 14px | 18px |
| Initials | 9px | 11px | 13px | 16px |
| Badge | 28px | 32px | 40px | 52px |

### 4. Update WrestlerImage.tsx with TV-Optimized Sizes

Add new size variants specifically for TV display:

```text
tv-sm: 60px   (for 1080p)
tv-md: 100px  (for 1440p)
tv-lg: 150px  (for 4K)
```

### 5. Update TvViewNavigator.tsx Grid Gap

Make the grid gap responsive:

```text
1080p: gap-2 (8px)
1440p: gap-2.5 (10px)
4K: gap-3 (12px)
```

### 6. Add TV-Specific CSS Classes

Add responsive utility classes in `src/index.css`:

```text
.tv-text-name   - scales from 12px to 18px
.tv-text-badge  - scales from 11px to 16px
.tv-cell        - scales width/height based on viewport
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useTvScale.ts` | Viewport detection and scale calculation hook |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TvDisplay.tsx` | Use useTvScale hook, responsive column layout |
| `src/components/tv/TvViewNavigator.tsx` | Pass scale to NumberCell, responsive grid gap |
| `src/components/tv/NumberCell.tsx` | Accept scale prop, apply dynamic sizes |
| `src/components/tv/WrestlerImage.tsx` | Add TV-optimized size variants |
| `src/index.css` | Add responsive TV utility classes |

---

## Technical Implementation

### useTvScale Hook Logic

```typescript
export function useTvScale() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  useEffect(() => {
    const update = () => setDimensions({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Calculate scale based on width
  const scale = useMemo(() => {
    if (dimensions.width >= 3840) return 2.0;      // 4K
    if (dimensions.width >= 2560) return 1.5;      // 1440p
    if (dimensions.width >= 1920) return 1.25;     // 1080p+
    return 1.0;                                     // Base
  }, [dimensions.width]);

  // Determine photo size variant
  const photoSize = useMemo(() => {
    if (scale >= 2.0) return 'lg';
    if (scale >= 1.5) return 'md';
    return 'sm';
  }, [scale]);

  return { scale, photoSize, dimensions, isLargeScreen: scale > 1.25 };
}
```

### NumberCell Dynamic Sizing

The NumberCell will compute inline styles based on scale:

```typescript
const cellStyle = {
  fontSize: `${10 * scale}px`,
  // Number badge scales with viewport
};

// Photo size determined by hook
<WrestlerImage 
  name={wrestlerName} 
  size={photoSize}  // "sm" | "md" | "lg" based on viewport
/>
```

### Grid Layout Responsive Rules

```typescript
// In TvDisplay.tsx
const { scale, isLargeScreen } = useTvScale();

// Wider main area on larger screens
const mainColSpan = isLargeScreen ? 'col-span-10' : 'col-span-9';
const sideColSpan = isLargeScreen ? 'col-span-2' : 'col-span-3';
```

---

## Visual Comparison

```text
BEFORE (1080p Fixed):
┌────────────────────────────────────────────┬──────────────────┐
│  [tiny] [tiny] [tiny] ... (10 cols)        │  Leaderboard     │
│  Grid cells ~100px, hard to see            │  (wide, 25%)     │
│                                            │                  │
│  Lots of vertical space unused             │                  │
└────────────────────────────────────────────┴──────────────────┘

AFTER (Responsive):
┌──────────────────────────────────────────────────────┬────────────┐
│  [BIGGER] [BIGGER] [BIGGER] [BIGGER] ... (10 cols)   │ Leaderboard│
│  Grid cells scale to fill available height           │ (compact)  │
│  Photos 48px→80px→120px based on resolution          │            │
│  Text scales proportionally                          │            │
└──────────────────────────────────────────────────────┴────────────┘
```

---

## Responsive Breakpoints

| Resolution | Scale | Cell Size | Photo | Name Text | Layout |
|------------|-------|-----------|-------|-----------|--------|
| 1280x720 | 0.8 | ~80px | sm (48px) | 10px | 9/3 cols |
| 1920x1080 | 1.0 | ~100px | sm (48px) | 12px | 9/3 cols |
| 2560x1440 | 1.3 | ~130px | md (80px) | 14px | 10/2 cols |
| 3840x2160 | 2.0 | ~200px | lg (120px) | 18px | 10/2 cols |

---

## Summary

This responsive approach will:
- **Auto-detect** the TV/monitor resolution
- **Scale everything proportionally** - cells, photos, text, badges
- **Maximize grid visibility** by using available space
- **Compress leaderboard** on larger screens to give more room to grid
- **No manual configuration** - works automatically on any screen size

