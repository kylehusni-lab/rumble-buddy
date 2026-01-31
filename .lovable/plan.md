

# Fix: Parties Not Loading in Admin Mode

## Problem Identified

The **Parties tab fails to load** in Commissioner Mode because the `admin_get_all_parties` database function references a column that doesn't exist.

**Error Details:**
- The RPC function `admin_get_all_parties` tries to SELECT `p.email_sent` from the `parties` table
- The `email_sent` column does **not exist** on the `parties` table
- This causes a SQL error, preventing any party data from being returned
- The `admin_update_party_email_sent` function has the same issue

---

## Solution

Add the missing `email_sent` column to the `parties` table to match what the RPC functions expect.

---

## Database Migration

```sql
-- Add email_sent column to parties table for tracking host communication
ALTER TABLE public.parties 
ADD COLUMN email_sent boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.parties.email_sent IS 
  'Tracks whether the party code has been emailed to the host';
```

---

## Technical Details

| Item | Current State | Fix |
|------|--------------|-----|
| `parties.email_sent` column | Missing | Add with `boolean DEFAULT false` |
| `admin_get_all_parties` RPC | Fails on `p.email_sent` | Will work after column added |
| `admin_update_party_email_sent` RPC | Fails on UPDATE | Will work after column added |
| TypeScript types | Missing `email_sent` | Will auto-update after migration |
| Frontend interface | Has `email_sent` field | Already correct |

---

## Files to Update

| File | Change |
|------|--------|
| Database migration | Add `email_sent` column to `parties` table |
| `src/components/admin/ActivePartiesTab.tsx` | Add `email_sent: boolean` to Party interface (already present based on memory context) |

---

## Verification Steps

After the fix:
1. Navigate to `/admin`
2. Click the "Parties" tab
3. Confirm parties list loads successfully
4. Test "Create Party" and "Manage" functions

