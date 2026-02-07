

## Plan: Fix Event Grouping and Improve Visual Hierarchy

### Overview
This plan addresses two issues:
1. **Data Migration**: Solo picks with Rumble-specific match IDs are incorrectly tagged with `event_id: mania_41` and need to be migrated to `event_id: rumble_2026`
2. **Visual Hierarchy**: The dashboard needs clearer separation between Event, Solo Mode, and Party sections

---

### Part 1: Data Migration

#### Problem
Solo picks in the database contain Rumble-specific match IDs (like `mens_rumble_winner`, `mens_chaos_prop_*`, `mens_entrant_*`, etc.) but are incorrectly stored with `event_id: mania_41`.

**Current data shows:**
- 147 solo picks with `event_id: mania_41`
- Match IDs include: `mens_rumble_winner`, `womens_rumble_winner`, `mens_chaos_prop_1-7`, `womens_chaos_prop_1-7`, `mens_entrant_1`, `mens_entrant_30`, etc.

These Rumble-type match IDs should belong to `event_id: rumble_2026`.

#### Solution: Database Migration
Run a SQL migration to update picks with Rumble-specific match IDs to the correct event:

```sql
UPDATE solo_picks 
SET event_id = 'rumble_2026' 
WHERE event_id = 'mania_41' 
AND (
  match_id LIKE 'mens_rumble_%' 
  OR match_id LIKE 'womens_rumble_%'
  OR match_id LIKE 'mens_chaos_prop_%'
  OR match_id LIKE 'womens_chaos_prop_%'
  OR match_id LIKE 'mens_entrant_%'
  OR match_id LIKE 'womens_entrant_%'
  OR match_id LIKE 'mens_final_four_%'
  OR match_id LIKE 'womens_final_four_%'
  OR match_id LIKE 'mens_first_elimination%'
  OR match_id LIKE 'womens_first_elimination%'
  OR match_id LIKE 'mens_most_eliminations%'
  OR match_id LIKE 'womens_most_eliminations%'
  OR match_id LIKE 'mens_longest_time%'
  OR match_id LIKE 'womens_longest_time%'
  OR match_id IN ('undercard_1', 'undercard_3')
);
```

---

### Part 2: Improved Visual Hierarchy

#### Current UI Issue
All modes (Solo + Parties) are displayed in a flat list within each event card, making it hard to distinguish between them.

#### Proposed Design

```text
+---------------------------------------------+
| [Zap] Active                           [v]  |
+---------------------------------------------+
|                                             |
| +=========================================+ |
| | [Calendar] WrestleMania 41   [Upcoming] | |
| | Apr 18, 2026                            | |
| +=========================================+ |
| |                                         | |
| |  -- Solo Mode ---------------------------| |
| |  +-------------------------------------+ | |
| |  | [User] Solo Mode        37 picks  > | | |
| |  | Kyle                                | | |
| |  +-------------------------------------+ | |
| |                                         | |
| |  -- Parties (8) ------------------------| |
| |  +-------------------------------------+ | |
| |  | [Crown] JVYN3T [Host]  Demo Pre > | | |
| |  +-------------------------------------+ | |
| |  +-------------------------------------+ | |
| |  | [Crown] 5KAUDN [Host]  Demo Live> | | |
| |  +-------------------------------------+ | |
| |  ... more parties ...                   | |
| |                                         | |
| +=========================================+ |
|                                             |
+---------------------------------------------+
```

#### Key Visual Changes

| Element | Change |
|---------|--------|
| **Solo Mode Section** | Add a section header label "Solo Mode" with a subtle divider line |
| **Parties Section** | Add a section header "Parties (count)" with party count badge |
| **Section Dividers** | Add horizontal separator lines between Solo and Parties sections |
| **Indentation** | Keep cards slightly indented within sections for visual grouping |
| **Header Styling** | Use smaller, muted text for section labels to not compete with event title |

---

### Part 3: Code Changes

| File | Change |
|------|--------|
| **Database** | Run migration to fix `event_id` for Rumble-type picks |
| `src/pages/MyParties.tsx` | Update `EventGroupCard` component to add section headers and visual dividers |

#### Updated EventGroupCard Component

Inside the event card body:
1. If `group.solo` exists, render a "Solo Mode" section header + solo card
2. Add a visual separator
3. If `group.parties.length > 0`, render a "Parties (N)" section header + party cards
4. Use consistent styling for section labels

---

### Summary

| Area | Description |
|------|-------------|
| **Data Fix** | Migrate Rumble picks from `mania_41` to `rumble_2026` based on match_id patterns |
| **Visual Hierarchy** | Add section headers ("Solo Mode" / "Parties") within each event card |
| **Separators** | Add horizontal dividers between Solo and Party sections |
| **Badges** | Show party count in the "Parties" section header |

