

# Commissioner Mode Expansion + User Authentication

## Summary
Transform Commissioner Mode into a full admin panel with party management, and require proper user authentication (email/password) for party members instead of anonymous auth.

---

## Current State Analysis

**Access Request Flow (today):**
1. User submits request via landing page modal
2. Admin approves in Commissioner Mode, generates 6-char code
3. User receives code, goes to `/join`, enters it
4. User provides name/email and joins with **anonymous Supabase auth**

**Key Gap:** Players currently use anonymous auth - no real accounts, no login/password, no way to enforce identity or manage access properly.

---

## What We Will Build

### Part 1: Enhanced Commissioner Mode Dashboard

Add new sections to the existing `/admin` dashboard:

**1. Access Requests (Enhanced)**
- Add "Reject" button alongside Approve
- Show rejected requests in a separate section or with status badge

**2. Active Parties View (New Section)**
- Table showing all parties with:
  - Party Code
  - Host Name/Email
  - Member Count
  - Status (pre_event / live / ended)
  - Created Date
- Click into any party to manage members

**3. Party Management Modal/View**
- View all members in a party
- Remove individual members
- Add member by email (creates invite or directly adds if user exists)

**4. Create Party Directly (New Feature)**
- Button to generate a new party code
- Optionally assign to an approved access request or create standalone

---

### Part 2: Real User Authentication for Party Members

Replace anonymous auth with email/password signup:

**New Player Join Flow:**
1. User enters party code at `/join`
2. Redirected to `/player/auth?code=XXXX`
3. Two tabs: **Sign Up** | **Log In**
4. Sign up requires: Email, Password, Display Name
5. On success, user is linked to the party and redirected to picks

**Database Changes:**
- Players table already has `user_id` - we enforce it's not null for new joins
- Enable email auto-confirm in auth settings (no email verification delays)

**Key Files to Modify:**
- `src/lib/auth.ts` - Add signUp/signIn functions
- `src/pages/PlayerJoin.tsx` - Redirect to auth flow instead of inline form
- Create `src/pages/PlayerAuth.tsx` - New signup/login page
- `src/hooks/useAuth.ts` - Add signUp/signIn methods

---

## Technical Implementation

### Database Changes

```text
1. Add 'rejected_at' column to access_requests table
   - Allows tracking rejection alongside approval

2. Create admin view for parties
   - Security definer function to fetch all parties with member counts
   - Only callable by admin role
```

### New Components

```text
src/pages/AdminDashboard.tsx (modify)
  - Add Tabs: Requests | Parties
  - Add Reject button to pending requests
  - Add ActivePartiesTab component

src/components/admin/ActivePartiesTab.tsx (new)
  - Lists all parties with stats
  - Links to party detail

src/components/admin/PartyManagementModal.tsx (new)
  - View/remove party members
  - Add member by email

src/pages/PlayerAuth.tsx (new)
  - Signup/Login tabs
  - Party code passed via query param
  - Auto-confirm email setting enabled
```

### Auth Flow Changes

```text
Current:
  JoinParty -> PlayerJoin (name/email form) -> Anonymous Auth -> Dashboard

New:
  JoinParty -> PlayerAuth (signup/login tabs) -> Real Auth -> Dashboard
```

---

## Security Considerations

1. **Admin-only functions** - All party management uses `has_role(auth.uid(), 'admin')` checks
2. **Real user accounts** - Players have proper Supabase auth accounts, not anonymous
3. **Auto-confirm emails** - No friction for party night (configure via auth settings)
4. **RLS enforcement** - Players can only access parties they belong to

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Add tabs, reject button, parties section |
| `src/components/admin/ActivePartiesTab.tsx` | New - party list view |
| `src/components/admin/PartyManagementModal.tsx` | New - member management |
| `src/pages/PlayerAuth.tsx` | New - signup/login page |
| `src/pages/PlayerJoin.tsx` | Modify - redirect to auth |
| `src/lib/auth.ts` | Add signUp/signIn functions |
| `src/hooks/useAuth.ts` | Add signUp/signIn methods |
| Database migration | Add rejected_at, admin party view function |

---

## User Experience Summary

**For You (Commissioner Mode):**
- Approve OR Reject access requests
- View all active parties at a glance
- Click into any party to see members and remove if needed
- Create party codes directly

**For Party Members:**
- Enter code at `/join`
- Create account with email/password (or log in if returning)
- Proper user identity tied to their picks

