

## Plan: Wrestler Library Picker, Tag Team Expansion, and Title Match Configuration

### Overview
Upgrade the admin Match Form Modal with three enhancements: (1) select wrestlers from the database roster instead of typing names, (2) support tag teams with up to 5 members per team, and (3) add a title match toggle with championship selection that auto-detects men's vs women's divisions.

---

### Part 1: Wrestler Picker for Match Participants

Replace the free-text `Input` fields for match options with a wrestler search/select component.

**New component: `src/components/admin/WrestlerSelect.tsx`**
- A combo-box style input that queries the `wrestlers` table directly via Supabase (`select name, division, image_url from wrestlers where is_active = true`)
- Searchable dropdown with wrestler images and names
- Shows division badge (M/W) next to each name
- Returns the selected wrestler's name and division
- Supports clearing the selection
- No confetti, no full-screen modal -- lightweight inline popover using the existing `Command` + `Popover` UI components

**Update: `src/components/admin/MatchFormModal.tsx`**
- Replace each `<Input placeholder="Option N">` with the new `WrestlerSelect` component
- For tag team matches, use a grouped layout (see Part 2)
- Track the division of selected wrestlers to feed into title detection (Part 3)

---

### Part 2: Tag Team Match -- Up to 5 Per Team

Currently tag matches allow 2-4 generic options. Restructure for team-based selection.

**Update: `MatchFormModal.tsx` -- Tag team UI**
- When match type is `tag`, switch from a flat options list to a **two-team layout**:
  - Team 1 section with up to 5 wrestler slots
  - Team 2 section with up to 5 wrestler slots
  - Each slot uses the `WrestlerSelect` component
  - "Add Member" button per team (max 5)
  - "Remove" button per member (min 1)
- On save, flatten team members into the `options` array using `&` separator per team (e.g., `["Nia Jax & Lash Legend", "Charlotte Flair & Alexa Bliss"]`) to maintain backward compatibility with how options are stored and displayed

**Update: `MATCH_TYPES` constant**
- Change tag type config: `minOptions: 2, maxOptions: 2` (2 teams), but internally each team holds 1-5 members

---

### Part 3: Title Match Toggle and Championship Selector

Add a toggle to mark a match as a title match and select which championship is on the line.

**Database: Add columns to `event_matches`**
- `is_title_match boolean NOT NULL DEFAULT false`
- `championship_name text DEFAULT NULL`

**Update: `MatchFormModal.tsx`**
- Add a "Title Match" toggle switch below match type
- When enabled, show a `Select` dropdown for championship name
- Championship options are hardcoded for now:
  - Men's: "Undisputed WWE Championship", "World Heavyweight Championship", "United States Championship", "Intercontinental Championship", "World Tag Team Championship"
  - Women's: "WWE Women's Championship", "Women's World Championship", "Women's Intercontinental Championship", "WWE Women's Tag Team Championship"
- Auto-filter the list based on the divisions of selected wrestlers:
  - If all selected wrestlers are from the `womens` division, show women's titles only
  - If all are `mens`, show men's titles only
  - If mixed or none selected, show all titles
- The championship name gets stored in the `event_matches` row and can be displayed as a badge in the match list

**Update: `MatchesConfigTab.tsx`**
- Show a small championship badge on matches where `is_title_match` is true

**Update: `DbEventMatch` interface in `useEventAdmin.ts`**
- Add `is_title_match: boolean` and `championship_name: string | null`

---

### Files Changed

| File | Action |
|------|--------|
| `src/components/admin/WrestlerSelect.tsx` | Create -- inline wrestler picker component |
| `src/components/admin/MatchFormModal.tsx` | Major update -- wrestler select, tag teams, title match |
| `src/components/admin/MatchesConfigTab.tsx` | Minor update -- championship badge display |
| `src/hooks/useEventAdmin.ts` | Update `DbEventMatch` interface with new fields |
| Database migration | Add `is_title_match` and `championship_name` to `event_matches` |

