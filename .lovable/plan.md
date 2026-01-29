
# Consolidate Admin Pages & Fix Image Fallbacks

## Overview

There are two issues to address:
1. **Duplicate admin pages** - Platform Admin and Wrestler Admin serve the same purpose now
2. **Missing images** - The Wrestler Admin cards don't use the local asset fallback system

## Changes

### 1. Remove Platform Admin Page (Redirect to Wrestler Admin)

The Platform Admin page at `/platform-admin` now serves no unique purpose since all wrestler management happens through the Wrestler Admin at `/admin/wrestlers`. We'll:

- Keep the PIN verification flow (`/platform-admin/verify`) as the entry point
- After PIN verification, redirect directly to `/admin/wrestlers` instead of `/platform-admin`
- Remove the Platform Admin page component entirely

**User flow becomes:**
```
Home → Platform Admin → Enter PIN → Wrestler Database
```

### 2. Fix Image Fallback in Wrestler Cards

The `WrestlerCard` component currently only shows images if `wrestler.image_url` is set in the database. Since we seeded wrestlers without image URLs, all show "No image".

The fix is to use `getWrestlerImageUrl()` from `wrestler-data.ts` which already handles the fallback chain:
1. Database `image_url` (if provided)
2. Local static assets (`src/assets/wrestlers/`)
3. WWE CDN URLs
4. Generated placeholder avatar

### 3. Remove Legacy Edge Function

The `update-platform-config` edge function was used by the old Platform Admin page to update the `platform_config` table. Since we're removing that page and using the `wrestlers` table now, this function is no longer needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/PlatformAdminVerify.tsx` | Redirect to `/admin/wrestlers` after PIN verification |
| `src/pages/PlatformAdmin.tsx` | Delete this file |
| `src/App.tsx` | Remove the `/platform-admin` route |
| `src/components/admin/WrestlerCard.tsx` | Use `getWrestlerImageUrl()` for proper fallback |
| `supabase/functions/update-platform-config/index.ts` | Delete this function |

---

## Technical Details

### WrestlerCard Image Fix

Current code (only checks database URL):
```typescript
const imageUrl = wrestler.image_url || getPlaceholderImageUrl(wrestler.name);
const hasImage = !!wrestler.image_url;
```

New code (uses full fallback chain):
```typescript
import { getWrestlerImageUrl } from '@/lib/wrestler-data';

const imageUrl = getWrestlerImageUrl(wrestler.name, wrestler.image_url);
const hasImage = true; // Always show image since fallback handles it
```

### PlatformAdminVerify Redirect Change

Change the success redirect from:
```typescript
navigate("/platform-admin");
```
To:
```typescript
navigate("/admin/wrestlers");
```

### Route Cleanup

Remove from App.tsx:
```typescript
<Route path="/platform-admin" element={<PlatformAdmin />} />
```

Keep:
```typescript
<Route path="/platform-admin/verify" element={<PlatformAdminVerify />} />
```

---

## Result

After these changes:
- Single admin page for wrestler management at `/admin/wrestlers`
- PIN protection still works via `/platform-admin/verify`
- All wrestlers display images (database → local assets → CDN → placeholder)
- Cleaner codebase with removed legacy code
