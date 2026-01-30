
# Unify Solo Mode Authentication with Party Auth System

## Overview

This plan converts Solo Mode from its current email + 4-digit PIN authentication to use the same Supabase email/password authentication used by Party Mode. This unifies the authentication experience across the platform and allows users to see both their party memberships and solo mode access from a single dashboard.

---

## Current vs. New Architecture

### Current State
- **Party Mode**: Email/password via Supabase Auth, `user_id` stored in `players` table
- **Solo Mode**: Email + 4-digit PIN via custom RPC functions, separate authentication flow

### New State
- **Both Modes**: Email/password via Supabase Auth
- **Solo Mode**: Links `solo_players.user_id` to `auth.users(id)` (already exists in schema)
- **Unified Dashboard**: My Parties page shows both party memberships AND solo mode access

---

## User Experience Changes

### Before
- Party users sign in at `/sign-in` with email/password
- Solo users sign in at `/solo/setup` with email + 4-digit PIN
- No single view of all access types

### After
- All users sign in at `/sign-in` with email/password
- `/solo/setup` redirects authenticated users, or offers signup/login with password
- `/my-parties` shows both party memberships AND solo mode section
- Users approved for both see unified view

---

## Technical Implementation

### Phase 1: Update Solo Mode Authentication

**Modify `src/pages/SoloSetup.tsx`**
- Replace PIN-based registration with password-based signup using `supabase.auth.signUp`
- Replace PIN-based login with password-based login using `supabase.auth.signInWithPassword`
- Remove PIN recovery button (use standard forgot password flow)
- On successful auth, check if `solo_players` record exists for user
  - If exists: Load existing solo player data
  - If not: Create new `solo_players` record linked to `auth.uid()`

**Modify `src/hooks/useSoloCloud.ts`**
- Replace `register()` and `login()` with Supabase Auth calls
- Remove PIN-related parameters
- Load solo player by `user_id` match instead of stored player ID
- Keep existing cloud sync functions (picks, results)

### Phase 2: Enhance My Parties Dashboard

**Modify `src/pages/MyParties.tsx`**
- Add query to check for `solo_players` record with matching `user_id`
- Add "Solo Mode" section above/below party sections
- Solo section shows:
  - Solo player display name
  - Quick access button to solo dashboard
  - Option to "Start Solo Mode" if no record exists

### Phase 3: Update Sign In Flow

**Modify `src/pages/SignIn.tsx`**
- After successful login, redirect to `/my-parties` (already does this)
- My Parties page now handles showing both party and solo access

**Modify routing logic**
- `/solo/setup` for authenticated users: Check for existing solo record
  - If has solo record: Redirect to `/solo/dashboard`
  - If no solo record: Show "Set up Solo Mode" form (just display name, since already authenticated)

### Phase 4: Database Cleanup (Optional Future)

The `pin` column in `solo_players` becomes obsolete but can remain for backward compatibility. No immediate migration needed since:
- New users won't have PINs
- Existing users can be prompted to set a password on next login attempt

---

## File Changes Summary

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/SoloSetup.tsx` | Replace PIN auth with password auth, integrate with Supabase Auth |
| `src/hooks/useSoloCloud.ts` | Remove PIN logic, use `useAuth` for authentication state |
| `src/pages/MyParties.tsx` | Add Solo Mode section showing solo player access |
| `src/pages/SoloDashboard.tsx` | Update auth check to use unified auth |
| `src/pages/SoloPicks.tsx` | Update auth check to use unified auth |

### Database Changes

**New RPC Function (optional)**
Create `get_or_create_solo_player` to atomically check/create solo player record:
```sql
CREATE OR REPLACE FUNCTION public.get_or_create_solo_player(
  p_display_name text DEFAULT 'Me'
)
RETURNS TABLE(id uuid, display_name text, created_at timestamptz, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_display_name text;
  v_created_at timestamptz;
  v_is_new boolean := false;
BEGIN
  -- Check for existing record
  SELECT sp.id, sp.display_name, sp.created_at
  INTO v_id, v_display_name, v_created_at
  FROM public.solo_players sp
  WHERE sp.user_id = v_user_id;
  
  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO public.solo_players (email, pin, display_name, user_id)
    VALUES (
      COALESCE((SELECT email FROM auth.users WHERE id = v_user_id), 'unknown'),
      '', -- Empty PIN for password-auth users
      COALESCE(NULLIF(trim(p_display_name), ''), 'Me'),
      v_user_id
    )
    RETURNING solo_players.id, solo_players.display_name, solo_players.created_at
    INTO v_id, v_display_name, v_created_at;
    v_is_new := true;
  END IF;
  
  RETURN QUERY SELECT v_id, v_display_name, v_created_at, v_is_new;
END;
$$;
```

---

## Migration Path for Existing Solo Users

Existing solo users with PIN-only auth can be migrated:
1. When they try to access solo mode, prompt them to create a password
2. Use their existing email to create/link Supabase Auth account
3. Link their `solo_players` record via `user_id`

This maintains backward compatibility while encouraging migration to unified auth.

---

## Security Considerations

1. Solo player data remains protected by RLS with `user_id` check
2. Password auth is more secure than 4-digit PIN (brute force resistant)
3. Forgot password uses standard Supabase email recovery flow
4. No sensitive data exposed in public views

---

## Summary of Changes

1. **SoloSetup.tsx**: Convert from PIN to password auth using Supabase Auth
2. **useSoloCloud.ts**: Simplify to use `useAuth` hook, remove PIN-based functions
3. **MyParties.tsx**: Add Solo Mode section for unified access view
4. **SoloDashboard/SoloPicks**: Update to use unified auth check
5. **Database**: Add RPC function for atomic solo player creation
