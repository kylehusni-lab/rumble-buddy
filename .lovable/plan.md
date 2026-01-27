

# Platform-Level Rumble Entrants Admin System

## Overview

This plan creates a centralized platform admin system for managing Royal Rumble entrants globally, replacing the per-party entrant storage. A single super-admin will be able to configure the wrestler lists that all parties use.

## Architecture Changes

### 1. Database Schema Updates

Create a new `platform_config` table to store global configuration:

```sql
-- Platform configuration table for global settings
CREATE TABLE public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Enable realtime for live updates across all hosts
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_config;
```

This table will store:
- `mens_rumble_entrants` - Array of male wrestler names
- `womens_rumble_entrants` - Array of female wrestler names

### 2. Admin Authentication

Since security is critical, the platform admin page will be protected by a hardcoded super-admin PIN (stored in a secret environment variable). This is a simple approach suitable for a single-admin scenario without full user authentication.

- Create a new route `/platform-admin` with PIN verification
- Store the admin PIN as a server-side environment variable (`PLATFORM_ADMIN_PIN`)
- Use an edge function to validate the PIN securely

### 3. New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/PlatformAdmin.tsx` | Main admin dashboard for managing entrants |
| `src/pages/PlatformAdminVerify.tsx` | PIN verification gate for admin access |
| `src/hooks/usePlatformConfig.ts` | Custom hook to fetch/subscribe to platform config |
| `supabase/functions/verify-admin-pin/index.ts` | Edge function to securely verify admin PIN |

### 4. Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for `/platform-admin` and `/platform-admin/verify` |
| `src/pages/HostControl.tsx` | Replace party entrants with platform config |
| `src/pages/Index.tsx` | Remove entrant initialization when creating parties |
| `src/components/picks/cards/RumbleWinnerCard.tsx` | Use platform config for entrant lists |
| `src/lib/constants.ts` | Keep defaults as fallbacks only |

## Detailed Component Design

### Platform Admin Page (`/platform-admin`)

A mobile-friendly admin interface with:

- **Header**: "Platform Admin" with logout button
- **Men's Rumble Section**: 
  - List of current entrants with remove buttons
  - "Add Wrestler" input with autocomplete from wrestler-data
  - Drag-to-reorder functionality (optional, for display order)
- **Women's Rumble Section**: Same as above
- **Save Changes**: Button to persist changes to database
- **Live Preview**: Shows how the list will appear to players

### Platform Config Hook

```typescript
// src/hooks/usePlatformConfig.ts
export function usePlatformConfig() {
  // Fetches mens_rumble_entrants and womens_rumble_entrants from platform_config
  // Subscribes to realtime updates
  // Falls back to DEFAULT_*_ENTRANTS from constants if no config exists
  return { mensEntrants, womensEntrants, isLoading, refetch };
}
```

### HostControl Updates

Replace:
```typescript
const mensEntrants = Array.isArray(party?.mens_rumble_entrants) ? ... : [];
const womensEntrants = Array.isArray(party?.womens_rumble_entrants) ? ... : [];
```

With:
```typescript
const { mensEntrants, womensEntrants } = usePlatformConfig();
```

## Security Considerations

1. **Admin PIN Verification**: The PIN is never exposed client-side. An edge function validates it server-side and returns a signed session token stored in localStorage.

2. **Session Expiry**: Admin sessions expire after 24 hours for security.

3. **Platform Config Protection**: The `platform_config` table should be read-only for normal users. Only the edge function (using service role) can write to it.

4. **RLS Policies**:
   - SELECT: Allow all authenticated and anonymous users (needed for reading config)
   - INSERT/UPDATE/DELETE: Deny all (only edge function with service role can modify)

## Data Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Platform Admin Flow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Admin] ──> /platform-admin/verify ──> Edge Function               │
│                                           │                         │
│                                           ▼                         │
│                                    Validate PIN                     │
│                                           │                         │
│                                           ▼                         │
│                                   Return session token              │
│                                           │                         │
│                                           ▼                         │
│  [Admin] ──> /platform-admin ──────> CRUD on platform_config        │
│                                           │                         │
│                                           ▼                         │
│                               Realtime broadcast to all clients     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Host/Player Flow                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Host/Player] ──> usePlatformConfig() ──> Fetch from platform_config│
│                                                │                    │
│                                                ▼                    │
│                                     Subscribe to realtime updates   │
│                                                │                    │
│                                                ▼                    │
│                                     Use entrants in UI              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

1. **Database Setup**
   - Create `platform_config` table with migration
   - Add RLS policies (read-only for public)
   - Enable realtime
   - Seed initial data with current DEFAULT_*_ENTRANTS

2. **Edge Function**
   - Create `verify-admin-pin` function
   - Accept PIN, validate against secret, return session token
   - Create `update-platform-config` function for secure writes

3. **Platform Admin Pages**
   - Build PIN verification page
   - Build main admin dashboard with entrant management UI
   - Add wrestler search/autocomplete from existing wrestler-data

4. **Integration**
   - Create `usePlatformConfig` hook
   - Update HostControl to use the hook
   - Update RumbleWinnerCard to use the hook
   - Update party creation to not store entrants (optional cleanup)

5. **Testing**
   - Verify admin can add/remove entrants
   - Verify all hosts see updated entrants in real-time
   - Verify players see correct entrants in picker
   - Verify fallback to defaults works when no config exists

## Technical Details

### Database Migration SQL

```sql
-- Create platform_config table
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Read-only policy for everyone
CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_config;

-- Seed initial data
INSERT INTO public.platform_config (key, value) VALUES 
  ('mens_rumble_entrants', '["Roman Reigns", "Cody Rhodes", "Gunther", "Jey Uso", "Solo Sikoa", "Jacob Fatu", "Rey Mysterio", "Dragon Lee", "Penta", "CM Punk", "Drew McIntyre", "Randy Orton", "Trick Williams", "Surprise/Other Entrant"]'),
  ('womens_rumble_entrants', '["Liv Morgan", "Rhea Ripley", "IYO SKY", "Charlotte Flair", "Bayley", "Asuka", "Giulia", "Jordynne Grace", "Alexa Bliss", "Nia Jax", "Roxanne Perez", "Raquel Rodriguez", "Lyra Valkyria", "Lash Legend", "Chelsea Green", "Surprise/Other Entrant"]')
ON CONFLICT (key) DO NOTHING;
```

### Edge Function: verify-admin-pin

```typescript
// Validates PIN against PLATFORM_ADMIN_PIN secret
// Returns JWT-like session token on success
// Token stored in localStorage as 'platform_admin_session'
```

### usePlatformConfig Hook Structure

```typescript
export function usePlatformConfig() {
  const [config, setConfig] = useState({ 
    mensEntrants: DEFAULT_MENS_ENTRANTS,
    womensEntrants: DEFAULT_WOMENS_ENTRANTS 
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch on mount
  // Subscribe to realtime changes
  // Return merged config with defaults as fallback

  return { ...config, isLoading, refetch };
}
```

## Cleanup (Optional Future Work)

After confirming the platform config works:
- Remove `mens_rumble_entrants` and `womens_rumble_entrants` columns from `parties` table
- Remove related code from Index.tsx party creation
- Remove party-specific entrant handling from HostSetup.tsx (already done)

