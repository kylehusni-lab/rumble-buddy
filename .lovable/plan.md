

# Wrestler Database Admin Panel - Implementation Plan

## Overview

This plan creates a full-featured admin panel for managing the wrestler roster database. The system will store wrestlers in a database table with cloud storage for images, allowing hosts and platform admins to add/edit/remove wrestlers without using AI credits.

---

## Architecture Decision

### Two-Tier Access Model

Given the existing authentication patterns in the codebase:

| Access Level | Route | Authentication Method |
|--------------|-------|----------------------|
| **Platform Admin** | `/admin/wrestlers` | Platform admin PIN (existing verify-admin-pin edge function) |
| **Party Host** | Hidden button in HostControl | Party PIN + host session check |

**Recommendation**: Implement Platform Admin level first - this provides a central roster management that all parties can use. Party-level customization can be added later.

---

## Database Schema

### New Table: `wrestlers`

```sql
CREATE TABLE public.wrestlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  division TEXT NOT NULL CHECK (division IN ('mens', 'womens')),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on name (case-insensitive)
CREATE UNIQUE INDEX idx_wrestlers_name_lower ON wrestlers (LOWER(name));

-- Performance index
CREATE INDEX idx_wrestlers_division ON wrestlers(division);
CREATE INDEX idx_wrestlers_active ON wrestlers(is_active) WHERE is_active = true;
```

### Row Level Security

```sql
ALTER TABLE wrestlers ENABLE ROW LEVEL SECURITY;

-- Anyone can read wrestlers
CREATE POLICY "Anyone can read wrestlers"
ON wrestlers FOR SELECT
TO authenticated
USING (true);

-- No direct mutations - must go through edge function with admin token
```

### Storage Bucket: `wrestler-images`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('wrestler-images', 'wrestler-images', true, 5242880);

-- RLS for public read access
CREATE POLICY "Public can view wrestler images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wrestler-images');

-- Authenticated users can upload (will be further restricted via edge function)
CREATE POLICY "Authenticated can upload wrestler images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wrestler-images');

CREATE POLICY "Authenticated can update wrestler images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wrestler-images');

CREATE POLICY "Authenticated can delete wrestler images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wrestler-images');
```

---

## Edge Function: `manage-wrestlers`

Secure CRUD operations with admin token verification.

### Endpoints (via body action):

| Action | Description |
|--------|-------------|
| `list` | Get all wrestlers (paginated, filtered) |
| `create` | Add new wrestler |
| `update` | Edit wrestler |
| `delete` | Remove wrestler (soft delete via is_active) |
| `bulk_import` | Import multiple wrestlers from names list |

### Request Format:

```typescript
interface ManageWrestlersRequest {
  token: string; // Platform admin JWT token
  action: 'list' | 'create' | 'update' | 'delete' | 'bulk_import';
  data?: {
    // For create/update
    id?: string;
    name?: string;
    short_name?: string;
    division?: 'mens' | 'womens';
    image_url?: string;
    // For bulk_import
    names?: string[];
    default_division?: 'mens' | 'womens';
    // For list filtering
    search?: string;
    division_filter?: 'mens' | 'womens' | 'all';
  };
}
```

**File**: `supabase/functions/manage-wrestlers/index.ts`

---

## Frontend Components

### 1. Admin Route & Page

**File**: `src/pages/WrestlerAdmin.tsx`

- Protected by platform admin session check
- Redirects to verify PIN if not authenticated
- Similar pattern to existing `PlatformAdmin.tsx`

**Route Addition** to `src/App.tsx`:
```tsx
<Route path="/admin/wrestlers" element={<WrestlerAdmin />} />
```

### 2. Page Layout Structure

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back                Wrestler Database           [Bulk] [+ Add]  │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Search...                        [All] [Men's] [Women's]       │
├─────────────────────────────────────────────────────────────────────┤
│  47 wrestlers                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  [img]   │  │  [img]   │  │  [img]   │  │  [📷]    │            │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤            │
│  │ Roman    │  │ Seth     │  │ Cody     │  │ New One  │            │
│  │ Men's    │  │ Men's    │  │ Men's    │  │ Men's    │            │
│  │ [✏️][🗑️] │  │ [✏️][🗑️] │  │ [✏️][🗑️] │  │ [✏️][🗑️] │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Component Breakdown

| Component | File | Purpose |
|-----------|------|---------|
| `WrestlerAdmin` | `src/pages/WrestlerAdmin.tsx` | Main page with grid |
| `WrestlerCard` | `src/components/admin/WrestlerCard.tsx` | Individual wrestler card |
| `WrestlerFormModal` | `src/components/admin/WrestlerFormModal.tsx` | Add/Edit modal |
| `BulkImportModal` | `src/components/admin/BulkImportModal.tsx` | Bulk import modal |
| `DeleteConfirmModal` | `src/components/admin/DeleteConfirmModal.tsx` | Delete confirmation |

### 4. Custom Hook

**File**: `src/hooks/useWrestlerAdmin.ts`

```typescript
interface UseWrestlerAdmin {
  wrestlers: Wrestler[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  divisionFilter: 'all' | 'mens' | 'womens';
  setDivisionFilter: (d: string) => void;
  createWrestler: (data: CreateWrestlerData) => Promise<void>;
  updateWrestler: (id: string, data: UpdateWrestlerData) => Promise<void>;
  deleteWrestler: (id: string) => Promise<void>;
  bulkImport: (names: string[], division: string) => Promise<void>;
  uploadImage: (file: File, wrestlerId: string) => Promise<string>;
}
```

---

## Image Upload Flow

### Process:

1. User selects image file
2. Client-side validation (type, size)
3. Client-side compression (max 400x400px)
4. Upload to Supabase Storage `wrestler-images/{wrestler-id}.jpg`
5. Get public URL
6. Update wrestler record with image_url

### Compression Utility:

**File**: `src/lib/image-utils.ts`

```typescript
export async function compressImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

---

## Integration with Existing System

### Update `wrestler-data.ts` to Support Database

Modify `getWrestlerImageUrl()` to check database first:

```typescript
// New function that checks database wrestlers first
export async function getWrestlerImageUrlFromDb(name: string): Promise<string> {
  // Check database cache first (populated on app load)
  const dbWrestler = wrestlerCache.get(name);
  if (dbWrestler?.image_url) {
    return dbWrestler.image_url;
  }
  
  // Fall back to existing static data
  return getWrestlerImageUrl(name);
}
```

### Add Wrestler Cache Hook

**File**: `src/hooks/useWrestlerCache.ts`

Preloads database wrestlers and provides fast lookups.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/WrestlerAdmin.tsx` | Main admin page |
| `src/components/admin/WrestlerCard.tsx` | Wrestler display card |
| `src/components/admin/WrestlerFormModal.tsx` | Add/Edit form modal |
| `src/components/admin/BulkImportModal.tsx` | Bulk import modal |
| `src/components/admin/DeleteConfirmModal.tsx` | Delete confirmation |
| `src/hooks/useWrestlerAdmin.ts` | Admin operations hook |
| `src/hooks/useWrestlerCache.ts` | Database wrestler cache |
| `src/lib/image-utils.ts` | Image compression utility |
| `supabase/functions/manage-wrestlers/index.ts` | Secure CRUD edge function |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/admin/wrestlers` route |
| `src/lib/wrestler-data.ts` | Add database integration for image lookups |
| `src/pages/PlatformAdmin.tsx` | Add link to wrestler database |

---

## UI Styling (Consistent with App)

### Color Palette

```typescript
const adminColors = {
  background: '#0d0d15',
  cardBg: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.1)',
  inputFocus: '#f5c518',
  buttonPrimary: '#f5c518',
  buttonDanger: '#f44336',
};
```

### Grid Responsive Breakpoints

| Screen | Columns |
|--------|---------|
| Desktop (1200px+) | 4 |
| Tablet (768-1199px) | 3 |
| Mobile (<768px) | 2 |

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create database table and storage bucket | Migration SQL |
| 2 | Create manage-wrestlers edge function | `supabase/functions/manage-wrestlers/index.ts` |
| 3 | Create image compression utility | `src/lib/image-utils.ts` |
| 4 | Create useWrestlerAdmin hook | `src/hooks/useWrestlerAdmin.ts` |
| 5 | Create WrestlerCard component | `src/components/admin/WrestlerCard.tsx` |
| 6 | Create WrestlerFormModal | `src/components/admin/WrestlerFormModal.tsx` |
| 7 | Create DeleteConfirmModal | `src/components/admin/DeleteConfirmModal.tsx` |
| 8 | Create BulkImportModal | `src/components/admin/BulkImportModal.tsx` |
| 9 | Create WrestlerAdmin page | `src/pages/WrestlerAdmin.tsx` |
| 10 | Add route to App.tsx | `src/App.tsx` |
| 11 | Add link from PlatformAdmin | `src/pages/PlatformAdmin.tsx` |
| 12 | Integrate with wrestler-data.ts | `src/lib/wrestler-data.ts` |

---

## Security Considerations

1. **Admin Token Verification**: All mutations go through edge function that verifies platform admin JWT
2. **Storage RLS**: Images publicly readable, but uploads require authentication
3. **Input Validation**: Edge function validates all inputs (name length, division values, etc.)
4. **Rate Limiting**: Edge function includes rate limiting for bulk operations
5. **Soft Delete**: Wrestlers are marked inactive rather than hard deleted to preserve historical data

---

## Summary

This implementation:

- Creates a dedicated wrestlers table in the database
- Sets up cloud storage for wrestler images
- Provides a secure admin panel protected by platform admin PIN
- Supports full CRUD + bulk import operations
- Uses existing UI patterns for consistent styling
- Integrates with the existing wrestler display system
- No AI credits used for any operations

Access at `/admin/wrestlers` - platform admin only.

