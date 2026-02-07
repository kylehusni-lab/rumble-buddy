
## Plan: Merge My Parties + Pick History and Add Auto-Inactive Logic

### Overview
This plan addresses three concerns:
1. **Merge Pages**: Combine `MyParties.tsx` and `PickHistory.tsx` into a unified dashboard that shows parties, solo mode, AND pick history in one cohesive view
2. **Verify Rumble Config**: Confirm the existing 36-pick Rumble structure is correct (2 undercards + 2 rumble winners + props is confirmed by user)
3. **Auto-Inactive Logic**: Mark events/parties as "ended" 5 hours after the event's final night concludes

---

### Part 1: Merge My Parties + Pick History

#### Current State
- **My Parties** (`/my-parties`): Shows solo mode, hosted parties, joined parties with status badges
- **Pick History** (`/pick-history`): Shows past picks grouped by event_id with drill-down detail view

#### Proposed Unified Dashboard
Merge into a single `/my-parties` page with a new "Pick History" collapsible section:

**New UI Structure:**

```text
+----------------------------------+
|  OTT Logo + Tagline             |
+----------------------------------+
|  My Dashboard          [Sign Out]|
|  user@email.com                 |
+----------------------------------+
|                                  |
|  [Solo Mode Section]             |
|  > Solo Player Card              |
|                                  |
|  [My Hosted Parties]             |
|  > Party Cards                   |
|                                  |
|  [Parties I've Joined]           |
|  > Party Cards                   |
|                                  |
|  [Pick History]          NEW     |
|  > Event Summary Cards           |
|    - WrestleMania 41 (Party)     |
|    - Royal Rumble 2026           |
|                                  |
+----------------------------------+
|  [Join Party]                    |
+----------------------------------+
```

#### Changes Required

| File | Change |
|------|--------|
| `src/pages/MyParties.tsx` | Add "Pick History" collapsible section with event summary cards |
| `src/pages/PickHistory.tsx` | DELETE - merge into MyParties |
| `src/App.tsx` | Remove `/pick-history` route (or redirect to `/my-parties`) |

#### Pick History Integration Logic
- Fetch user's picks grouped by `event_id` from both `solo_picks` and `picks` tables
- Display as collapsible "Pick History" section with event cards showing:
  - Event title and date
  - Pick count
  - Total score (if available)
- Clicking an event card expands inline to show individual picks (or opens a modal)

---

### Part 2: Verify Rumble Event Configuration

The current Rumble 2026 configuration includes:
- 2 undercard matches (Drew McIntyre vs Sami Zayn, AJ Styles vs Gunther)
- 2 rumble-winner picks (Men's + Women's)
- 2 x 5 rumble props per gender = 10 props
- 2 x 4 final four picks per gender = 8 picks  
- 2 x 7 chaos props per gender = 14 picks

**Total: 36 picks** - User confirmed this is correct, no changes needed.

---

### Part 3: Auto-Inactive Party Logic (5 Hours After Event End)

#### Logic Design
Parties should transition from "live" to "ended" when:
- The event's final night has passed
- 5 hours have elapsed since the event end time

#### Implementation Options

**Option A: Database Trigger/Scheduled Function (Recommended)**
Create a scheduled Supabase Edge Function that runs hourly:
1. Query all parties with `status = 'live'`
2. Check the party's `event_id` to determine the event end time
3. If current time > event end + 5 hours, set `status = 'ended'`

**Option B: Client-Side Check with RPC**
On page load (My Parties, HostSetup), check if the party should be marked as ended:
- Calculate event end time from `event_id`
- If past end + 5 hours and still "live", call an RPC to update status

**Recommended Approach: Option B (simpler to implement)**
- Add a helper function `isEventEnded(eventId: string, hoursAfter: number): boolean`
- On My Parties load, check each "live" party and auto-update status if needed
- Add an RPC function that sets status to "ended" with proper auth checks

#### Database Changes

Add a new RPC function:
```sql
CREATE OR REPLACE FUNCTION mark_party_ended(p_party_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_host_id UUID;
BEGIN
  SELECT host_user_id INTO v_host_id 
  FROM parties 
  WHERE code = p_party_code;
  
  IF v_host_id = auth.uid() THEN
    UPDATE parties 
    SET status = 'ended' 
    WHERE code = p_party_code AND status = 'live';
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Code Changes

| File | Change |
|------|--------|
| `src/lib/events/index.ts` | Add `getEventEndTime(eventId)` and `isEventExpired(eventId, hoursBuffer)` helpers |
| `src/pages/MyParties.tsx` | On load, check each "live" party and auto-transition if expired |
| Database Migration | Add `mark_party_ended` RPC function |

---

### Part 4: Event End Time Calculation

For multi-night events like WrestleMania:
```typescript
function getEventEndTime(event: EventConfig): Date {
  // Get the last night
  const lastNight = event.nights[event.nights.length - 1];
  // Assume 4-hour event duration after start time
  const endTime = new Date(lastNight.date);
  endTime.setHours(endTime.getHours() + 4);
  return endTime;
}

function isEventExpired(eventId: string, hoursBuffer: number = 5): boolean {
  const event = EVENT_REGISTRY[eventId];
  if (!event) return false;
  
  const endTime = getEventEndTime(event);
  const expiryTime = new Date(endTime);
  expiryTime.setHours(expiryTime.getHours() + hoursBuffer);
  
  return new Date() > expiryTime;
}
```

---

### Summary of Changes

| Area | Description |
|------|-------------|
| **Pages** | Merge PickHistory into MyParties, delete separate route |
| **Database** | Add `mark_party_ended` RPC function |
| **Events System** | Add `getEventEndTime()` and `isEventExpired()` helpers |
| **Auto-Inactive** | On My Parties load, check and transition expired "live" parties |
| **Rumble Config** | No changes needed - 36 picks confirmed correct |

---

### Technical Notes

- The Pick History section will use the same fetch logic currently in `PickHistory.tsx`
- Events shown in Pick History will include both solo and party picks
- The 5-hour buffer gives hosts time to finish scoring before parties are marked ended
- The client-side check ensures timely updates without requiring a scheduled function
