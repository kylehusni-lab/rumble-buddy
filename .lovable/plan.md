
# Unified Wrestler Management System

## Overview
The current admin panel has two disconnected systems:
- **Platform Admin page** stores Rumble entrant names as simple text in `platform_config`
- **Wrestler Database** manages wrestlers in the `wrestlers` table (currently empty)

This plan unifies them so the Wrestler Database becomes the single source of truth, with a new "Rumble Participant" toggle to control who appears in the entrant picker.

## Changes

### 1. Database Schema Update
Add two new columns to the `wrestlers` table:
- `is_rumble_participant` (boolean, default false) - Controls if wrestler appears in Rumble picker
- `is_confirmed` (boolean, default true) - Tracks confirmed vs unconfirmed status (replaces the `*` prefix system)

### 2. Migrate Existing Entrant Data
Seed the `wrestlers` table with the current entrant lists from `platform_config`:
- Parse wrestler names from both Men's and Women's lists
- Set `is_rumble_participant = true` for all current entrants
- Set `is_confirmed = false` for wrestlers with `*` prefix
- Preserve division info based on which list they came from

### 3. Update Wrestler Admin UI
Enhance the WrestlerCard and WrestlerFormModal:
- Add "In Rumble" toggle to mark wrestlers as participants
- Add "Confirmed" badge/toggle for entrant status
- Display participant count in division tabs
- Image upload already works - no changes needed

### 4. Update Platform Admin Page
Replace the manual text list with a wrestler picker:
- Remove the text input and raw name lists
- Add checkboxes to toggle wrestlers in/out of Rumble
- Show wrestler images alongside names
- Display "Confirmed/Unconfirmed" status toggle
- Keep the Men's/Women's division tabs

### 5. Update Data Consumers
Modify hooks and components that use entrant lists:
- Update `usePlatformConfig` to fetch from `wrestlers` table instead of `platform_config`
- Update `getWrestlerImageUrl` to prioritize database images
- Ensure the Rumble picker components use the new data source

## Visual Changes

**Wrestler Admin (enhanced):**
```text
+----------------------------------+
| [Image]  Roman Reigns            |
|          Men's Division          |
|          [✓ In Rumble] [Confirmed]|
|          [Edit] [Delete]         |
+----------------------------------+
```

**Platform Admin (redesigned):**
```text
Men's Division (18 participants)
+----------------------------------+
| [img] Roman Reigns    [✓] [Confirmed ▼]  |
| [img] Cody Rhodes     [✓] [Confirmed ▼]  |
| [img] Seth Rollins    [✓] [Unconfirmed ▼]|
| [img] The Miz         [ ] [--]           |
+----------------------------------+
```

## Technical Details

### Database Migration
```sql
-- Add new columns
ALTER TABLE wrestlers 
  ADD COLUMN is_rumble_participant boolean DEFAULT false,
  ADD COLUMN is_confirmed boolean DEFAULT true;
```

### Edge Function Updates
Update `manage-wrestlers` to:
- Accept `is_rumble_participant` and `is_confirmed` in create/update
- Add new action `update_rumble_status` for quick toggling
- Return participant counts by division

### Frontend Component Updates

**Modified Files:**
- `src/hooks/useWrestlerAdmin.ts` - Add rumble status fields
- `src/components/admin/WrestlerCard.tsx` - Show participant badge
- `src/components/admin/WrestlerFormModal.tsx` - Add participant & confirmed toggles
- `src/pages/PlatformAdmin.tsx` - Replace text lists with wrestler grid
- `src/hooks/usePlatformConfig.ts` - Fetch from wrestlers table
- `src/lib/wrestler-data.ts` - Prioritize database images

**New Components:**
- `src/components/admin/RumbleParticipantToggle.tsx` - Toggle for participant status

### Data Flow After Unification
```text
Platform Admin
     ↓ toggle rumble status
Wrestlers Table (is_rumble_participant, is_confirmed)
     ↓ usePlatformConfig fetches
Player Pick Flow → Shows only participants
```

## Migration Strategy
1. Deploy schema changes
2. Run one-time data migration to seed wrestlers from current entrant lists
3. Deploy UI changes
4. Platform Admin now manages wrestlers directly

## Benefits
- Single source of truth for wrestler data
- Images automatically available for all entrants
- No more duplicated name management
- Easy to add/remove wrestlers from Rumble
- Confirmed/Unconfirmed status is data-driven, not text prefix-based
