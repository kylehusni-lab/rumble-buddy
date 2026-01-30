
# Update Favicon and App Icons with RingIcon Design

## Overview

Replace the current favicon with a new SVG favicon based on the RingIcon wrestling ring design, and create proper app icon markup for PWA/mobile support.

---

## Changes Required

### 1. Create SVG Favicon File
**File: `public/favicon.svg`**

Create a standalone SVG favicon with the RingIcon design optimized for small sizes:
- Use the full RingIcon SVG content with viewBox 0 0 320 320
- Add a black background rectangle for better contrast at small sizes
- Standalone file (no React dependencies)

### 2. Update index.html
**File: `index.html`**

Update the favicon link and add comprehensive app icon support:
- Move the favicon link from `<body>` to `<head>` (proper placement)
- Add SVG favicon as primary (modern browsers)
- Keep PNG fallback for older browsers
- Add Apple Touch Icon for iOS home screen
- Add theme-color meta tag for browser chrome

```html
<!-- In <head> section -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#000000" />
```

### 3. Create Apple Touch Icon
**File: `public/apple-touch-icon.png`**

For iOS home screen icons, we need a 180x180 PNG. Since we cannot generate PNG files directly, I will:
- Create an HTML page component that renders the icon for manual export
- OR document how to generate this from the SVG

---

## Technical Details

### SVG Favicon Structure

The favicon.svg will be a simplified version optimized for small display:
- Black background (#000000) for contrast
- Full wrestling ring design centered
- 320x320 viewBox (scales down nicely)

### index.html Changes

Move favicon link from body to head:
```html
<!-- REMOVE from body -->
<link rel="icon" type="image/png" href="/favicon.png" />

<!-- ADD to head -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#000000" />
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `public/favicon.svg` | Create | New SVG favicon with RingIcon design |
| `index.html` | Modify | Update favicon links, add app icon support |

---

## Notes on PNG Generation

Since Lovable cannot directly generate PNG files, the user has two options:

1. **Use the SVG directly** - Modern browsers support SVG favicons, and the existing favicon.png will serve as fallback
2. **Manual export** - Open the SVG in a browser, screenshot at 180x180 for apple-touch-icon.png

The SVG favicon will work in Chrome, Firefox, Safari, and Edge. Only very old browsers need the PNG fallback.
