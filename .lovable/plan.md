

# Homepage Polish & TV Display Fullscreen Fix

## Issues Identified

| Issue | Current State | Solution |
|-------|---------------|----------|
| **Missing "The Rumble App" tagline** | Title only shows "Over The Top" | Add tagline below the wordmark |
| **"Make Your Picks" needs breathing room** | Preview cards cramped together | Add more spacing between preview elements |
| **No scroll indicator below hero** | "Try the demo" looks like the bottom of the page | Add a visual scroll cue (chevron or fade) |
| **TV display not using fullscreen space** | Grid cells stay small even at full resolution | Update `useTvScale` to better utilize available height |
| **Remove two features from grid** | "No Signup Required" and "Mobile First" | Replace with a single new feature emphasizing accessibility |
|
---

## Part 1: Add "The Rumble App" Tagline

**File: `src/components/home/HeroSection.tsx`**

Add a subtitle between the wordmark and the tagline paragraph:

```tsx
{/* Title */}
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
  <OttWordmark />
</h1>

{/* NEW: Subtitle tagline */}
<p className="text-sm sm:text-base font-semibold uppercase tracking-widest text-ott-accent -mt-4">
  The Rumble App
</p>

{/* Tagline */}
<p className="text-lg sm:text-xl text-muted-foreground max-w-md">
  Your tag team partner...
</p>
```

---

## Part 2: Add Scroll Indicator to Hero

**File: `src/components/home/HeroSection.tsx`**

Add a subtle animated scroll indicator at the bottom of the hero section to show there's more content below:

```tsx
{/* After the main grid, before section closing tag */}

{/* Scroll indicator */}
<motion.div 
  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 1, duration: 0.5 }}
>
  <span className="text-xs text-muted-foreground uppercase tracking-wider">Scroll</span>
  <motion.div
    animate={{ y: [0, 6, 0] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
  >
    <ChevronDown className="w-5 h-5 text-muted-foreground" />
  </motion.div>
</motion.div>
```

---

## Part 3: Update Features Section

**File: `src/components/home/FeaturesSection.tsx`**

Replace the 4 features with 2 (removing "No Signup Required" and "Mobile First"):

**Current (4 features):**
1. Real-time Updates
2. TV Display Mode
3. No Signup Required (REMOVE)
4. Mobile First (REMOVE)

**New (2 features):**
1. Real-time Updates
2. TV Display Mode

Also update the grid to be 2 columns instead of 4 on desktop:

```tsx
const features = [
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Scores update instantly as matches end and eliminations happen.",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    description: "Cast to your big screen so everyone can follow along.",
  },
];

// Grid changes from lg:grid-cols-4 to lg:grid-cols-2
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-2xl mx-auto">
```

---

## Part 4: Fix "Make Your Picks" Preview Spacing

**File: `src/components/home/HowItWorksSection.tsx`**

Add more vertical spacing in the "picks" tab content:

```tsx
<TabsContent value="picks" className="mt-0">
  <div className="space-y-6"> {/* Increase from space-y-4 to space-y-6 */}
    <h3 className="font-semibold text-lg">Make Your Predictions</h3>
    <p className="text-muted-foreground">
      Pick match winners, rumble participants, and chaos props before the show starts.
    </p>
    {/* Mobile-optimized wrestler list preview */}
    <div className="space-y-3 max-w-sm"> {/* Increase from space-y-2 to space-y-3 */}
      {/* Cards remain the same but with more gap */}
    </div>
  </div>
</TabsContent>
```

---

## Part 5: Fix TV Display Fullscreen Scaling

**Issue from Screenshot**: In fullscreen mode, the 30-number grid has significant empty space below. The cells are not expanding to fill available height.

**Root Cause**: The `TvNumberCell` uses `aspect-square` which maintains 1:1 ratio, and the grid gap/layout doesn't account for available vertical space.

**Solution**: Update the TV layout to use viewport-based sizing for the grid container and dynamically scale cells based on available height.

**File: `src/pages/TvDisplay.tsx`** (lines 529-554)

Update the main content area to use `h-full` and flex layout:

```tsx
{/* Main Content Area - Full Width with top padding for header */}
<div className={cn(
  "flex-1 flex flex-col p-6",
  partyStatus !== "pre_event" ? "pt-20" : ""
)}>
```

**File: `src/hooks/useTvScale.ts`**

Add height-aware scaling:

```tsx
// Calculate scale based on BOTH width and height
const scale = useMemo(() => {
  const widthScale = (() => {
    if (dimensions.width >= 3840) return 2.0;
    if (dimensions.width >= 2560) return 1.5;
    if (dimensions.width >= 1920) return 1.25;
    if (dimensions.width >= 1600) return 1.0;
    return 0.85;
  })();
  
  const heightScale = (() => {
    if (dimensions.height >= 2160) return 2.0;
    if (dimensions.height >= 1440) return 1.5;
    if (dimensions.height >= 1080) return 1.25;
    if (dimensions.height >= 900) return 1.0;
    return 0.85;
  })();
  
  // Use the smaller of the two to ensure content fits
  return Math.min(widthScale, heightScale);
}, [dimensions.width, dimensions.height]);

// Add a new property for dynamic cell sizing
const cellSize = useMemo(() => {
  // Calculate optimal cell size based on viewport
  // 10 columns + gaps (9 x gap) + padding (2 x 24px)
  const availableWidth = dimensions.width - 48; // 24px padding each side
  const gapSize = scale >= 2.0 ? 12 : scale >= 1.5 ? 10 : 8;
  const maxCellWidth = (availableWidth - (9 * gapSize)) / 10;
  
  // Also consider height (3 rows + winner section + predictions)
  const availableHeight = dimensions.height - 200; // Header + padding + ticker
  const maxCellHeight = (availableHeight - (2 * gapSize)) / 3 * 0.8; // 80% of row height
  
  return Math.min(maxCellWidth, maxCellHeight);
}, [dimensions.width, dimensions.height, scale]);
```

**File: `src/components/tv/TvViewNavigator.tsx`**

Update the grid to use computed cell sizes when in fullscreen:

```tsx
const renderNumberGrid = (numbers: RumbleNumber[], rumbleId: string) => {
  // Existing code...
  
  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div 
        className={cn("grid grid-cols-10 flex-1", gridGapClass)}
        style={{
          // Let cells expand to fill available space
          gridAutoRows: "1fr",
        }}
      >
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/home/HeroSection.tsx` | Add "The Rumble App" tagline + scroll indicator |
| `src/components/home/FeaturesSection.tsx` | Remove 2 features, update to 2-column grid |
| `src/components/home/HowItWorksSection.tsx` | Increase spacing in picks preview |
| `src/hooks/useTvScale.ts` | Add height-aware scaling + cellSize property |
| `src/components/tv/TvViewNavigator.tsx` | Update grid to use flex-1 and gridAutoRows |
| `src/pages/TvDisplay.tsx` | Update content container to use flex layout |

---

## Visual Changes

**Homepage Hero (After):**
```text
        [OTT Logo]
        
+----------------------------------+
| NEXT EVENT    Royal Rumble       |
| 01d : 23h : 45m : 12s            |
+----------------------------------+

Over The Top
THE RUMBLE APP          <-- NEW TAGLINE

Your tag team partner for 
watch party night...

[Request Access]  [Join with Code]

Try the demo ->

        SCROLL              <-- NEW INDICATOR
          v
```

**Features Section (After):**
```text
+------------------+------------------+
|  Real-time       |  TV Display      |
|  Updates         |  Mode            |
+------------------+------------------+
```

**TV Display (After):**
- Grid cells expand to fill vertical space
- Cells are larger on high-resolution displays
- Winner predictions panel still visible below grid

---

## Testing Checklist

1. View homepage - verify "The Rumble App" tagline appears below title
2. Verify scroll indicator animates at bottom of hero
3. Check Features section shows only 2 items in centered 2-column layout
4. View "How It Works" picks tab - confirm increased spacing
5. Open TV display in fullscreen - verify grid cells expand to use available space
6. Test TV display at different resolutions (1080p, 1440p, 4K)

