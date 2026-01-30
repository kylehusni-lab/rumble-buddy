

## Remove Redundant PIN from Wrestlers Tab

The Wrestlers tab is inside the Commissioner Dashboard which already enforces admin role authentication. The additional PIN check is unnecessary.

---

### Current Flow (Redundant)

```text
User visits /admin
    |
    v
Check: Is authenticated? --> No --> Redirect to /sign-in
    |
    v (Yes)
Check: Has admin role? --> No --> Redirect to /
    |
    v (Yes)
Show Commissioner Dashboard
    |
    v
Click "Wrestlers" tab
    |
    v
Check: Has valid Platform Admin PIN? --> No --> Show PIN prompt
    |
    v (Yes)
Show Wrestler Database
```

### New Flow (Simplified)

```text
User visits /admin
    |
    v
Check: Is authenticated? --> No --> Redirect to /sign-in
    |
    v (Yes)
Check: Has admin role? --> No --> Redirect to /
    |
    v (Yes)
Show Commissioner Dashboard (all tabs accessible)
```

---

### Changes Required

**File: `src/components/admin/WrestlerDatabaseTab.tsx`**

Remove the PIN verification logic entirely:
- Remove `isSessionValid` state and PIN-related states
- Remove `handleVerifyPin` function
- Remove the PIN prompt UI
- Directly render `WrestlerDatabaseContent` component

The component becomes a simple wrapper that renders the wrestler management UI immediately.

---

### Simplified Component Structure

```typescript
export function WrestlerDatabaseTab() {
  // No PIN check needed - parent page already enforces admin role
  return <WrestlerDatabaseContent />;
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/WrestlerDatabaseTab.tsx` | Remove PIN verification (~40 lines), directly render content |

---

### Security Model After Change

| Layer | Protection |
|-------|------------|
| Authentication | Supabase email/password login required |
| Authorization | `has_role(auth.uid(), 'admin')` check in AdminDashboard |
| Backend | `manage-wrestlers` edge function still validates admin role |

The backend edge function already validates the user's role, so even if someone bypassed the UI, they couldn't perform operations without proper admin credentials.

