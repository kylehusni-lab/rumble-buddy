

# Plan: Fix Content Cutoff & Improve Logo Background Blending

## Overview
Based on the screenshots, there are two main issues to fix:

1. **Content getting cut off in pick cards** - Both the Rumble Winner grid and Chaos Props questions are being cut off at the bottom
2. **Logo background blending** - The logo on the landing page needs better integration with the dark background

---

## Issue Analysis

### Issue 1: Card Content Cutoff

**Root Cause**: The card container in `PickCardStack.tsx` uses `flex-1 overflow-hidden` which constrains the card height, but the inner cards have `max-h` constraints that don't account for the full available space on mobile devices.

**Affected Files**:
- `src/components/picks/cards/RumbleWinnerCard.tsx` - Line 51: `max-h-[calc(100vh-200px)]`
- `src/components/picks/cards/ChaosPropsCard.tsx` - Line 26: `max-h-[650px]`

**Fix**: Remove fixed max-height constraints and instead use flexible height with proper overflow handling. The cards should fill the available space and scroll internally.

### Issue 2: Logo Background Blending

**Root Cause**: The Royal Rumble logo has its own background (appears to be on a light/colored background in the image file), which creates a harsh contrast against the dark app background.

**Fix**: Add a subtle glow effect behind the logo and potentially add a gradient mask to blend it better with the dark background.

---

## Files to Modify

### 1. `src/components/picks/cards/RumbleWinnerCard.tsx`

**Changes**:
- Remove `max-h-[calc(100vh-200px)]` constraint
- Add proper flex layout with `overflow-hidden` on outer and scroll on inner
- Ensure the ScrollArea takes remaining height properly

```typescript
// Line 51 - Change from:
<div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col h-full max-h-[calc(100vh-200px)]">

// To:
<div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col overflow-hidden">
```

Also add padding-bottom to the grid container to ensure last row isn't cut off:
```typescript
// Line 91 - Update grid padding:
<div className="grid grid-cols-4 md:grid-cols-6 gap-3 pb-8">
```

### 2. `src/components/picks/cards/ChaosPropsCard.tsx`

**Changes**:
- Remove `min-h-[500px] max-h-[650px]` constraints
- Use flexible layout that fills available space

```typescript
// Line 26 - Change from:
<div className="bg-card rounded-2xl p-6 shadow-card border border-border min-h-[500px] max-h-[650px] flex flex-col">

// To:
<div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col overflow-hidden">
```

Also add padding-bottom to props list for last item visibility:
```typescript
// Line 45 - Update container padding:
<div className="space-y-4 pb-4">
```

### 3. `src/components/picks/PickCardStack.tsx`

**Changes**:
- Update the card container to properly constrain height and allow internal scrolling
- Change `overflow-hidden` to allow children to handle their own scrolling

```typescript
// Line 180 - Change from:
<div className="flex-1 flex items-center justify-center p-4 overflow-hidden">

// To:
<div className="flex-1 flex items-start justify-center p-4 pt-2 overflow-y-auto">
```

Also update the motion.div wrapper to have proper height:
```typescript
// Line 205 - Add max-height constraint:
className="w-full max-w-md cursor-grab active:cursor-grabbing h-full max-h-full"
```

### 4. `src/components/Logo.tsx`

**Changes**:
- Add a background glow effect behind the logo
- Add subtle vignette/gradient mask to blend with dark background

```typescript
// Add glow container around the logo image:
<div className="relative">
  {/* Background glow */}
  <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-2xl scale-150" />
  
  {/* Logo with blend */}
  <motion.img
    src={royalRumbleLogo}
    alt="Royal Rumble 2026"
    style={{ width: sizes[size].width }}
    className="object-contain relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
    // ... rest of animation
  />
</div>
```

### 5. `src/index.css`

**Changes**:
- Add a radial gradient utility class for the logo glow

```css
/* Add to @layer utilities */
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-stops));
}
```

---

## Visual Comparison

### Before (Current)
```text
Rumble Winner Card:
+----------------------------------+
| [Header + Search]                |
| [Row 1] [Row 2] [Row 3] [Row 4]  |
| [Row 5] [Row 6] [Row 7] [Row 8]  |
| [Row 9] [Row 10] [Row 11] [CUTOFF]
+----------------------------------+

Chaos Props Card:
+----------------------------------+
| [Header]                         |
| [Prop 1] [YES] [NO]              |
| [Prop 2] [YES] [NO]              |
| [Prop 3] [YES] [NO]              |
| [Prop 4] [YES] [NO]              |
| [Prop 5] [PARTIAL CUT]           |
+----------------------------------+
```

### After (Fixed)
```text
Rumble Winner Card:
+----------------------------------+
| [Header + Search]                |
| ┌────────────────────────────┐   |
| │ [Row 1] [Row 2] [Row 3]    │   |
| │ [Row 4] [Row 5] [Row 6]    │   |
| │ [Row 7] [Row 8] [Row 9]    │ ← |
| │ [Row 10] [Row 11] [Row 12] │   | Scrollable
| │ [Surprise/Other]           │   |
| └────────────────────────────┘   |
+----------------------------------+

Chaos Props Card:
+----------------------------------+
| [Header]                         |
| ┌────────────────────────────┐   |
| │ [Prop 1] [YES] [NO]        │   |
| │ [Prop 2] [YES] [NO]        │   |
| │ [Prop 3] [YES] [NO]        │ ← | Scrollable
| │ [Prop 4] [YES] [NO]        │   |
| │ [Prop 5] [YES] [NO]        │   |
| │ [Prop 6] [YES] [NO]        │   |
| └────────────────────────────┘   |
+----------------------------------+
```

---

## Logo Enhancement

### Current
- Logo appears with hard edges on dark background
- No visual integration with dark theme

### Enhanced
- Subtle gold glow behind logo (using `drop-shadow` and radial gradient)
- Soft vignette effect to blend edges
- Logo appears to "emerge" from the dark background

---

## Summary of Changes

| File | Change |
|------|--------|
| `RumbleWinnerCard.tsx` | Remove fixed max-height, add scroll padding |
| `ChaosPropsCard.tsx` | Remove fixed min/max-height, add scroll padding |
| `PickCardStack.tsx` | Adjust container to allow proper scrolling |
| `Logo.tsx` | Add gold glow effect and drop shadow |
| `index.css` | Add radial gradient utility class |

---

## Technical Notes

- The `ScrollArea` component from Radix UI handles scrolling properly when given `flex-1` within a flex container
- Adding `pb-8` (32px padding bottom) ensures the last row of wrestlers has space to be fully visible even with the scroll thumb
- The `drop-shadow` filter creates a natural glow effect that follows the logo's shape
- Using `overflow-hidden` on the outer card and scroll inside prevents layout shifts during card transitions

