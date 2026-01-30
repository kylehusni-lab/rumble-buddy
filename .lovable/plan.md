

# Over The Top (OTT) - Complete Rebrand & Gated Launch Implementation

## Executive Summary

This is a comprehensive rebrand from "Royal Rumble Party Tracker" to "Over The Top (OTT)" with a new gated landing page, admin dashboard, and mobile UI optimizations. The existing game functionality will remain completely intact.

---

## Scope Analysis

| Category | What Changes | What Stays |
|----------|--------------|------------|
| **Root Route (/)** | New `HomePage.tsx` landing page | - |
| **Branding** | Logo, colors, typography updated | Inter font kept |
| **New Routes** | `/admin`, `/login` (admin auth) | All `/party/*`, `/solo/*`, `/player/*`, `/host/*` routes |
| **Database** | New `access_requests` table | All existing tables |
| **Authentication** | Admin login via Supabase Auth | Anonymous auth for players |

---

## Part 1: Database Schema

### New Table: `access_requests`

```sql
CREATE TABLE access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  play_style text NOT NULL CHECK (play_style IN ('Solo', 'Group')),
  group_size text CHECK (group_size IN ('2-5', '6-10')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  party_code text,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public INSERT)
CREATE POLICY "Anyone can submit access request"
  ON access_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/modify requests
CREATE POLICY "Admins can manage requests"
  ON access_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### User Roles Setup

```sql
-- Create role enum if not exists
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

---

## Part 2: Design System Update

### New CSS Variables (added to `:root`)

```css
/* OTT Brand Colors */
--ott-bg: 0 0% 0%;           /* #000 */
--ott-surface: 0 0% 4%;       /* #0a0a0a */
--ott-surface-elevated: 0 0% 7%;  /* #111 */
--ott-border: 0 0% 100% / 0.1;
--ott-text: 0 0% 100%;        /* #fff */
--ott-text-secondary: 0 0% 60%;  /* #999 */
--ott-accent: 45 91% 53%;     /* #f5c518 (Gold) */
```

### Logo SVGs

Two new SVG components will be created:
- `OttLogoMark` (32x32 for nav)
- `OttLogoHero` (300x300 for hero section)

Both use the "stacked bars" design with gold vertical bar and white horizontal bars at decreasing opacity.

---

## Part 3: Page Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/HomePage.tsx` | New branded landing page |
| `src/pages/AdminDashboard.tsx` | Commissioner mode - manage access requests |
| `src/pages/AdminLogin.tsx` | Email/password login for admins |
| `src/components/OttLogo.tsx` | Logo mark SVG components |
| `src/components/OttNavBar.tsx` | Fixed navigation with glass effect |
| `src/components/RequestAccessModal.tsx` | Modal form for access requests |
| `src/components/home/HeroSection.tsx` | Split-layout hero with countdown |
| `src/components/home/StorySection.tsx` | "Our Story" narrative section |
| `src/components/home/HowItWorksSection.tsx` | Tabbed preview section |
| `src/components/home/FeaturesSection.tsx` | 4-column feature grid |
| `src/components/home/FooterSection.tsx` | Simple footer with disclaimer |

---

## Part 4: Routing Changes

### Updated `App.tsx` Routes

```typescript
// NEW ROUTES
<Route path="/" element={<HomePage />} />        // Replaces current Index
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/login" element={<AdminLogin />} />
<Route path="/join" element={<JoinParty />} />   // Direct join page
<Route path="/demo" element={<DemoMode />} />    // Demo launcher
<Route path="/solo" element={<SoloSetup />} />   // Direct solo access

// PRESERVED (DO NOT TOUCH)
<Route path="/player/join" element={<PlayerJoin />} />
<Route path="/player/picks/:code" element={<PlayerPicks />} />
<Route path="/player/dashboard/:code" element={<PlayerDashboard />} />
<Route path="/host/*" element={...} />
<Route path="/tv/:code" element={<TvDisplay />} />
<Route path="/solo/setup" element={<SoloSetup />} />
<Route path="/solo/picks" element={<SoloPicks />} />
<Route path="/solo/dashboard" element={<SoloDashboard />} />
```

---

## Part 5: HomePage.tsx Structure

### Section Layout

```text
+==================================================+
|  [Nav] Logo OTT  |  Our Story  Features  | [Join] |
+==================================================+

+==================================================+
|  HERO SECTION (Split: Content Left, Logo Right)  |
|                                                  |
|  [Event Banner: NEXT EVENT - Royal Rumble]       |
|  [Countdown: 02d 14h 32m 15s]                    |
|                                                  |
|  Over The Top                                    |
|  Your tag team partner for watch party night...  |
|                                                  |
|  [Request Access]  [Join with Code]              |
|  Try the demo ->                                 |
+==================================================+

+==================================================+
|  OUR STORY SECTION                               |
|  Why we're obsessed with this stuff...           |
|  [Gold-bordered highlight box]                   |
+==================================================+

+==================================================+
|  HOW IT WORKS (Tabbed Preview)                   |
|  [Make Picks] [TV Mode] [Leaderboard] [Props]    |
|  +--------------------------------------------+  |
|  |  Preview content panel                     |  |
|  +--------------------------------------------+  |
+==================================================+

+==================================================+
|  FEATURES (4-column grid)                        |
|  [icon] Real-time   [icon] TV Mode               |
|  [icon] No Signup   [icon] Mobile-first          |
+==================================================+

+==================================================+
|  FOOTER                                          |
|  Unofficial fan application disclaimer           |
+==================================================+
```

---

## Part 6: Request Access Modal

### Modal Flow

1. User clicks "Request Access" CTA
2. Modal opens with form:
   - Name (text input)
   - Email (email input)
   - Play Style (Select: Solo / Group)
   - Group Size (Select: 2-5 / 6-10) - only shown if "Group" selected
3. On submit:
   - Insert row into `access_requests` with `status: 'pending'`
   - Show success message: "Thanks! Watch your email for your unique Party Code."
4. Admin manually approves via dashboard

---

## Part 7: Admin Dashboard

### Authentication Flow

1. Navigate to `/admin` (or `/admin/login`)
2. Login with email/password (standard Supabase Auth)
3. On success, check `user_roles` table for `admin` role
4. If authorized, show dashboard; otherwise redirect

### Dashboard Layout

```text
+==================================================+
|  [Logo] Commissioner Mode                [Logout] |
+==================================================+

+--------------------------------------------------+
|  Stats Row                                       |
|  [Pending: 12]  [Approved: 45]  [Total: 57]      |
+--------------------------------------------------+

+--------------------------------------------------+
|  Triage Table                                    |
|                                                  |
|  Status  | Name      | Email       | Actions    |
|  --------|-----------|-------------|------------|
|  Pending | Kyle H.   | kyle@...    | [Approve]  |
|  Approved| Sarah M.  | sarah@...   | [Email]    |
|  ...                                             |
+--------------------------------------------------+
```

### Approve Logic

1. Click [Approve & Generate]
2. Generate random 6-char alphanumeric code
3. Update row: `status = 'approved'`, `party_code = [CODE]`, `approved_at = now()`
4. Show [Email Code] button

### Email Logic (mailto:)

```javascript
const handleEmailCode = (request) => {
  const subject = encodeURIComponent(`Your Royal Rumble Party Code: ${request.party_code}`);
  const body = encodeURIComponent(
    `Here is your access code: ${request.party_code}\n\n` +
    `Go to https://rumble-buddy.lovable.app/join to get started.`
  );
  window.open(`mailto:${request.email}?subject=${subject}&body=${body}`);
};
```

---

## Part 8: Mobile UI Optimization

### Problem
Wrestler cards in prop selection are too small on mobile - faces not visible.

### Solution
On mobile viewports (`max-width: 768px`), wrestler cards transition from grid to **single-column list items**:

```text
Desktop (4-col grid):
+------+ +------+ +------+ +------+
| img  | | img  | | img  | | img  |
| name | | name | | name | | name |
+------+ +------+ +------+ +------+

Mobile (list):
+------------------------------------------+
| [72px avatar] | John Cena           [>]  |
|               | WWE                      |
+------------------------------------------+
| [72px avatar] | Roman Reigns        [>]  |
|               | SmackDown                |
+------------------------------------------+
```

This applies to:
- `WrestlerPickerModal.tsx`
- Any prop card wrestler grids

---

## Part 9: Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| Desktop (>1024px) | Full split-layout hero, 4-col features |
| Tablet (768-1024px) | Hero becomes single-column, logo moves above content |
| Mobile (<768px) | Hero title 40px, CTAs stack vertically, single-column grids |

---

## Part 10: Countdown Logic

```typescript
const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
const [isLive, setIsLive] = useState(false);

useEffect(() => {
  const eventDate = new Date('February 1, 2026 19:00:00 EST').getTime();
  
  const update = () => {
    const now = Date.now();
    const diff = eventDate - now;
    
    if (diff <= 0) {
      setIsLive(true);
      return;
    }
    
    setTimeRemaining({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  };
  
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
}, []);

// When isLive === true, change hero CTA to "JOIN LIVE PARTY" with pulsing animation
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Rename to `OldIndex.tsx` (backup), replace with redirect to `/` |
| `src/pages/HomePage.tsx` | **CREATE** - New landing page |
| `src/pages/AdminDashboard.tsx` | **CREATE** - Commissioner mode |
| `src/pages/AdminLogin.tsx` | **CREATE** - Admin login |
| `src/components/OttLogo.tsx` | **CREATE** - Logo SVG components |
| `src/components/OttNavBar.tsx` | **CREATE** - Fixed nav |
| `src/components/RequestAccessModal.tsx` | **CREATE** - Modal form |
| `src/components/home/*` | **CREATE** - Section components |
| `src/index.css` | **UPDATE** - Add OTT design variables |
| `src/App.tsx` | **UPDATE** - Add new routes |
| `supabase/migrations/` | **CREATE** - access_requests table, user_roles |

---

## Testing Checklist

1. Navigate to `/` - verify new OTT landing page renders
2. Click "Request Access" - verify modal opens and submits to database
3. Click "Join with Code" - verify navigates to `/join`
4. Click "Try the demo" - verify demo mode works
5. Navigate to `/admin` - verify redirect to login if not authenticated
6. Login as admin - verify dashboard shows access requests
7. Approve a request - verify code is generated
8. Click "Email Code" - verify mailto: link opens with pre-filled content
9. Test mobile viewport - verify wrestler cards use list layout
10. Verify all existing `/party/*`, `/solo/*`, `/host/*` routes still work

---

## Technical Notes

### Security Considerations
- Admin auth uses Supabase Auth (email/password), NOT localStorage PIN
- Role-based access uses `has_role()` security definer function
- RLS policies protect access_requests table

### Branding Notes
- "Over The Top" is the public brand name
- "OTT" is used as the short form
- Gold (#f5c518) is the primary accent
- The logo mark uses stacked horizontal bars representing "ranking/leaderboard"

### Preserved Functionality
- All existing party creation, joining, picks, and scoring logic
- Anonymous authentication for players
- Demo mode seeding
- TV display mode
- Solo mode

