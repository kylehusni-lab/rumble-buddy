
## Security Hardening Plan: Comprehensive Audit Response

### Executive Summary

This plan addresses all security findings from the audit while ensuring zero deprecation of core functionality. The app has migrated to Supabase email/password authentication, making legacy PIN-based authentication obsolete. The only "PIN" remaining should be the **6-character alphanumeric Party Code** for joining groups.

---

### Security Findings Overview

| Finding | Severity | Impact to Core Functionality | Action |
|---------|----------|------------------------------|--------|
| Parties table exposes `host_pin` via SELECT policy | Critical | None - `host_pin` is legacy | Remove column and related code |
| `send-pin-recovery` edge function uses CORS wildcard | High | None - function is obsolete | Delete function |
| Legacy PIN database functions still exist | Medium | None - not used | Drop functions |
| `parties_public` view lacks `security_invoker` | Low | Intentional for join flow | Document as acceptable |
| Solo player `pin` column stored in plaintext | Medium | Legacy - no longer used | Mark for future migration |
| `access_requests` INSERT policy is permissive | Low | Intentional for public requests | Add rate limiting note |
| Platform Admin PIN (PLATFORM_ADMIN_PIN) | Info | Still in use for wrestler admin | Keep - rename to "Passcode" in UI |

---

### Part A: Remove Legacy Host PIN System

The `host_pin` column and related functions are no longer used. Authentication is now handled via Supabase Auth with `host_user_id`.

**Files to Modify:**

1. **Database Migration** - Remove `host_pin` column and legacy functions:
```sql
-- Drop the legacy functions that reference host_pin
DROP FUNCTION IF EXISTS public.verify_host_pin(text, text);
DROP FUNCTION IF EXISTS public.set_host_pin(text, text);
DROP FUNCTION IF EXISTS public.update_party_status_with_pin(text, text, text, timestamptz);

-- Remove the host_pin column
ALTER TABLE public.parties DROP COLUMN IF EXISTS host_pin;

-- Drop the constraint if it exists
ALTER TABLE public.parties DROP CONSTRAINT IF EXISTS parties_host_pin_format;

-- Recreate parties_public view without host_pin reference
DROP VIEW IF EXISTS public.parties_public;
CREATE VIEW public.parties_public AS
SELECT code, created_at, event_started_at, mens_rumble_entrants, status, womens_rumble_entrants, is_demo
FROM public.parties;
GRANT SELECT ON public.parties_public TO anon, authenticated;
```

2. **`src/pages/DemoMode.tsx`** - Remove `host_pin: "0000"` from party creation
3. **`src/pages/Index.tsx`** - Remove `host_pin: "0000"` from demo creation
4. **`src/pages/HostSetup.tsx`** - Remove localStorage PIN references and `update_party_status_with_pin` call, use direct RLS-protected update
5. **`src/pages/HostControl.tsx`** - Remove localStorage PIN references
6. **`src/pages/MyParties.tsx`** - Remove localStorage PIN references
7. **`src/components/host/QuickActionsSheet.tsx`** - Remove localStorage PIN removal on sign out

**New Function Needed** - Secure party status update:
```sql
CREATE OR REPLACE FUNCTION public.update_party_status_by_host(
  p_party_code text,
  p_status text,
  p_event_started_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is the host
  IF NOT is_party_host(p_party_code) THEN
    RETURN false;
  END IF;
  
  UPDATE public.parties
  SET 
    status = p_status,
    event_started_at = COALESCE(p_event_started_at, event_started_at)
  WHERE code = p_party_code;
  
  RETURN true;
END;
$$;
```

---

### Part B: Delete Obsolete Edge Function

The `send-pin-recovery` function sends 4-digit PINs for solo players. This is obsolete since solo mode now uses email/password.

**Action:**
1. Delete `supabase/functions/send-pin-recovery/` directory
2. Remove from `supabase/config.toml`
3. Ensure `ForgotPasswordModal.tsx` only uses Supabase Auth's `resetPasswordForEmail` (already done)

---

### Part C: Clean Up Solo Player PIN References

The `solo_players` table has a `pin` column that's no longer used. The current flow uses `get_or_create_solo_player` which sets an empty PIN.

**Database Migration:**
```sql
-- Make pin column nullable (it's currently NOT NULL)
ALTER TABLE public.solo_players ALTER COLUMN pin DROP NOT NULL;

-- Drop legacy functions that use PINs
DROP FUNCTION IF EXISTS public.verify_solo_login(text, text);
DROP FUNCTION IF EXISTS public.register_solo_player(text, text, text);
```

**Note:** We keep the `pin` column for now to avoid data loss for any legacy users. It can be removed in a future migration after verifying no legacy users exist.

---

### Part D: Update Terminology Throughout App

Replace all "PIN" references with appropriate terminology:

| Old Term | New Term | Context |
|----------|----------|---------|
| "4-digit PIN" | N/A - Remove | Legacy solo authentication |
| "host_pin" | N/A - Remove | Legacy host verification |
| "Party Code" | "Group Code" or "Access Code" | 6-character alphanumeric |
| "Admin PIN" | "Admin Passcode" | Platform wrestler admin |

**Files to Update:**

1. **`supabase/functions/send-pin-recovery/index.ts`** - DELETE ENTIRE FUNCTION (line 88 says "4-digit PIN")
2. **`src/pages/PlatformAdminVerify.tsx`** - Change "PIN" to "Passcode" in UI text:
   - Line 20: "PIN must be at least 4 characters" -> "Passcode required"
   - Line 32: "Invalid PIN" -> "Invalid passcode"
   - Line 45-46: PIN error messages -> "passcode" 
   - Line 69: "Enter admin PIN" -> "Enter admin passcode"
   - Line 78: placeholder -> "Enter admin passcode"

---

### Part E: Fix Permissive RLS Policy on Parties Table

The `parties` table has a policy `"Authenticated users can read party existence"` with `USING (true)`. While `parties_public` view hides `host_pin`, direct queries could still expose it.

**Current Situation:** After Part A removes `host_pin`, this policy becomes safe since there's no sensitive data to expose.

**Resolution:** Part A's migration removes the security risk by eliminating the sensitive column entirely.

---

### Part F: Add CORS Origin Validation (Low Priority)

The deleted `send-pin-recovery` function had CORS `*`. Since we're deleting it, no action needed.

For reference, the remaining edge functions already have proper origin validation:
- `verify-admin-pin` - Has origin allowlist
- `manage-wrestlers` - Has origin allowlist

---

### Part G: Security Definer Views Documentation

The `parties_public` view intentionally lacks `security_invoker=on` to allow anonymous users to verify party codes before authentication. This is acceptable because:
1. The view only exposes non-sensitive fields (code, status, is_demo, entrants)
2. No PII or authentication data is included
3. Required for the join flow to work

**Action:** Mark this finding as "Acceptable Risk" with documented justification.

---

### Implementation Order

```text
Phase 1: Database Cleanup (Blocking)
  |
  +-- 1.1 Create new update_party_status_by_host function
  +-- 1.2 Drop legacy PIN functions
  +-- 1.3 Remove host_pin column
  +-- 1.4 Update parties_public view
  +-- 1.5 Make solo_players.pin nullable
  +-- 1.6 Drop legacy solo login functions

Phase 2: Code Updates (Parallel)
  |
  +-- 2.1 Update DemoMode.tsx (remove host_pin)
  +-- 2.2 Update Index.tsx (remove host_pin)
  +-- 2.3 Update HostSetup.tsx (new RPC, remove localStorage PIN)
  +-- 2.4 Update HostControl.tsx (remove localStorage PIN)
  +-- 2.5 Update MyParties.tsx (remove localStorage PIN)
  +-- 2.6 Update QuickActionsSheet.tsx (remove localStorage PIN)

Phase 3: Edge Function Cleanup
  |
  +-- 3.1 Delete send-pin-recovery function
  +-- 3.2 Update supabase/config.toml

Phase 4: Terminology Updates
  |
  +-- 4.1 Update PlatformAdminVerify.tsx (PIN -> Passcode)

Phase 5: Security Finding Resolution
  |
  +-- 5.1 Mark parties_public view as acceptable
  +-- 5.2 Update security findings to reflect changes
```

---

### Technical Details

#### Files Modified Summary

| File | Change Type | Changes |
|------|-------------|---------|
| `src/pages/DemoMode.tsx` | Edit | Remove `host_pin: "0000"` from insert |
| `src/pages/Index.tsx` | Edit | Remove `host_pin: "0000"` from insert |
| `src/pages/HostSetup.tsx` | Edit | Remove localStorage PIN, use new RPC |
| `src/pages/HostControl.tsx` | Edit | Remove localStorage PIN references |
| `src/pages/MyParties.tsx` | Edit | Remove localStorage PIN references |
| `src/components/host/QuickActionsSheet.tsx` | Edit | Remove localStorage PIN cleanup |
| `src/pages/PlatformAdminVerify.tsx` | Edit | Change "PIN" to "Passcode" |
| `supabase/functions/send-pin-recovery/` | Delete | Entire directory |
| `supabase/config.toml` | Edit | Remove send-pin-recovery config |
| Database migration | Create | Drop columns, functions, create new RPC |

#### Core Functionality Preserved

- Party creation and joining (unchanged)
- Host verification via Supabase Auth (unchanged)
- Solo mode via email/password (unchanged)
- Demo mode (works without host_pin)
- TV Display and scoring (unchanged)
- Platform admin access (passcode still works, just renamed in UI)

#### Breaking Changes

None. All removed code paths are legacy and no longer executed by the application.
