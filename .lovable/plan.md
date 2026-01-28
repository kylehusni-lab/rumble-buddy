
# Fix Match Card Display on Desktop

## Problem
The Match Card appears broken on desktop because it's using viewport-based breakpoints (`md:`, `lg:`) that activate on wide screens, even though the card is constrained to a narrow `max-w-lg` (512px) container.

Looking at the screenshot:
- The card is in a narrow centered container (512px)
- But the card is trying to use desktop layout (side-by-side wrestlers)
- This causes awkward stretching and proportions

## Root Cause
In `MatchCard.tsx`, the component uses responsive breakpoints like:
- `md:flex-row` - switches to horizontal layout at 768px viewport
- `md:w-24 md:h-24 lg:w-32 lg:h-32` - large images
- `lg:gap-10 lg:px-12` - extra padding for large screens

But the parent container is constrained to 512px max-width, so these desktop styles don't make sense within the narrow container.

## Solution
Keep the mobile/stacked layout for the pick flow cards since they're always in a narrow container. Remove or adjust the desktop breakpoints that cause the awkward display.

### Changes to `src/components/picks/cards/MatchCard.tsx`

**Line 34 - Remove `md:flex-row` and desktop gaps:**
```tsx
// Before:
<div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-10 justify-center items-stretch md:items-center md:px-4 lg:px-12 relative">

// After:
<div className="flex-1 flex flex-col gap-4 justify-center items-stretch relative">
```

**Line 41-42 - Keep horizontal layout for button content, remove desktop vertical switch:**
```tsx
// Before:
"flex flex-row md:flex-col items-center gap-3 sm:gap-4 md:gap-4",

// After:
"flex flex-row items-center gap-3 sm:gap-4",
```

**Line 51-54 - Use consistent image sizes:**
```tsx
// Before:
"w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32",

// After:
"w-14 h-14 sm:w-16 sm:h-16",
```

**Line 68 - Keep left-aligned text:**
```tsx
// Before:
<div className="flex-1 md:flex-none text-left md:text-center min-w-0">

// After:
<div className="flex-1 text-left min-w-0">
```

**Line 69-72 - Consistent text sizes:**
```tsx
// Before:
"text-sm sm:text-lg md:text-xl lg:text-2xl"

// After:
"text-sm sm:text-lg"
```

**Line 83-84 - Checkmark positioning:**
```tsx
// Before:
"w-7 h-7 sm:w-8 sm:h-8 md:absolute md:top-3 md:right-3 md:w-8 md:h-8"

// After:
"w-7 h-7 sm:w-8 sm:h-8"
```

**Lines 94-105 - VS divider stays compact:**
```tsx
// Before:
<div className="flex items-center justify-center flex-shrink-0 py-1 md:py-0">
  ...
  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full ...">
    <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-black ...">

// After:
<div className="flex items-center justify-center flex-shrink-0 py-1">
  ...
  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full ...">
    <span className="text-sm sm:text-base font-black ...">
```

## Result
After these changes, the MatchCard will always display in a stacked/mobile layout that works well within the constrained 512px container, regardless of viewport size. This matches the intended design where the pick flow maintains a "mobile-first" appearance on all devices.

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/picks/cards/MatchCard.tsx` | Remove desktop breakpoints, keep mobile stacked layout |

## Visual Before/After
- **Before**: Side-by-side wrestlers that look stretched in narrow container
- **After**: Stacked wrestlers with horizontal row layout (image + name + checkmark) that fits the 512px container properly
