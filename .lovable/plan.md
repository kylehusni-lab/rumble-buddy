
# Hide "Join with Code" Button

## Overview
Since WrestleMania isn't ready yet, we'll temporarily hide the "Join with Code" button from the homepage hero section. This prevents users from trying to join parties before the event configuration is complete.

## Change Summary

**File: `src/components/home/HeroSection.tsx`**

Remove the "Join with Code" button from the CTA section (lines 180-187).

### Before:
```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
  <Button onClick={onRequestAccess} ...>
    Request Access
  </Button>
  <Button onClick={() => navigate("/join")} variant="outline" ...>
    Join with Code
  </Button>
</div>
```

### After:
```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
  <Button onClick={onRequestAccess} ...>
    Request Access
  </Button>
  {/* Join with Code hidden until WrestleMania is ready */}
</div>
```

## Result
The homepage will show only:
- **Request Access** button (primary gold CTA)
- **Try the Demo** button (ghost text link below)

When you're ready to enable party joins for WrestleMania, just uncomment the button.
