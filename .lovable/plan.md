
# Security Hardening & Code Quality Fixes

## Overview

This plan addresses 4 security and code quality issues identified in the audit:
1. Add `React.forwardRef()` to GuestStatusCard (console warning fix)
2. Restrict CORS to app domains in both edge functions
3. Tighten players table RLS to protect email addresses
4. Implement proper JWT verification in manage-wrestlers edge function

---

## 1. Add forwardRef to GuestStatusCard

The component receives refs but isn't wrapped in forwardRef, causing React warnings.

**File**: `src/components/host/GuestStatusCard.tsx`

**Change**: Wrap component with `React.forwardRef()` to properly forward refs to the root div:

```typescript
import { forwardRef } from "react";
import { Check, Clock } from "lucide-react";

interface GuestStatusCardProps {
  displayName: string;
  picksCount: number;
  picksCompleted: boolean;
  totalPicks?: number;
}

export const GuestStatusCard = forwardRef<HTMLDivElement, GuestStatusCardProps>(
  ({ displayName, picksCount, picksCompleted, totalPicks = 7 }, ref) => {
    return (
      <div ref={ref} className="p-4 bg-muted/50 rounded-lg border border-border">
        {/* ... existing content ... */}
      </div>
    );
  }
);

GuestStatusCard.displayName = "GuestStatusCard";
```

---

## 2. Restrict CORS Headers in Edge Functions

Both edge functions currently use `Access-Control-Allow-Origin: "*"` which allows any domain. We'll create a helper function to validate origins against allowed domains.

**Files**: 
- `supabase/functions/verify-admin-pin/index.ts`
- `supabase/functions/manage-wrestlers/index.ts`

**Allowed Origins**:
- `https://rumble-buddy.lovable.app` (production)
- `https://*.lovable.app` (preview domains)
- `http://localhost:*` (local development)

**Implementation**: Add origin validation function that returns appropriate CORS headers:

```typescript
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  const allowedPatterns = [
    /^https:\/\/rumble-buddy\.lovable\.app$/,
    /^https:\/\/.*\.lovable\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
  ];
  
  const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
```

---

## 3. Tighten Players Table RLS SELECT Policy

**Current Problem**: The SELECT policy allows party members to read ALL columns including email from other players. Although the app uses `players_public` view, a determined attacker could query the base table directly.

**Current Policy**:
```sql
((user_id = auth.uid()) OR is_party_member(party_code) OR is_party_host(party_code))
```

**Solution**: Create a SECURITY INVOKER view that only exposes non-PII columns, then restrict the base table's SELECT policy to only allow users to read their own row. For party member/host lookups, the view already exists (`players_public`).

**Database Migration**:

```sql
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Players can read party members" ON public.players;

-- Create new restrictive SELECT policy - users can only read their OWN row directly
-- For viewing other party members, use players_public view (which excludes email)
CREATE POLICY "Players can read own record only"
  ON public.players
  FOR SELECT
  USING (user_id = auth.uid());

-- Ensure players_public view has security_invoker for proper RLS
DROP VIEW IF EXISTS public.players_public;
CREATE VIEW public.players_public
WITH (security_invoker=on) AS
  SELECT id, display_name, joined_at, party_code, points
  FROM public.players;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.players_public TO authenticated;
GRANT SELECT ON public.players_public TO anon;
```

**Note**: The app already uses `players_public` for all party member lookups, so no code changes needed.

---

## 4. Fix JWT Verification in manage-wrestlers Edge Function

**Current Problem**: Token validation only checks `token.length < 10` - any 10+ character string bypasses auth.

**Solution**: Use jose's `jwtVerify` to cryptographically verify the JWT token, matching the security level of `verify-admin-pin`.

**File**: `supabase/functions/manage-wrestlers/index.ts`

**Changes**:

1. Import jose's jwtVerify
2. Add the same `getSigningSecret()` function used in verify-admin-pin
3. Replace length check with actual JWT verification:

```typescript
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

// Same signing secret derivation as verify-admin-pin
async function getSigningSecret(): Promise<Uint8Array> {
  const secretStr = Deno.env.get("PLATFORM_ADMIN_PIN") || "fallback-secret-key";
  const encoder = new TextEncoder();
  const data = encoder.encode(secretStr + "-jwt-signing-key-v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

// In the handler, for mutation actions:
if (action !== "list") {
  try {
    const secret = await getSigningSecret();
    const { payload } = await jwtVerify(token, secret);
    
    // Verify the token has the platform_admin role
    if (payload.role !== "platform_admin") {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
```

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| `src/components/host/GuestStatusCard.tsx` | Wrap with forwardRef |
| `supabase/functions/verify-admin-pin/index.ts` | Add origin validation for CORS |
| `supabase/functions/manage-wrestlers/index.ts` | Add origin validation + JWT verification |
| Database migration | Tighten players SELECT policy, recreate view with security_invoker |

---

## Security Impact

| Issue | Before | After |
|-------|--------|-------|
| Email exposure | Party members could query base table | Only own record accessible |
| Edge function CORS | Any origin allowed | Only app domains |
| Wrestler admin auth | Length check only | Cryptographic JWT verification |
| React warnings | Console errors about refs | Clean console |

