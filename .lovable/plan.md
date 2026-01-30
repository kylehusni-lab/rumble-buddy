

## Fix Party Data and Improve Host Access Flow

### Issues Identified

**1. Party 9328 Cleanup**
Party `9328` appears to be a test/broken party with demo players. This needs to be deleted from the database.

**2. Party X629M5 Shows as "Joined" Instead of "Hosted"**
When an admin approves a host request, the party is created with `host_user_id` set to the **admin's user ID** instead of the requesting host's ID. When Kyle (the actual host) later joined via the normal PlayerAuth flow, he was added as a regular player - not recognized as the host.

Current flow:
```text
Admin approves request
   -> Party created with host_user_id = ADMIN'S ID
   -> Kyle receives code via email
   -> Kyle signs up/logs in at /player/auth?code=X629M5
   -> Kyle is created as a PLAYER (not host)
   -> Kyle sees party under "Parties I've Joined" (wrong!)
```

**3. No Path for Approved Hosts to Claim Their Party**
When someone requests access as a "Group" host, there's no mechanism for them to:
- Claim ownership of the party when they first join
- Have `host_user_id` updated to their `auth.uid()`
- Be redirected to host setup instead of player dashboard

---

### Solution

#### A. Delete Party 9328 (Data Cleanup)
Use Supabase to delete the party and associated records.

```sql
-- Delete related records first
DELETE FROM players WHERE party_code = '9328';
DELETE FROM rumble_numbers WHERE party_code = '9328';
DELETE FROM match_results WHERE party_code = '9328';
DELETE FROM picks WHERE player_id IN (
  SELECT id FROM players WHERE party_code = '9328'
);

-- Party delete requires admin RPC or direct query
```

#### B. Fix Party X629M5 Host Ownership
Update the party to set Kyle as the actual host.

```sql
UPDATE parties 
SET host_user_id = 'ba1a255c-e878-44da-83b1-082ac5413193'
WHERE code = 'X629M5';
```

#### C. Improve Admin Approval Flow (Code Changes)

**File**: `src/pages/AdminDashboard.tsx`

When admin approves a request, create the party with `host_user_id = null` instead of the admin's user ID. This leaves ownership unclaimed until the actual host joins.

```typescript
// Current (broken)
const { error: partyError } = await supabase
  .from("parties")
  .insert({
    code: code,
    host_session_id: `admin-approved-${request.id}`,
    host_user_id: user.id, // <-- Admin's ID (wrong!)
    status: "pre_event",
  });

// Fixed
const { error: partyError } = await supabase
  .from("parties")
  .insert({
    code: code,
    host_session_id: `admin-approved-${request.id}`,
    host_user_id: null, // <-- Leave null for host to claim
    status: "pre_event",
  });
```

**Note**: This requires a database change since the current RLS policy requires `host_user_id` to match `auth.uid()` for INSERT. We need a migration to allow admin-created parties.

#### D. Add Host Claim Flow

**File**: `src/pages/PlayerAuth.tsx`

When a user joins a party that has no `host_user_id`, check if they're the intended host (based on access_request email match) and offer to claim host ownership.

**New Logic**:
1. After user authenticates, check if `parties.host_user_id IS NULL`
2. If null AND user's email matches an approved `access_request` for this party code, prompt to claim as host
3. If they claim, update `parties.host_user_id` to their `auth.uid()` and redirect to host setup

#### E. Include Host Flag in Email Link

**File**: `src/pages/AdminDashboard.tsx`

Update the email template to include `&host=true` in the join URL for approved Group requests.

```typescript
const handleEmailCode = (request: AccessRequest) => {
  const isHost = request.play_style === "Group";
  const joinUrl = isHost 
    ? `https://therumbleapp.com/join?code=${request.party_code}&host=true`
    : `https://therumbleapp.com/join?code=${request.party_code}`;
  
  // ... rest of email template
};
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Database | Delete party 9328 and fix X629M5 ownership |
| `src/pages/AdminDashboard.tsx` | Create parties with `host_user_id = null`, update email with `&host=true` |
| `src/pages/PlayerAuth.tsx` | Add host claim detection and redirect logic |
| Database migration | Add RLS policy for admin party creation |

---

### Database Changes Required

**Migration 1**: Allow admin-created parties with null host_user_id
```sql
-- Add policy for admin party creation
CREATE POLICY "Admins can create parties" ON parties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
  );
```

**Migration 2**: Allow host to claim unclaimed party
```sql
-- Add policy for claiming unclaimed party as host
CREATE POLICY "Users can claim unclaimed parties" ON parties
  FOR UPDATE
  TO authenticated
  USING (host_user_id IS NULL)
  WITH CHECK (auth.uid() = host_user_id);
```

---

### User Flow After Fix

**Host requesting access:**
```text
1. User submits "Request Access" form (play_style = "Group")
2. Admin approves -> Party created with host_user_id = NULL
3. Admin emails code to user with link: /join?code=X629M5&host=true
4. User clicks link -> /player/auth?code=X629M5&host=true
5. User signs up/logs in
6. System detects unclaimed party + host=true flag
7. System claims party: UPDATE parties SET host_user_id = user.id
8. User redirected to /host/setup/X629M5
```

**Regular player joining:**
```text
1. Player enters code at /join
2. Player signs up/logs in at /player/auth?code=X629M5
3. System detects party has host_user_id set
4. Player created as regular player
5. Player redirected to /player/picks/X629M5
```

