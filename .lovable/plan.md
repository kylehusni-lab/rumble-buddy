
# Host View Improvements & Bug Fixes

## Overview
This plan addresses three issues:
1. Streamline the host control hamburger menu
2. Fix women's rumble showing men's wrestlers in edit modal  
3. Fix missing wrestler images

---

## Issue 1: Host View Simplification

### Current State
The hamburger menu contains:
- Make My Picks
- My Dashboard
- TV Display
- Copy Join Link
- View All Picks (coming soon)
- Number Assignments (coming soon)
- Sign Out

### Proposed Changes

**A. Header Button Enhancement**
- Change header's "Group #CODE" button to copy the **full join URL** (not just the code)
- Currently: `navigator.clipboard.writeText(code)` 
- New: `navigator.clipboard.writeText(\`\${window.location.origin}/player/join?code=\${code}\`)`

**B. Consolidate Menu Items**
- Merge "Make My Picks" and "My Dashboard" into a single **"My Picks & Stats"** button that navigates to the dashboard
- The dashboard already has an "Edit Picks" button for pre-event editing, so separate navigation isn't needed

**C. Optional: Add Quick Actions to Main Screen**
- Add a "TV Display" button visible on the main host control page (not just in menu)
- Keep menu for less-used items (Sign Out, Settings, etc.)

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/host/HostHeader.tsx` | Change copy action to copy full join URL |
| `src/components/host/QuickActionsSheet.tsx` | Consolidate My Picks/Dashboard into single item |

---

## Issue 2: Women's Rumble Showing Men's Wrestlers

### Root Cause
The `SinglePickEditModal` uses `DEFAULT_MENS_ENTRANTS` and `DEFAULT_WOMENS_ENTRANTS` from constants, but the `PlayerDashboard` doesn't pass the gender-specific entrants from platform config.

### Current Code (SinglePickEditModal.tsx)
```tsx
// For rumble props:
const gender = matchId.includes("mens") ? "mens" : "womens";
entrants: customEntrants || (gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS),
```

The logic is correct, but if `customEntrants` is passed, it overrides both genders with the same list.

### Solution
1. Change `customEntrants` prop to separate `mensEntrants` and `womensEntrants` props
2. Update `PlayerDashboard` to pass both from `usePlatformConfig()`
3. Update `getPickConfig` to use the correct entrants based on detected gender

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/SinglePickEditModal.tsx` | Change `customEntrants` to `mensEntrants` + `womensEntrants` |
| `src/pages/PlayerDashboard.tsx` | Pass entrants from `usePlatformConfig()` |

---

## Issue 3: Missing Wrestler Images

### Likely Cause
The wrestler names in `DEFAULT_MENS_ENTRANTS` (constants.ts) may not exactly match the names in `wrestler-data.ts`. For example:
- Constants: `"Finn Bálor"` (with accent)
- Wrestler data: `"Finn Balor"` (without accent)

### Solution
1. Audit name mismatches between `constants.ts` and `wrestler-data.ts`
2. Ensure the fallback to UI Avatars placeholder is working correctly
3. Add console logging to identify which names aren't matching

### Names to check for mismatches:
- `Finn Bálor` vs `Finn Balor`
- `Je'Von Evans` (apostrophe handling)
- `*` prefix stripping for unconfirmed entrants

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/constants.ts` | Fix name mismatches |
| `src/lib/wrestler-data.ts` | Ensure all entrant names have corresponding data |

---

## Implementation Order

1. **Fix HostHeader.tsx** - Copy full join URL
2. **Fix QuickActionsSheet.tsx** - Consolidate menu items
3. **Fix SinglePickEditModal.tsx** - Separate gender entrant props
4. **Fix PlayerDashboard.tsx** - Pass platform config entrants
5. **Audit & fix name mismatches** - Between constants and wrestler-data

---

## Technical Details

### HostHeader.tsx Change
```tsx
const handleCopyCode = () => {
  const joinUrl = `${window.location.origin}/player/join?code=${code}`;
  navigator.clipboard.writeText(joinUrl);
  setCopied(true);
  toast.success("Join link copied!");
  setTimeout(() => setCopied(false), 2000);
};
```

### SinglePickEditModal.tsx Props Change
```tsx
interface SinglePickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentPick: string;
  onSave: (matchId: string, newValue: string) => void;
  mensEntrants?: string[];
  womensEntrants?: string[];
}

function getPickConfig(matchId: string, mensEntrants?: string[], womensEntrants?: string[]) {
  // For rumble winner/props:
  const gender = matchId.includes("mens") ? "mens" : "womens";
  return {
    type: "wrestler",
    entrants: gender === "mens" 
      ? (mensEntrants || DEFAULT_MENS_ENTRANTS)
      : (womensEntrants || DEFAULT_WOMENS_ENTRANTS),
  };
}
```

### PlayerDashboard.tsx Usage
```tsx
import { usePlatformConfig } from "@/hooks/usePlatformConfig";

// Inside component:
const { mensEntrants, womensEntrants } = usePlatformConfig();

// In JSX:
<SinglePickEditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  matchId={editingMatchId}
  currentPick={editingCurrentPick}
  onSave={handleSavePick}
  mensEntrants={mensEntrants}
  womensEntrants={womensEntrants}
/>
```

---

## Summary

| Issue | Fix | Complexity |
|-------|-----|------------|
| Copy join URL | Update HostHeader | Low |
| Consolidate menu | Update QuickActionsSheet | Low |
| Wrong gender wrestlers | Separate entrant props | Medium |
| Missing images | Audit name mismatches | Medium |
