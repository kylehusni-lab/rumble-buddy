

# Add "Where Did You Hear About Us?" to Request Access

## Overview
Add a new optional field to the Request Access modal that captures how users discovered OTT. This helps track marketing effectiveness and word-of-mouth referrals.

---

## Changes Required

### 1. Database Schema Update
Add a new column to the `access_requests` table:

```sql
ALTER TABLE access_requests 
ADD COLUMN referral_source text;
```

**Options to store:**
- `reddit` - Reddit
- `twitter` - X (Twitter)
- `friend` - A Friend
- `other` - Other (with optional text)

---

### 2. UI Update - RequestAccessModal.tsx

**New form field** (placed after Group Size, before Submit button):

| Label | Type | Options |
|-------|------|---------|
| How did you hear about us? | Select (optional) | Reddit, X (Twitter), A Friend, Other |

**Form state changes:**
- Add `referralSource` state variable
- Include in form submission payload
- Field is optional (no validation required)

---

## Visual Design

The new field will match the existing Select components:
- Dark background (`bg-ott-surface-elevated`)
- Border styling (`border-border`)
- Placeholder: "Select an option (optional)"

**Options list:**
1. Reddit
2. X (Twitter)  
3. A Friend
4. Other

---

## Form Flow

```
Name*           [________________]
Email*          [________________]
How do you want to play?*  [Solo / Group ▼]
(if Group) Group Size*     [2-5 / 6-10 ▼]
How did you hear about us? [Reddit / X / Friend / Other ▼]  ← NEW
[Request Access]
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `referral_source` column to `access_requests` |
| `src/components/RequestAccessModal.tsx` | Add Select field for referral source, update form submission |

---

## Technical Notes
- Field is optional to reduce friction (users can skip it)
- Using predefined options for easy analytics/filtering in Commissioner dashboard
- No changes needed to RLS policies (existing INSERT policy allows any fields)

