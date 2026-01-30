
## Desktop Dashboard Responsiveness Improvements

Based on the screenshots, the mobile layout is well-optimized with dense, tactile content, while the desktop experience has too much wasted space. This plan addresses those issues.

---

### Current Desktop Problems

| Issue | Description |
|-------|-------------|
| No max-width | Content stretches full viewport width on wide screens |
| Tiny avatars | Props grid uses 40px avatars vs mobile's 72px |
| Stretched tables | Chaos table has too much horizontal whitespace |
| Sparse grid | 4-column grid on desktop makes cards feel small and scattered |

---

### Solution: Constrained, Two-Column Desktop Layout

Apply a max-width container and use the mobile's list-style layout on ALL screen sizes for a more consistent, premium feel.

---

### Changes by File

#### 1. SoloDashboard.tsx and PlayerDashboard.tsx

Add a centered max-width container to constrain content:

```typescript
// Current: no constraint
<div className="flex-1 min-h-0 overflow-y-auto p-4 pb-32">

// Updated: centered container with max-width
<div className="flex-1 min-h-0 overflow-y-auto">
  <div className="max-w-2xl mx-auto p-4 pb-32">
    {/* Tab content */}
  </div>
</div>
```

This limits content to 672px (max-w-2xl) and centers it on large screens.

---

#### 2. UnifiedRumblePropsTab.tsx

Remove the desktop multi-column grid and use the mobile list layout universally. This ensures:
- Large 72px avatars on all screen sizes
- Consistent, premium feel
- No sparse, tiny cards on desktop

```typescript
// REMOVE this conditional:
{isMobile ? (
  // mobile list layout
) : (
  // desktop grid - REMOVE THIS
)}

// KEEP only the mobile list layout for ALL viewports
```

---

#### 3. UnifiedMatchesTab.tsx

Already uses consistent list layout - just ensure it respects the max-width container.

---

#### 4. UnifiedChaosTab.tsx

Add max-width to table container and ensure columns don't stretch excessively:

```typescript
// Current
<div className="bg-card border border-border rounded-xl overflow-hidden">

// Updated with table layout constraints
<div className="bg-card border border-border rounded-xl overflow-hidden">
  <table className="w-full table-fixed">
    {/* Fixed column widths prevent stretching */}
```

---

#### 5. UnifiedDashboardHeader.tsx

Add max-width container to center the header content:

```typescript
// Current
<div className="p-4 pb-2">

// Updated
<div className="max-w-2xl mx-auto p-4 pb-2">
```

---

### Visual Summary

```text
+------------------------------------------+
|              Browser Window              |
|  +------------------------------------+  |
|  |        672px max-width             |  |
|  |  +------------------------------+  |  |
|  |  |   Score Card (centered)      |  |  |
|  |  +------------------------------+  |  |
|  |  | Tabs: Matches | Men's | ... |   |  |
|  |  +------------------------------+  |  |
|  |  |                              |  |  |
|  |  |  [72px] #1 Entrant           |  |  |
|  |  |         Bron Breakker        |  |  |
|  |  |                              |  |  |
|  |  |  [72px] #30 Entrant          |  |  |
|  |  |         Cody Rhodes          |  |  |
|  |  |                              |  |  |
|  |  |  (Stacked list - same as     |  |  |
|  |  |   mobile, not sparse grid)   |  |  |
|  |  |                              |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
+------------------------------------------+
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SoloDashboard.tsx` | Add max-w-2xl container around content |
| `src/pages/PlayerDashboard.tsx` | Add max-w-2xl container around content |
| `src/components/dashboard/UnifiedRumblePropsTab.tsx` | Remove desktop grid, use list layout universally |
| `src/components/dashboard/UnifiedChaosTab.tsx` | Add table-fixed for consistent column widths |
| `src/components/dashboard/UnifiedDashboardHeader.tsx` | Add max-w-2xl to center header |
| `src/components/dashboard/UnifiedTabNavigation.tsx` | Add max-w-2xl to center tabs |

---

### Outcome

After these changes:
- Desktop will have a clean, centered 672px column
- All props will use large 72px avatars (same as mobile)
- Chaos table won't stretch excessively
- Consistent premium feel across all viewport sizes
