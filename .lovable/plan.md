
# Go-Live Readiness: Consolidated Implementation Plan

## Summary

This plan addresses four critical issues discovered during testing:

1. **Group Mode Bug**: Women's Rumble picks showing Men's wrestlers due to substring matching error
2. **Solo Mode Bug**: Hardcoded entrant lists instead of dynamic platform config
3. **TV Display Bug**: Stuck in "Waiting" mode after event starts due to RLS blocking realtime subscription
4. **Security Hardening**: Rate limiting, CORS restrictions, and input validation for Edge Functions

---

## Part 1: Group Mode Edit Modal Bug (P0 - Critical)

### Problem
In `SinglePickEditModal.tsx`, the gender detection uses `matchId.includes("mens")` which incorrectly matches "womens" strings because "wo**mens**" contains "mens".

```javascript
"womens_rumble_winner".includes("mens")  // returns TRUE (bug!)
```

### Files to Modify
| File | Change |
|------|--------|
| `src/components/dashboard/SinglePickEditModal.tsx` | Fix gender detection in 4 places |

### Technical Changes

The fix reverses the logic to check for "womens" first in 4 locations (lines 38, 52, 65, 79):

```typescript
// Before (buggy)
const gender = matchId.includes("mens") ? "mens" : "womens";

// After (fixed)
const gender = matchId.includes("womens") ? "womens" : "mens";
```

---

## Part 2: Solo Mode Picks Fix (P0 - Bug)

### Problem
`SoloPicks.tsx` uses hardcoded `DEFAULT_MENS_ENTRANTS` and `DEFAULT_WOMENS_ENTRANTS` constants instead of fetching from `usePlatformConfig()`. This means Solo mode won't reflect entrant updates made via Platform Admin.

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/SoloPicks.tsx` | Add `usePlatformConfig` hook, update entrant props |

### Technical Changes

1. Replace hardcoded constants import with `usePlatformConfig` hook
2. Add `configLoading` to the loading state check
3. Update `RumbleWinnerCard` and `RumblePropsCard` props to use dynamic entrants

```typescript
// Add hook
const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();

// Update loading check
if (isLoading || configLoading || !isAuthenticated) { ... }

// Update card props
customEntrants={currentCard.gender === "mens" ? mensEntrants : womensEntrants}
```

---

## Part 3: TV Display Realtime Fix (P0 - Critical)

### Problem
After the host clicks "Start Event", the TV display stays stuck on "Waiting for Event to Start" screen. This happens because:

1. The TV display subscribes to realtime updates on the `parties` table
2. Current RLS policy only allows hosts to SELECT from `parties` (`auth.uid() = host_user_id`)
3. Realtime subscriptions require SELECT access to work
4. Even when opened by the host, the realtime subscription may fail silently

### Solution
Add a SELECT policy allowing party members to read the `parties` table. This enables realtime subscriptions for the TV display while maintaining security (only authenticated party members can read).

### Database Migration Required

```sql
-- Allow party members to read party data for realtime subscriptions
CREATE POLICY "Party members can read their party"
ON public.parties FOR SELECT
USING (
  auth.uid() = host_user_id 
  OR public.is_party_member(code)
);
```

### Alternative Solution (Fallback)
As a backup, add polling to the TV display that checks party status every 5 seconds while in pre_event state:

```typescript
// Add polling fallback for party status
useEffect(() => {
  if (!code || partyStatus !== "pre_event") return;
  
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from("parties_public")
      .select("status")
      .eq("code", code)
      .single();
    
    if (data?.status && data.status !== "pre_event") {
      setPartyStatus(data.status);
      // Trigger number reveal if just went live
      if (data.status === "live") {
        await loadRevealData();
      }
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, [code, partyStatus]);
```

---

## Part 4: Security Hardening (P1)

### 4a. Rate Limiting for Admin PIN Verification

Prevent brute-force attacks on the 4-digit platform admin PIN.

| File | Change |
|------|--------|
| `supabase/functions/verify-admin-pin/index.ts` | Add IP-based rate limiting (5 attempts per 15 min) |

### 4b. CORS Restriction

Replace wildcard CORS with allowed origins only.

| Files | Change |
|-------|--------|
| `supabase/functions/verify-admin-pin/index.ts` | Restrict to app domain origins |
| `supabase/functions/update-platform-config/index.ts` | Restrict to app domain origins |

### 4c. Input Validation for Platform Config

| File | Change |
|------|--------|
| `supabase/functions/update-platform-config/index.ts` | Validate array size (max 100) and string lengths (max 100 chars) |

---

## Implementation Order

| Step | Task | Priority | Type |
|------|------|----------|------|
| 1 | Fix `SinglePickEditModal.tsx` gender detection (4 lines) | P0 | Bug fix |
| 2 | Fix `SoloPicks.tsx` to use `usePlatformConfig` | P0 | Bug fix |
| 3 | Add RLS policy for party members to read parties + polling fallback for TV | P0 | Bug fix |
| 4 | Add rate limiting to `verify-admin-pin` | P1 | Security |
| 5 | Tighten CORS on both edge functions | P1 | Security |
| 6 | Add input validation to `update-platform-config` | P1 | Security |

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/SinglePickEditModal.tsx` | Fix gender detection (lines 38, 52, 65, 79) |
| `src/pages/SoloPicks.tsx` | Add `usePlatformConfig`, update loading check, update entrant props |
| `src/pages/TvDisplay.tsx` | Add polling fallback for party status during pre_event |
| `supabase/functions/verify-admin-pin/index.ts` | Add rate limiting, restrict CORS origins |
| `supabase/functions/update-platform-config/index.ts` | Restrict CORS origins, add input validation |

### Database Migration
| Change | Description |
|--------|-------------|
| Add SELECT policy on `parties` | Allow party members (not just host) to read party data for realtime |

---

## Supabase Linter Notes

The 10 "Anonymous Access Policies" warnings remain **expected behavior** because:
- The app uses Supabase Anonymous Auth as the primary authentication method
- All users sign in anonymously, then their `auth.uid()` is used for RLS scoping
- These warnings indicate the policies work for anonymous users, which is correct

---

## Testing Checklist

After implementation:
- [ ] Group mode (party 4605): Click edit on "Women's Winner" - verify Women's wrestlers displayed
- [ ] Group mode: Click edit on "Men's Winner" - verify Men's wrestlers displayed
- [ ] Group mode: Edit Women's Rumble Props (Final Four, First Elim, etc.) - verify Women's wrestlers
- [ ] Group mode: Edit Men's Rumble Props - verify Men's wrestlers
- [ ] Solo mode: Navigate to Women's Rumble Winner card - verify Women's wrestlers
- [ ] Solo mode: Navigate to Women's Rumble Props - verify Women's wrestlers
- [ ] **TV Display**: Open TV in new tab, then click "Start Event" in Host Setup - verify TV transitions from waiting to live view
- [ ] **TV Display**: Verify number reveal animation plays after event start
- [ ] Platform Admin: Test rate limiting (fail PIN 5 times, verify 429 response)
- [ ] Platform Admin: Verify CORS blocks requests from unauthorized origins
- [ ] Demo mode: Full flow verification with 6 players
