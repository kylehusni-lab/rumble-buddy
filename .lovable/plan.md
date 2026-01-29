

# Security & Authentication Architecture Rework

## Problem Summary

The current system uses a custom authentication pattern (session IDs + PINs stored in localStorage) without real Supabase Auth. This creates several issues:

- **RLS Friction**: Policies can't use `auth.uid()` since there's no authenticated user, forcing workarounds like restrictive `SELECT USING (false)` policies with public views
- **Fragile Session Management**: Session IDs in localStorage can be lost, spoofed, or cleared
- **Overly Permissive Writes**: Many tables allow anyone to INSERT/UPDATE/DELETE with `true` conditions
- **Complex Workarounds**: The current design requires constant switching between tables and views, plus RPC functions for almost every operation

## Proposed Solution: Hybrid Approach

Implement **Supabase Anonymous Auth** combined with the existing PIN system. This gives you real authenticated users without requiring email/password signup, while keeping the simple UX.

### Why Anonymous Auth?

- **Real `auth.uid()`**: RLS can properly scope data access to the authenticated user
- **Session Persistence**: Supabase handles session refresh and persistence
- **No UX Change**: Users still just enter a name + code - no passwords needed
- **Demo Mode Compatible**: Anonymous users work perfectly for testing
- **Upgrade Path**: Anonymous users can later link their account to email if desired

## Architecture Changes

### 1. Authentication Flow

**Group Mode (Players/Guests):**
```
1. User enters group code + name + email
2. App calls supabase.auth.signInAnonymously()
3. On success, create/update player record with auth.uid()
4. RLS uses auth.uid() to scope all player data access
```

**Group Mode (Hosts):**
```
1. Host creates group (automatically creates anonymous auth session)
2. Host sets 4-digit PIN (stored hashed in parties table)
3. On return, host enters PIN to verify ownership
4. PIN verification links to the original auth user OR upgrades session
```

**Solo Mode:**
```
1. User can sign in anonymously OR with email/PIN (for cross-device sync)
2. Anonymous users get full functionality on that device
3. Email+PIN users can access from any device
```

**Demo Mode:**
```
1. Creates anonymous session automatically
2. Seeds demo data linked to the anonymous user
3. Works exactly as before - no changes needed
```

### 2. Database Schema Changes

**Add `user_id` column to key tables:**

| Table | Change |
|-------|--------|
| `parties` | Add `host_user_id uuid references auth.users(id)` |
| `players` | Add `user_id uuid references auth.users(id)` |
| `solo_players` | Add `user_id uuid references auth.users(id)` |

**Note:** Keep existing `session_id` columns temporarily for migration, then deprecate.

### 3. RLS Policy Redesign

**Replace the current confusing pattern with simple, secure policies:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `parties` | `auth.uid() = host_user_id` (hosts only) | `auth.uid() IS NOT NULL` | `auth.uid() = host_user_id` | None |
| `players` | Players in same party can see each other | Own record only | Own record only | None |
| `picks` | Own picks + party members (after event) | Own record only | Own record (if not scored) | None |
| `rumble_numbers` | Party members can read | Host only | Host only | Host only |

**Keep public views for truly public data** (leaderboard, TV display) but fix with `security_invoker=on`.

### 4. Code Changes

**Session Management:**
- Replace custom `getSessionId()` with `supabase.auth.getSession()`
- Replace `setPlayerSession()` with storing supplementary data after auth
- Use `supabase.auth.onAuthStateChange()` for session persistence

**Data Queries:**
- Remove most `parties_public` view usage - query `parties` directly
- RLS automatically scopes data based on `auth.uid()`

**RPC Functions:**
- Keep PIN verification RPCs (still needed for host access)
- Simplify `save_solo_pick` and similar - RLS handles ownership

## Migration Strategy

**Phase 1 - Add Anonymous Auth (non-breaking):**
1. Add `user_id` columns (nullable initially)
2. Implement anonymous sign-in on all entry points
3. Populate `user_id` on new records
4. Add new RLS policies alongside existing ones

**Phase 2 - Backfill & Migrate:**
1. Create migration script to link existing sessions to anonymous users
2. Update RLS to prefer `user_id` when available
3. Remove dependency on `session_id`

**Phase 3 - Cleanup:**
1. Make `user_id` non-nullable
2. Drop legacy `session_id` columns
3. Remove old RLS policies
4. Remove public views (if no longer needed)

## Demo Mode Compatibility

Demo mode will continue to work seamlessly:
- `seedDemoParty()` creates anonymous session automatically
- Demo players are created with their own anonymous auth sessions
- PIN "0000" works as before for host access
- All existing demo functionality preserved

## Technical Implementation Details

### Files to Modify

**New/Updated Files:**
- `src/lib/auth.ts` - New auth utilities wrapping Supabase Auth
- `src/hooks/useAuth.ts` - React hook for auth state
- `src/lib/session.ts` - Refactor to use Supabase sessions
- `src/pages/PlayerJoin.tsx` - Add anonymous sign-in
- `src/pages/Index.tsx` - Add anonymous sign-in on group create
- `src/pages/SoloSetup.tsx` - Support both anonymous and email auth
- `src/lib/demo-seeder.ts` - Create anonymous sessions for demo users

**Database Migrations:**
- Add `user_id` columns to `parties`, `players`, `solo_players`
- Update RLS policies (add new, keep old for transition)
- Fix views with `security_invoker=on`
- Create helper function `is_party_member(party_code)` for RLS

### Security Improvements

1. **Hashed PINs**: Store host PINs using bcrypt (already partially done via RPC)
2. **Rate Limiting**: Add rate limiting to PIN verification (edge function)
3. **Session Rotation**: Supabase handles secure session rotation automatically
4. **Audit Trail**: `auth.users` provides built-in audit capabilities

## Benefits

| Before | After |
|--------|-------|
| Custom session management | Built-in Supabase session handling |
| Can't use `auth.uid()` in RLS | Full RLS capability with `auth.uid()` |
| `SELECT USING (false)` + views pattern | Direct table access with proper RLS |
| 11 "RLS always true" warnings | Properly scoped write policies |
| Fragile localStorage sessions | Persistent, secure auth tokens |

## Rollback Plan

If issues arise:
1. `user_id` columns are nullable - old `session_id` logic still works
2. Old RLS policies kept during transition - can revert by removing new policies
3. No data migration required for rollback - just code changes

