
## Plan: Remove CM Punk vs Seth Rollins Match

Remove the CM Punk vs Seth Rollins undercard match from the card configuration. This will reduce the undercard from 3 matches to 2.

---

### Changes Required

**File: `src/lib/constants.ts`**

1. **Remove from `UNDERCARD_MATCHES`** (line 12)
   - Delete the entry: `{ id: 'undercard_2', title: 'CM Punk vs Seth Rollins', options: ['CM Punk', 'Seth Rollins'] }`

2. **Remove from `CARD_CONFIG`** (line 182)
   - Delete the entry: `{ type: 'match', id: 'undercard_2', title: 'CM Punk vs Seth Rollins', options: ['CM Punk', 'Seth Rollins'] }`

3. **Optional: Update `MATCH_IDS`** (lines 27-28)
   - Remove `UNDERCARD_2: 'undercard_2'` if no longer needed, or keep for backward compatibility with existing database records

---

### Impact

- The pick card flow will show 2 undercard matches instead of 3
- TV display carousel will skip this match
- Match progress tracking will update automatically (now 8 cards instead of 9)
- Existing picks for `undercard_2` in the database won't display but cause no errors

---

### Note on Database

Any existing picks already submitted for `undercard_2` will remain in the database but won't affect scoring since there's no corresponding match in the configuration. No database migration is required.
