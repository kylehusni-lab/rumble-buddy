
# Comprehensive Security Audit Report

This audit identifies security vulnerabilities across the application's database, authentication, edge functions, and client-side code. Findings are categorized by severity and include detailed remediation steps.

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | Needs immediate action |
| High | 4 | Needs action |
| Medium | 5 | Should address |
| Low | 3 | Informational |

The application has significant security gaps primarily due to:
1. **Disabled RLS on most tables** - exposing all data to anyone
2. **Plaintext PIN storage** - no hashing for host/solo PINs
3. **Client-side authentication logic** - easily bypassed
4. **Weak admin token validation** - tokens can be crafted by attackers

---

## Critical Findings

### 1. RLS Disabled on 7 of 9 Tables

**Severity:** Critical  
**Affected Tables:** `parties`, `picks`, `rumble_numbers`, `match_results`, `solo_players`, `solo_picks`, `solo_results`

**Current State:**
```sql
-- From linter results:
RLS Disabled: parties, picks, rumble_numbers, match_results, 
              solo_players, solo_picks, solo_results
RLS Enabled:  players (with policies), platform_config (read-only)
```

**Impact:**
- Anyone can read, modify, or delete ALL data from these tables
- Attackers can steal party codes, PINs, session IDs
- Score manipulation possible (edit `match_results`, `picks`)
- Cross-party data access (see other groups' picks/results)

**Evidence from database query:**
```
parties: 50 rows, 36 with host_pin exposed
solo_players: 1 row with plaintext PIN exposed
```

**Remediation:**
```sql
-- Enable RLS on all tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rumble_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_results ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies (examples below)
```

---

### 2. Plaintext PIN Storage

**Severity:** Critical  
**Affected Tables:** `parties.host_pin`, `solo_players.pin`

**Current Implementation (HostVerifyPin.tsx lines 96-98):**
```typescript
// Plaintext comparison - NO hashing
if (data.host_pin === pin) {
  localStorage.setItem(`party_${code}_pin`, pin);
  navigate(`/host/setup/${code}`);
}
```

**Current Implementation (useSoloCloud.ts lines 150-155):**
```typescript
// Plaintext query - NO hashing
const { data, error } = await supabase
  .from('solo_players')
  .select('*')
  .eq('email', email.toLowerCase().trim())
  .eq('pin', pin)  // Plaintext comparison!
  .maybeSingle();
```

**Impact:**
- Database breach exposes all PINs immediately
- Anyone with table read access can see all PINs
- 36 host PINs currently exposed in plaintext
- No protection against rainbow table attacks

**Remediation:**
1. Create edge functions for PIN verification
2. Hash PINs server-side using bcrypt
3. Migrate existing PINs (force reset on next login)
4. Store only hashed values in database

---

### 3. Forgeable Admin Tokens

**Severity:** Critical  
**Affected Files:** `verify-admin-pin/index.ts`, `update-platform-config/index.ts`

**Token Generation (verify-admin-pin line 42):**
```typescript
// Token = timestamp + UUID (no signature!)
const token = `${Date.now()}-${crypto.randomUUID()}`;
```

**Token Validation (update-platform-config lines 27-44):**
```typescript
// Only checks timestamp age - no signature verification!
const tokenParts = token.split("-");
const tokenTimestamp = parseInt(tokenParts[0], 10);
const tokenAge = Date.now() - tokenTimestamp;
if (tokenAge > maxAge) return error;
// MISSING: signature verification!
```

**Attack Vector:**
```javascript
// Attacker can craft valid tokens without knowing admin PIN:
const fakeToken = `${Date.now()}-${crypto.randomUUID()}`;
// This will pass validation!
```

**Impact:**
- Any attacker can craft a valid admin token
- Unauthorized platform configuration changes possible
- Wrestler lists can be manipulated by anyone

**Remediation:**
1. Use signed JWT tokens with server secret
2. Store token hash server-side for validation
3. Add token revocation list
4. Implement CSRF protection

---

## High Severity Findings

### 4. Client-Side Host Authentication

**Severity:** High  
**Affected File:** `HostVerifyPin.tsx`

**Current Flow:**
```typescript
// 1. Client fetches host_pin from database
const { data } = await supabase
  .from("parties")
  .select("host_pin")  // Exposed!
  .eq("code", code);

// 2. Client compares PIN locally
if (data.host_pin === pin) {
  // Grant access - easily bypassed!
}
```

**Attack Vector:**
1. Query `parties` table directly via Supabase client
2. Read `host_pin` for any party code
3. Use PIN to gain host access

**Current Exposure:** With RLS disabled, this query works for anyone:
```javascript
const { data } = await supabase.from('parties').select('host_pin');
// Returns ALL party PINs!
```

**Remediation:**
1. Create `verify-host-pin` edge function
2. Compare hashed PIN server-side
3. Return session token on success
4. Deny direct SELECT access to `host_pin` column

---

### 5. Session ID Exposure

**Severity:** High  
**Affected Tables:** `parties.host_session_id`, `players.session_id`

**Current Implementation (session.ts line 55-57):**
```typescript
export function isHostSession(partyHostSessionId: string): boolean {
  return getSessionId() === partyHostSessionId;
  // Client-side comparison - can be spoofed!
}
```

**Attack Vector:**
1. Query `parties.host_session_id` (RLS disabled)
2. Set stolen session ID in localStorage
3. `isHostSession()` returns true
4. Full host access granted

**Impact:**
- Session hijacking for any party
- Host impersonation possible
- No session expiration or rotation

**Remediation:**
1. Never expose session IDs in queryable tables
2. Use server-side session validation
3. Implement session expiration (24-48 hours)
4. Use httpOnly cookies instead of localStorage

---

### 6. Solo Player PIN Exposure

**Severity:** High  
**Affected Table:** `solo_players`

**Current State:**
- RLS disabled on `solo_players` table
- `pin` column contains plaintext 4-digit PINs
- `email` column exposes user emails
- Anyone can query: `SELECT * FROM solo_players`

**Login Implementation (useSoloCloud.ts lines 150-155):**
```typescript
const { data } = await supabase
  .from('solo_players')
  .select('*')  // Returns PIN in response!
  .eq('email', email)
  .eq('pin', pin);
```

**Impact:**
- Email harvesting for spam/phishing
- PIN brute force (only 10,000 combinations)
- Account takeover by reading email+PIN pairs

**Remediation:**
1. Enable RLS on `solo_players`
2. Create secure RPC for login (like `lookup_player_by_email`)
3. Hash PINs before storage
4. Rate limit login attempts

---

### 7. Cross-Party Data Access

**Severity:** High  
**Affected Tables:** `picks`, `rumble_numbers`, `match_results`

**Current State:**
With RLS disabled, any user can:
```javascript
// See all picks from all parties
const { data } = await supabase.from('picks').select('*');

// Modify another party's results
await supabase.from('match_results').insert({
  party_code: 'XXXX',  // Any party code!
  match_id: 'match1',
  result: 'Attacker Choice'
});
```

**Impact:**
- Competitive advantage by seeing others' picks
- Score manipulation across parties
- Data integrity compromise

**Remediation:**
Enable RLS with party_code scoping:
```sql
CREATE POLICY "Users can only access their party's picks"
ON picks FOR ALL
USING (party_code IN (
  SELECT party_code FROM players WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
));
```

---

## Medium Severity Findings

### 8. No Rate Limiting on PIN Attempts

**Severity:** Medium  
**Affected:** Host PIN, Solo PIN, Platform Admin PIN

**Current State:**
- No rate limiting on any PIN verification
- 4-digit PINs = 10,000 combinations
- Automated brute force takes seconds

**Remediation:**
1. Implement rate limiting in edge functions (5 attempts/hour)
2. Add exponential backoff after failures
3. Account lockout after 10 failed attempts
4. Consider 6-digit PINs for better security

---

### 9. Missing Server-Side Input Validation

**Severity:** Medium  
**Affected:** `players`, `solo_players`, `parties` tables

**Current Constraints:**
```sql
-- Only constraint found:
parties.code CHECK (code ~ '^\d{4}$')  -- Good!

-- Missing constraints:
-- email format validation
-- display_name length limits
-- PIN format validation
```

**Impact:**
- Invalid emails prevent communication
- Very long names could cause UI issues
- Non-digit PINs could be stored

**Remediation:**
```sql
ALTER TABLE players ADD CONSTRAINT email_format 
  CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');
ALTER TABLE players ADD CONSTRAINT name_length 
  CHECK (length(display_name) BETWEEN 1 AND 50);
ALTER TABLE solo_players ADD CONSTRAINT pin_format 
  CHECK (pin ~ '^\d{4,6}$');
```

---

### 10. Overly Permissive CORS

**Severity:** Medium  
**Affected Files:** All edge functions

**Current Configuration:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Allows ANY origin
  // ...
};
```

**Impact:**
- Cross-site request attacks possible
- Tokens can be used from any domain
- No origin validation

**Remediation:**
```typescript
const allowedOrigins = [
  "https://rumble-buddy.lovable.app",
  "https://id-preview--b2021f13-f1d4-4520-93bc-6b4e2c2aba98.lovable.app"
];

const origin = req.headers.get("Origin") || "";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
  // ...
};
```

---

### 11. localStorage for Sensitive Data

**Severity:** Medium  
**Affected Files:** Multiple

**Stored in localStorage:**
- `party_${code}_pin` - Host PIN in plaintext
- `platform_admin_session` - Admin session token
- `rumble_solo_player_id` - Player identifier
- `rumble_session_id` - Session identifier
- `rumble_player_data` - Player data including email

**Impact:**
- XSS attacks can steal all tokens
- Persistent storage (survives browser close)
- Shared across tabs (no isolation)

**Remediation:**
1. Use httpOnly cookies for session tokens
2. Store only non-sensitive identifiers client-side
3. Implement session encryption
4. Add XSS sanitization for all user inputs

---

### 12. RLS Policy Always True Warnings

**Severity:** Medium  
**Affected Table:** `players`

**Current Policies:**
```sql
-- From linter:
"Anyone can insert players" - WITH CHECK (true)
"Anyone can update players" - USING (true)
"Anyone can delete players" - USING (true)
```

**Impact:**
- Any user can delete any player
- Any user can update any player's data
- Points manipulation possible

**Note:** For session-based auth without Supabase Auth, these policies are partially acceptable, but should be scoped by party_code at minimum.

---

## Low Severity Findings

### 13. Console Logging of Errors

**Severity:** Low  
**Affected Files:** Multiple

**Example (useSoloCloud.ts line 89):**
```typescript
console.error('Error loading solo player:', err);
```

**Impact:**
- Error details visible in browser console
- May leak internal paths or data

**Remediation:**
Replace with generic user messages, log details server-side.

---

### 14. No CSRF Protection

**Severity:** Low  
**Affected:** All state-changing operations

**Current State:**
- No CSRF tokens used
- All operations use bearer tokens from localStorage
- Edge functions accept requests from any origin

**Remediation:**
Implement CSRF tokens for state-changing operations or use SameSite cookies.

---

### 15. Session Never Expires

**Severity:** Low  
**Affected:** `session_id` in players/parties tables

**Current State:**
- Session IDs generated once, never rotate
- No expiration mechanism
- Persist indefinitely in localStorage

**Remediation:**
1. Add `session_expires_at` column
2. Rotate session IDs periodically
3. Clear expired sessions on auth attempts

---

## Remediation Priority

### Phase 1: Critical (Immediate)
1. Enable RLS on all tables with appropriate policies
2. Create edge functions for PIN verification (host + solo)
3. Fix admin token validation with proper signing
4. Hash all PINs (requires migration)

### Phase 2: High (Within 1 Week)
5. Create secure views/RPC for sensitive data access
6. Remove session_id exposure from tables
7. Add rate limiting to all PIN endpoints
8. Scope all RLS policies by party_code

### Phase 3: Medium (Within 1 Month)
9. Add database constraints for input validation
10. Tighten CORS to specific origins
11. Migrate to httpOnly cookies for sessions
12. Improve RLS policies to scope by session/party

### Phase 4: Low (Ongoing)
13. Remove sensitive console logging
14. Implement CSRF protection
15. Add session expiration mechanism

---

## Summary Table

| Finding | Severity | Effort | Priority |
|---------|----------|--------|----------|
| RLS Disabled (7 tables) | Critical | Hard | 1 |
| Plaintext PINs | Critical | Medium | 1 |
| Forgeable Admin Tokens | Critical | Medium | 1 |
| Client-Side Host Auth | High | Medium | 2 |
| Session ID Exposure | High | Hard | 2 |
| Solo Player PIN Exposure | High | Medium | 2 |
| Cross-Party Data Access | High | Medium | 2 |
| No Rate Limiting | Medium | Easy | 3 |
| Missing Input Validation | Medium | Easy | 3 |
| Overly Permissive CORS | Medium | Easy | 3 |
| localStorage for Secrets | Medium | Medium | 3 |
| RLS Always True Warnings | Medium | Medium | 3 |
| Console Error Logging | Low | Easy | 4 |
| No CSRF Protection | Low | Medium | 4 |
| Session Never Expires | Low | Easy | 4 |

---

## Recommended Next Steps

1. **Enable RLS immediately** on `parties`, `solo_players`, and other tables
2. **Create secure edge functions** for all PIN verification
3. **Implement proper token signing** for admin authentication
4. **Hash existing PINs** and update verification logic
5. **Add database constraints** for input validation
6. **Restrict CORS** to known origins

Should I proceed with implementing any of these remediations?
