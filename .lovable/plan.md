

# Fix Maxxine Dupri Ring Time and Restore Steve's Points

## Summary
Execute two database updates to correct the ring time for Maxxine Dupri to 1:09 and restore the 10 points that were incorrectly deducted from Scuba Steve due to the Jobber Penalty.

## Database Updates

### 1. Update Maxxine Dupri's Entry Timestamp
Adjust the entry time so the ring duration is exactly 1 minute 9 seconds (69 seconds):

```sql
UPDATE rumble_numbers 
SET entry_timestamp = elimination_timestamp - INTERVAL '69 seconds'
WHERE party_code = 'X629M5' 
  AND wrestler_name = 'Maxxine Dupri';
```

### 2. Restore Scuba Steve's Points
Add back the 10 points that were deducted as a Jobber Penalty:

```sql
UPDATE players 
SET points = points + 10
WHERE party_code = 'X629M5' 
  AND display_name ILIKE '%steve%';
```

## Expected Results
- Maxxine Dupri's ring time changes from ~47 seconds to 1:09
- Scuba Steve's points increase by 10 (from -10 to 0, assuming no other scoring changes)

