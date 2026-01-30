
# Host Dashboard Separation and Demo PIN Bypass

## Overview

This plan addresses two improvements:
1. Separate the My Parties dashboard to show hosted parties and joined parties in distinct sections
2. Skip the PIN verification step for demo parties

---

## What We Will Build

### 1. Separated Party Sections in My Parties Dashboard

The My Parties page will be reorganized into two collapsible sections:

**"My Hosted Parties"**
- Shows parties where the user is the host (has Crown icon)
- Each card shows: party code, status, member count
- Click navigates to Host Setup/Control

**"Parties I've Joined"**  
- Shows parties where the user is a participant (not host)
- Each card shows: party code, display name, points, status
- Click navigates to Player Dashboard

If a user is both host AND player of a party (common), it only appears in "My Hosted Parties" section.

### 2. Demo Party PIN Bypass

When accessing a demo party's host pages, the PIN verification screen will be skipped entirely:
- Check if the party has `is_demo = true`
- If demo, auto-verify and redirect to host setup
- Keeps the PIN screen for regular parties

---

## User Flow Changes

```text
Current Flow (Demo Party):
  MyParties -> Click Demo Party -> /host/verify-pin/:code -> Enter PIN -> /host/setup/:code

New Flow (Demo Party):
  MyParties -> Click Demo Party -> /host/setup/:code (direct)

Regular Party Flow (unchanged):
  MyParties -> Click Party -> /host/verify-pin/:code -> Enter PIN -> /host/setup/:code
```

---

## Technical Implementation

### Database Change

Update the `parties_public` view to expose the `is_demo` column (this is safe - not sensitive data):

```sql
DROP VIEW IF EXISTS public.parties_public;

CREATE VIEW public.parties_public
WITH (security_invoker=on) AS
SELECT 
  code,
  created_at,
  event_started_at,
  mens_rumble_entrants,
  status,
  womens_rumble_entrants,
  is_demo  -- NEW: exposed for demo detection
FROM public.parties;

GRANT SELECT ON public.parties_public TO authenticated;
```

### File Changes

| File | Changes |
|------|---------|
| `src/pages/MyParties.tsx` | Reorganize into two sections: hosted vs joined parties |
| `src/pages/HostVerifyPin.tsx` | Check `is_demo` flag and auto-bypass PIN for demos |

### MyParties.tsx Updates

- Fetch `is_demo` from `parties_public` for each party
- Split parties into two arrays: `hostedParties` and `joinedParties`
- Render two collapsible sections with distinct headers
- "My Hosted Parties" section shows Crown icon and host-specific info
- "Parties I've Joined" section shows Users icon and player stats

### HostVerifyPin.tsx Updates

Add logic at the start of the useEffect:

```typescript
// Check if this is a demo party
const { data: partyInfo } = await supabase
  .from("parties_public")
  .select("is_demo")
  .eq("code", code)
  .single();

if (partyInfo?.is_demo) {
  // Auto-verify for demo parties
  localStorage.setItem(`party_${code}_pin`, "verified");
  navigate(`/host/setup/${code}`);
  return;
}
```

---

## Security Considerations

1. The `is_demo` flag is not sensitive - safe to expose in public view
2. Demo parties are disposable test environments, PIN bypass is acceptable
3. Regular parties still require proper PIN verification
4. No changes to actual PIN storage or verification logic

---

## Files Summary

**Database Migration:**
- Update `parties_public` view to include `is_demo`

**Modify:**
- `src/pages/MyParties.tsx` - Split into hosted/joined sections
- `src/pages/HostVerifyPin.tsx` - Add demo party bypass logic
