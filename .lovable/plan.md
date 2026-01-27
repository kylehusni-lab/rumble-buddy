
# Legal Disclaimer Page & Footer Component

## Overview

Create a dedicated legal disclaimer page and a compact footer component that can be reused across the app to show the short disclaimer with a link to the full legal page.

---

## Files to Create

### 1. New Page: `src/pages/Legal.tsx`

A simple, scrollable page containing the full legal disclaimer with the following sections:

**Content Structure:**
- **Header**: "Legal Disclaimer" with Logo (small)
- **Copyright & Trademark Notice**: WWE ownership statement
- **Unofficial Application Notice**: Not affiliated with WWE
- **Fair Use Statement**: Commentary/criticism justification
- **Image Credits**: WWE image usage acknowledgment
- **No Commercial Use**: Free/personal use statement
- **Back to Home link**

**Styling:**
- Dark background matching the app theme
- Readable text with proper spacing
- Section headers in gold/primary color
- Mobile-friendly with max-width container

---

### 2. New Component: `src/components/LegalFooter.tsx`

A compact footer component with the short disclaimer:

```
© WWE. All Rights Reserved. This is an unofficial fan application not affiliated with WWE.
```

**Features:**
- "Legal" link that navigates to `/legal`
- Subtle styling (muted text, small font)
- Can be placed at bottom of any page

---

### 3. Route Addition: `src/App.tsx`

Add the new route:
```typescript
<Route path="/legal" element={<Legal />} />
```

---

### 4. Integration: `src/pages/Index.tsx`

Add the `LegalFooter` component at the bottom of the home page, positioned after all existing content.

---

## Page Design: `/legal`

```
┌────────────────────────────────────────┐
│           [Logo - small]               │
│          Legal Disclaimer              │
├────────────────────────────────────────┤
│                                        │
│  COPYRIGHT & TRADEMARK NOTICE          │
│  ────────────────────────────────────  │
│  All WWE programming, talent names...  │
│                                        │
│  UNOFFICIAL APPLICATION                │
│  ────────────────────────────────────  │
│  This application is an unofficial...  │
│                                        │
│  FAIR USE STATEMENT                    │
│  ────────────────────────────────────  │
│  This application uses WWE talent...   │
│                                        │
│  IMAGE CREDITS                         │
│  ────────────────────────────────────  │
│  All wrestler images and WWE logos...  │
│                                        │
│  NO COMMERCIAL USE                     │
│  ────────────────────────────────────  │
│  This application is provided free...  │
│                                        │
│         [← Back to Home]               │
│                                        │
└────────────────────────────────────────┘
```

---

## Footer Component Design

```
────────────────────────────────────────────────
© WWE. All Rights Reserved. Unofficial fan app. [Legal]
────────────────────────────────────────────────
```

- Fixed at page bottom or inline depending on page
- `text-xs` size, `text-muted-foreground` color
- "Legal" is a link to `/legal`

---

## Technical Details

### Legal.tsx Structure
```typescript
export default function Legal() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Logo size="sm" />
        <h1>Legal Disclaimer</h1>
        
        <section>
          <h2>Copyright & Trademark Notice</h2>
          <p>...</p>
        </section>
        
        // ... more sections
        
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
}
```

### LegalFooter.tsx Structure
```typescript
export function LegalFooter() {
  return (
    <footer className="text-center text-xs text-muted-foreground py-4">
      © WWE. All Rights Reserved. Unofficial fan app.{" "}
      <Link to="/legal" className="underline hover:text-foreground">
        Legal
      </Link>
    </footer>
  );
}
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/Legal.tsx` | Create - Full legal disclaimer page |
| `src/components/LegalFooter.tsx` | Create - Compact footer component |
| `src/App.tsx` | Modify - Add `/legal` route |
| `src/pages/Index.tsx` | Modify - Add footer to home page |
