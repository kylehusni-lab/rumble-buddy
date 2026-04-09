

## Plan: Update Event Creation with Clearer Types and Date Pickers

### Changes

**File: `src/components/admin/CreateEventModal.tsx`**

1. Change event type options from "Standard PLE / Royal Rumble / WrestleMania" to:
   - **1 Night PLE** (type: `standard_ple`) -- single date picker
   - **2 Night PLE** (type: `mania`) -- two date pickers (Night 1 / Night 2)
   - **Royal Rumble** (type: `rumble`) -- single date picker

2. Add date picker(s) that dynamically adjust based on selected type:
   - 1 Night PLE and Royal Rumble: show one date picker
   - 2 Night PLE: show two date pickers (Night 1, Night 2)

3. On submit, auto-generate the `nights` array from selected dates:
   - 1 Night: `[{ id: "night_1", label: "Night 1", date: selectedDate }]`
   - 2 Night: `[{ id: "night_1", label: "Night 1 - Saturday", date: date1 }, { id: "night_2", label: "Night 2 - Sunday", date: date2 }]`
   - Rumble: `[{ id: "night_1", label: "Night 1", date: selectedDate }]`

4. Update helper text to describe each type clearly:
   - 1 Night PLE: "Standard single-night premium live event"
   - 2 Night PLE: "Multi-night event like WrestleMania"
   - Royal Rumble: "Enables entry tracking and elimination mechanics"

Uses the existing Shadcn Calendar/Popover date picker pattern.

