
# Fix Group and Demo Mode - RLS Policy Update

## Problem Identified

After the previous privacy fix, the guest list and demo mode stopped working. The root cause is an **overly restrictive SELECT policy** on the `players` table.

### Current State
- The `players` table only has one SELECT policy: `user_id = auth.uid()`
- Demo players are created via `seed_demo_player` RPC with `user_id = NULL`
- The `players_public` view uses `security_invoker=on`, meaning it respects the base table's RLS
- Result: Hosts cannot see guests in their party, breaking the guest list and demo mode

### Why It Happens
When the host views the HostSetup page and queries `players_public`, the RLS policy only returns rows where `user_id` matches the host's auth ID. Since demo guests have `user_id = NULL`, they are invisible.

## Solution

Add two new SELECT policies to the `players` table:

### 1. Hosts Can Read Players in Their Party
```sql
CREATE POLICY "Hosts can read players in their party"
ON public.players FOR SELECT
TO authenticated
USING (is_party_host(party_code));
```
This uses the existing `is_party_host()` SECURITY DEFINER function to verify the current user is the host.

### 2. Party Members Can Read Fellow Players
```sql
CREATE POLICY "Party members can read fellow players"
ON public.players FOR SELECT
TO authenticated
USING (is_party_member(party_code));
```
This allows players to see each other on leaderboards and TV displays.

## Security Analysis

These policies are safe because:
- They use SECURITY DEFINER helper functions (`is_party_host`, `is_party_member`) that check party membership/ownership
- The `players_public` view only exposes non-sensitive fields (id, display_name, joined_at, party_code, points)
- Sensitive fields like `email` are not in the view
- The existing `Players can read own record only` policy remains for when users need their own full record (including email)

## Implementation Steps

1. **Database Migration**: Add two new RLS policies to `players` table
2. **Test Demo Mode**: Create a demo party and verify all 6 players appear in the guest list
3. **Test Group Join**: Join a group as a player and verify the host sees you

## Files Changed

- **Database**: New migration for RLS policies (no code file changes needed)
