

# Fix Mobile Sizing & Replace Royal Rumble Logo with OTT Branding

## Issues Identified from Screenshot

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| **Event banner cutting off on right** | `inline-flex` with all elements in a single row overflows on mobile | Stack the countdown below the event name on mobile |
| **Countdown digits getting cut off** | Horizontal layout with 4 countdown units + colons overflows 320-375px width | Make countdown wrap to new line on small screens |
| **Royal Rumble logo still referenced** | Old `Logo.tsx` component imports `royal-rumble-logo.png` and is still used in many pages | Replace all `<Logo>` usages with OTT logo components |

---

## Part 1: Fix Hero Section Mobile Layout

**File: `src/components/home/HeroSection.tsx`**

### Current Problem (Line 73-89)
The event banner uses `inline-flex` which forces everything on one line:
```tsx
<div className="inline-flex items-center gap-3 ...">
  <span>NEXT EVENT</span>
  <span>Royal Rumble</span>
  <div className="flex ...">  {/* Countdown - 4 units + 3 colons */}
```

On a 375px screen, this exceeds available width.

### Solution: Stack Layout on Mobile

1. Change the container to allow wrapping:
```tsx
<div className="flex flex-col sm:flex-row sm:inline-flex sm:items-center gap-3 ...">
```

2. Move countdown to its own row on mobile:
```tsx
{/* Event name row */}
<div className="flex items-center gap-3">
  <span className="text-[10px]...">Next Event</span>
  <span className="font-semibold">Royal Rumble</span>
</div>

{/* Countdown row - always horizontal but in its own row on mobile */}
{timeRemaining && (
  <div className="flex items-center gap-1 sm:gap-2 sm:ml-2 sm:pl-2 sm:border-l border-border">
    <CountdownUnit value={timeRemaining.days} label="d" />
    <span className="text-muted-foreground text-sm">:</span>
    ...
  </div>
)}
```

3. Reduce countdown unit text size on mobile:
```tsx
// In CountdownUnit component
<div className="text-xl sm:text-2xl sm:text-3xl font-black tabular-nums text-ott-accent">
```

---

## Part 2: Update OTT Logo Component for Smaller Sizes

**File: `src/components/OttLogo.tsx`**

Add a small variant of the logo mark for use in headers (replacing old Royal Rumble logo):

```tsx
export function OttLogoSmall({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <OttLogoMark size={24} />
      <span className="font-bold text-sm tracking-tight">OTT</span>
    </div>
  );
}
```

---

## Part 3: Replace All Royal Rumble Logo Usages

The old `Logo` component (importing `royal-rumble-logo.png`) is used in **9 files**:

| File | Current Usage | Replacement |
|------|--------------|-------------|
| `src/pages/Index.tsx` | `<Logo size="lg" />` | Keep old version (this is legacy route, will be deprecated) |
| `src/pages/SoloDashboard.tsx` | `<Logo size="sm" />` | `<OttLogoSmall />` |
| `src/pages/SoloSetup.tsx` | `<Logo size="md" />` | `<OttLogoSmall />` or larger OttLogoMark |
| `src/pages/PlayerJoin.tsx` | `<Logo size="md" />` | `<OttLogoMark size={48} />` |
| `src/pages/TvDisplay.tsx` | `<Logo size="lg" />` | `<OttLogoHero size={180} />` |
| `src/pages/HostVerifyPin.tsx` | `<Logo size="sm" />` | `<OttLogoSmall />` |
| `src/pages/PlatformAdminVerify.tsx` | `<Logo ... />` | `<OttLogoMark />` |
| `src/pages/Legal.tsx` | `<Logo size="sm" />` | `<OttLogoSmall />` |
| `src/components/NumberRevealAnimation.tsx` | `<Logo size="md" />` | `<OttLogoMark size={64} />` |

---

## Part 4: Mobile Button Sizing

The buttons currently use `size="lg"` which works well, but we should ensure they don't overflow:

```tsx
<div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row">
  <Button 
    onClick={onRequestAccess}
    size="lg"
    className="bg-ott-accent text-background hover:bg-ott-accent/90 font-bold w-full sm:w-auto"
  >
    Request Access
  </Button>
  ...
</div>
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/home/HeroSection.tsx` | Refactor event banner to stack on mobile; reduce countdown size on small screens |
| `src/components/OttLogo.tsx` | Add `OttLogoSmall` component for header use |
| `src/pages/SoloDashboard.tsx` | Replace `<Logo>` with `<OttLogoSmall>` |
| `src/pages/SoloSetup.tsx` | Replace `<Logo>` with OTT logo |
| `src/pages/PlayerJoin.tsx` | Replace `<Logo>` with OTT logo |
| `src/pages/TvDisplay.tsx` | Replace `<Logo>` with `<OttLogoHero>` |
| `src/pages/HostVerifyPin.tsx` | Replace `<Logo>` with OTT logo |
| `src/pages/PlatformAdminVerify.tsx` | Replace `<Logo>` with OTT logo |
| `src/pages/Legal.tsx` | Replace `<Logo>` with OTT logo |
| `src/components/NumberRevealAnimation.tsx` | Replace `<Logo>` with OTT logo |

---

## Visual Layout After Fix

**Mobile (375px):**
```text
+----------------------------------+
|  [OTT]             [Join Party]  |
+----------------------------------+

        [OTT Logo 180px]
        (with gold glow)

+----------------------------------+
| NEXT EVENT    Royal Rumble       |
+----------------------------------+
|   02 : 10 : 52 : 08              |
|    d    h    m    s              |
+----------------------------------+

Over The Top

Your tag team partner for 
watch party night...

+----------------------------------+
|       [Request Access]           |
+----------------------------------+
|       [Join with Code]           |
+----------------------------------+

Try the demo ->
```

The event banner now stacks vertically on mobile, ensuring the countdown never gets cut off.

---

## Testing Checklist

1. View OTT homepage on mobile (375px) - verify event banner and countdown are fully visible
2. View OTT homepage on tablet (768px) - verify horizontal layout works
3. Navigate to Solo Dashboard - verify OTT logo appears (not Royal Rumble logo)
4. Navigate to Solo Setup - verify OTT branding
5. Navigate to TV Display - verify OTT logo in waiting state
6. Navigate to Host Verify PIN - verify OTT branding
7. Navigate to Legal page - verify OTT branding
8. Test number reveal animation - verify OTT logo

