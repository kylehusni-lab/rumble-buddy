
# Sign In Option and User Dashboard for Party Members

## Overview

Currently, party hosts and players can only access their dashboards through the party join flow (`/player/auth?code=XXX`). Once signed in, if a user navigates away or closes their browser, there's no way to get back to their parties without re-entering a code. This plan adds a standalone sign-in option and a personal dashboard showing all parties a user belongs to.

---

## What We Will Build

### 1. Homepage Sign In Button
Add a "Sign In" button to the navigation bar that:
- Shows for unauthenticated users alongside "Join Party"
- Changes to "My Parties" for authenticated users
- Works on both desktop and mobile nav

### 2. Standalone Sign In Page (`/sign-in`)
A new page for users to log in without needing a party code:
- Email and password login form
- "Forgot password?" link (already built)
- Link to join a party if they don't have an account
- After login, redirects to the new "My Parties" page

### 3. My Parties Page (`/my-parties`)
A new dashboard showing all parties the authenticated user belongs to:
- Lists each party with:
  - Party code
  - Status badge (pre_event, live, ended)
  - Their display name in that party
  - Points scored
- Click any party to go to that party's dashboard
- Quick link to join a new party
- Sign out button

---

## User Flows

```text
Unauthenticated User:
  Homepage -> "Sign In" -> /sign-in -> Login -> /my-parties

Authenticated User (returning):
  Homepage -> "My Parties" -> /my-parties -> Select party -> /player/dashboard/:code

New User:
  Homepage -> "Join Party" -> /join -> Enter code -> /player/auth -> Create account -> /player/picks/:code
```

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/pages/SignIn.tsx` | Standalone sign-in page with email/password form |
| `src/pages/MyParties.tsx` | Dashboard showing all user's parties |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for `/sign-in` and `/my-parties` |
| `src/components/OttNavBar.tsx` | Add Sign In / My Parties button with auth state detection |
| `src/components/home/HeroSection.tsx` | Optionally add "Sign In" link below CTAs |

### Database Query

To fetch user's parties, we'll query the `players` table joined with `parties_public`:

```sql
SELECT 
  p.id as player_id,
  p.party_code,
  p.display_name,
  p.points,
  pp.status
FROM players p
JOIN parties_public pp ON pp.code = p.party_code
WHERE p.user_id = auth.uid()
ORDER BY pp.created_at DESC;
```

This works with existing RLS since players can read their own records.

### Auth State in NavBar

The navbar will use the `useAuth` hook to detect authentication:
- `isLoading`: Show nothing (prevent flash)
- `isAuthenticated`: Show "My Parties" button
- Not authenticated: Show "Sign In" button

---

## Security Considerations

1. RLS already enforces that players can only read their own records
2. The `parties_public` view is safe for authenticated reads
3. No new database changes required - using existing schema
4. Session persistence handled by Supabase Auth

---

## Files Summary

**Create:**
- `src/pages/SignIn.tsx` - Standalone login page
- `src/pages/MyParties.tsx` - User's parties dashboard

**Modify:**
- `src/App.tsx` - Add new routes
- `src/components/OttNavBar.tsx` - Add auth-aware navigation button
