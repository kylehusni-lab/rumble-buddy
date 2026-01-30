
## Combined UI Update Plan

This plan addresses two related changes:

1. **Simplify unconfirmed wrestler styling** - Remove dashed borders and asterisks, use only italic text with a legend note
2. **Consolidate wrestler admin into Commissioner Mode** - Move the Wrestler Database from `/admin/wrestlers` (PIN-protected) into the existing Admin Dashboard at `/admin` as a third tab

---

### Part A: Simplify Unconfirmed Wrestler Styling

**Current behavior:**
- Asterisk prefix (`*`) added to unconfirmed names
- Dashed border around profile pictures
- Italic text with reduced opacity

**New behavior:**
- No asterisk prefix - names display cleanly
- No dashed border - transparent border like confirmed wrestlers  
- Keep italic text only
- Add a small legend note on picker screens: "Italic = unconfirmed"

#### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePlatformConfig.ts` | Remove `*` prefix logic from `mensEntrants`/`womensEntrants` arrays |
| `src/lib/entrant-utils.ts` | Update `isUnconfirmedEntrant()` to accept optional entrant data array for lookup instead of asterisk detection |
| `src/components/WrestlerPickerModal.tsx` | Remove `border-dashed` conditional; add legend note below search bar |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Remove `border-dashed` conditional; add legend note in header area |
| `src/components/picks/cards/RumblePropsCard.tsx` | Remove `border-dashed` conditionals in both picker dialogs |

#### Legend Note Design

A small, unobtrusive note below the search bar:
```text
Italic names = unconfirmed participants
```

---

### Part B: Consolidate Wrestler Database into Commissioner Mode

**Current state:**
- Wrestler Database lives at `/admin/wrestlers` and requires Platform Admin PIN verification
- Commissioner Dashboard at `/admin` has 2 tabs: "Access Requests" and "Active Parties"

**New state:**
- Add a third tab "Wrestlers" to the Commissioner Dashboard
- Remove the standalone `/admin/wrestlers` route
- Keep the same PIN-based protection for this tab (since Commissioner Mode already requires admin role)
- The Platform Admin PIN verification page (`/platform-admin/verify`) is only needed for the Wrestler tab

#### Implementation Approach

1. **Create a new `WrestlerDatabaseTab` component** that contains the wrestler management UI currently in `WrestlerAdmin.tsx`
2. **Update `AdminDashboard.tsx`** to add a third tab with PIN-based access for the Wrestler tab
3. **Remove `/admin/wrestlers` route** from `App.tsx`
4. **Delete or repurpose `WrestlerAdmin.tsx`** page

#### Tab Structure in Commissioner Mode

```text
[Access Requests] [Active Parties] [Wrestlers*]
                                      |
                                      +-- Requires PIN on first access
```

The Wrestlers tab will prompt for the Platform Admin PIN when first clicked, storing the session in localStorage (same as current `WrestlerAdmin.tsx` does).

---

### Technical Details

#### Part A: Styling Changes

**usePlatformConfig.ts (Lines 63-69)**
```typescript
// Before:
const mensEntrants = mensData.map(e => 
  e.isConfirmed ? e.name : `*${e.name}`
);

// After:
const mensEntrants = mensData.map(e => e.name);
```

The `mensEntrantsData` and `womensEntrantsData` arrays already contain the `isConfirmed` boolean, so components can look up confirmation status directly.

**entrant-utils.ts - New helper function**
```typescript
export function isUnconfirmedByData(
  name: string, 
  entrantsData: { name: string; isConfirmed: boolean }[]
): boolean {
  const entrant = entrantsData.find(e => e.name === name);
  return entrant ? !entrant.isConfirmed : false;
}
```

Components will be updated to:
1. Accept `entrantsData` prop
2. Use `isUnconfirmedByData()` instead of asterisk detection
3. Remove `border-dashed border-muted-foreground/50` classes
4. Keep `italic opacity-80` for unconfirmed names

**Legend note component snippet**
```tsx
<p className="text-[10px] text-muted-foreground mt-1 text-center">
  <span className="italic">Italic names</span> = unconfirmed participants
</p>
```

#### Part B: Tab Consolidation

**New WrestlerDatabaseTab component**
- Extracts the core wrestler management UI from `WrestlerAdmin.tsx`
- Includes PIN verification check before showing content
- Uses existing `useWrestlerAdmin` hook

**AdminDashboard.tsx changes**
- Add third TabsTrigger: "Wrestlers"
- Add third TabsContent wrapping `<WrestlerDatabaseTab />`
- Update `TabsList` from `grid-cols-2` to `grid-cols-3`

**App.tsx changes**
- Remove the `/admin/wrestlers` route
- Remove the `WrestlerAdmin` lazy import

---

### File Summary

| File | Action |
|------|--------|
| `src/hooks/usePlatformConfig.ts` | Edit - remove asterisk prefix |
| `src/lib/entrant-utils.ts` | Edit - add data-based lookup helper |
| `src/components/WrestlerPickerModal.tsx` | Edit - remove dashed border, add legend |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Edit - remove dashed border, add legend |
| `src/components/picks/cards/RumblePropsCard.tsx` | Edit - remove dashed border in 2 places |
| `src/components/admin/WrestlerDatabaseTab.tsx` | Create - new tab component |
| `src/pages/AdminDashboard.tsx` | Edit - add third tab |
| `src/pages/WrestlerAdmin.tsx` | Delete |
| `src/App.tsx` | Edit - remove `/admin/wrestlers` route |
