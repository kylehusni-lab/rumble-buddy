
# Fix players_public View - RLS Permission Issue

## Problem
The `players_public` view returns empty results because:
1. The view is defined with `security_invoker=on` (uses caller's permissions)
2. The `players` table has a SELECT policy: `USING (false)` (blocks ALL reads)
3. When the app queries the view, the underlying SELECT fails due to RLS

My direct SQL query worked because it ran with service_role permissions that bypass RLS.

## Solution
Recreate the `players_public` view WITHOUT `security_invoker=on` so it runs with definer permissions and can read from the protected `players` table.

## Database Migration

```sql
-- Drop and recreate the view WITHOUT security_invoker
DROP VIEW IF EXISTS players_public;

CREATE VIEW players_public AS
SELECT 
  id,
  party_code,
  display_name,
  points,
  joined_at
FROM players;
-- Note: No WITH (security_invoker=on) means it uses definer permissions

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON players_public TO anon, authenticated;
```

## Why This Works
- Without `security_invoker=on`, the view runs with the **definer's** permissions (the database owner)
- The database owner has full access to the `players` table
- The view only exposes safe columns (id, party_code, display_name, points, joined_at)
- Sensitive columns (email, session_id) remain hidden

## Files to Modify
None - this is a database-only change.

## Database Operations
| Operation | Description |
|-----------|-------------|
| DROP VIEW | Remove existing players_public view |
| CREATE VIEW | Recreate without security_invoker option |
| GRANT | Ensure anon/authenticated can read the view |

## Result
- Demo mode will show all 6 players (Kyle, Melanie, Mike, Jon, Chris, Steve)
- Host setup page will correctly display guest counts and pick status
- All existing functionality remains the same
