
## Plan: Admin Event Configurator

### Overview

Build an admin interface for dynamically configuring event matches, chaos props, and match types. This will allow you to build out undercard and chaos props per event without code changes, storing configuration in the database.

---

### Part 1: Database Schema

Create new tables to store event configuration dynamically:

**Table: `events`**
| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Event ID (e.g., "mania_41") |
| title | text | Display name |
| type | text | "rumble", "mania", "standard_ple" |
| venue | text | Venue name |
| location | text | City, State |
| status | text | "draft", "active", "completed" |
| nights | jsonb | Array of night objects |
| scoring | jsonb | Scoring configuration |
| is_active | boolean | Currently active event |
| created_at | timestamp | |
| updated_at | timestamp | |

**Table: `event_matches`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| event_id | text (FK) | References events.id |
| match_id | text | Unique within event (e.g., "match_1") |
| title | text | Display title |
| match_type | text | "singles", "tag", "triple_threat", "fatal_four", "ladder", "rumble", "battle_royal", "other" |
| options | jsonb | Array of participant options |
| night | text | Night ID for multi-night events |
| sort_order | int | Display ordering |
| is_active | boolean | Include in picks |

**Table: `event_props`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| event_id | text (FK) | References events.id |
| prop_id | text | Unique within event |
| title | text | Short title |
| question | text | Full question text |
| category | text | "chaos", "rumble", "general" |
| prop_type | text | "yesno", "wrestler", "custom" |
| options | jsonb | Custom options if applicable |
| gender | text | "mens", "womens", null |
| night | text | Night ID if night-specific |
| sort_order | int | Display ordering |
| is_active | boolean | Include in picks |

---

### Part 2: Admin UI Components

**New Tab: "Events" in Admin Dashboard**

Add a fourth tab alongside Requests, Parties, and Wrestlers.

```text
+----------------------------------------+
|  [Requests] [Parties] [Wrestlers] [Events]
+----------------------------------------+
```

**Events List View**

```text
+------------------------------------------+
| Events                    [+ Create Event]|
+------------------------------------------+
| WrestleMania 41     Apr 18-19  [Active]  |
|   10 matches | 8 props | 2 nights        |
|                              [Configure] |
+------------------------------------------+
| Royal Rumble 2026   Jan 31    [Completed]|
|   2 matches | 7 chaos props              |
|                              [Configure] |
+------------------------------------------+
```

**Event Configuration View**

When clicking "Configure", open a modal or full-screen editor:

```text
+------------------------------------------+
| Configure: WrestleMania 41        [Save] |
+------------------------------------------+
| [Matches] [Props] [Settings]             |
+------------------------------------------+
```

---

### Part 3: Match Configuration UI

**Match List with Drag Reorder**

```text
+------------------------------------------+
| Night 1 Matches           [+ Add Match]  |
+------------------------------------------+
| [=] Match 1: Seth Rollins vs Drew        |
|     Type: Singles  [Edit] [Delete]       |
+------------------------------------------+
| [=] Match 2: Tag Title Match             |
|     Type: Tag Team  [Edit] [Delete]      |
+------------------------------------------+

| Night 2 Matches           [+ Add Match]  |
+------------------------------------------+
| [=] Match 1: World Title Match           |
|     Type: Singles  [Edit] [Delete]       |
+------------------------------------------+
```

**Match Form Modal**

Fields:
- Title (text input)
- Match Type (dropdown):
  - Singles
  - Tag Team
  - Triple Threat
  - Fatal Four Way
  - Ladder Match
  - Battle Royal
  - Royal Rumble
  - Other
- Participants/Options (dynamic based on type):
  - Singles/Ladder: 2+ options
  - Tag: Team names
  - Multi-person: 3-4+ options
- Night (dropdown for multi-night events)
- Active toggle

Match type controls display features:
- "rumble" type enables Rumble-specific tabs
- "ladder" could show special visuals
- Participant count validated based on type

---

### Part 4: Props Configuration UI

**Props List with Category Tabs**

```text
+------------------------------------------+
| [Chaos Props] [Rumble Props] [General]   |
+------------------------------------------+
| Chaos Props (Men's)        [+ Add Prop]  |
+------------------------------------------+
| The Floor is Lava                        |
| A wrestler uses a stunt to avoid touch...|
| Type: Yes/No          [Edit] [Delete]    |
+------------------------------------------+
| Betrayal!                                |
| Tag partners eliminate each other        |
| Type: Yes/No          [Edit] [Delete]    |
+------------------------------------------+
```

**Prop Form Modal**

Fields:
- Title (short name)
- Question (full text)
- Category: Chaos / Rumble / General
- Type: Yes/No or Wrestler Pick
- Gender: Men's / Women's / Both
- Night (for multi-night)
- Active toggle

---

### Part 5: Settings Tab

**Event Settings Panel**

```text
+------------------------------------------+
| Event Settings                           |
+------------------------------------------+
| Title: [WrestleMania 41              ]   |
| Type:  [WrestleMania v]                  |
| Venue: [Allegiant Stadium            ]   |
| Location: [Las Vegas, Nevada         ]   |
+------------------------------------------+
| Nights                                   |
| Night 1: Apr 18, 2026, 7:00 PM ET        |
| Night 2: Apr 19, 2026, 7:00 PM ET        |
|                          [+ Add Night]   |
+------------------------------------------+
| Scoring                                  |
| Match Winner:  [25] pts                  |
| Prop Bet:      [10] pts                  |
| (Rumble-specific shown if type=rumble)   |
+------------------------------------------+
| Status                                   |
| [Draft] [Active] [Completed]             |
|                                          |
| [ ] Set as current active event          |
+------------------------------------------+
```

---

### Part 6: Integration with EventContext

Update the `EventContext` to optionally load from database:

```typescript
// In EventContext.tsx
async function loadEventConfig(eventId: string): Promise<EventConfig> {
  // First check database for dynamic config
  const { data: dbEvent } = await supabase
    .from('events')
    .select('*, event_matches(*), event_props(*)')
    .eq('id', eventId)
    .single();
  
  if (dbEvent) {
    return transformDbEventToConfig(dbEvent);
  }
  
  // Fallback to static registry
  return EVENT_REGISTRY[eventId];
}
```

---

### Implementation Files

| File | Action |
|------|--------|
| **Database** | Create `events`, `event_matches`, `event_props` tables with RLS |
| `src/components/admin/EventsTab.tsx` | **Create** - Events list and management |
| `src/components/admin/EventConfigModal.tsx` | **Create** - Full event configuration modal |
| `src/components/admin/MatchFormModal.tsx` | **Create** - Match editor form |
| `src/components/admin/PropFormModal.tsx` | **Create** - Prop editor form |
| `src/hooks/useEventAdmin.ts` | **Create** - Admin CRUD operations for events |
| `src/pages/AdminDashboard.tsx` | **Update** - Add Events tab |
| `src/contexts/EventContext.tsx` | **Update** - Support database-loaded config |
| `src/lib/events/index.ts` | **Update** - Add database fallback logic |

---

### Match Type Display Mapping

| Match Type | UI Behavior |
|------------|-------------|
| singles | Standard 2-option picker |
| tag | Shows team names, optional member display |
| triple_threat | 3 options |
| fatal_four | 4 options |
| ladder | Multi-option, "Money in the Bank" style |
| rumble | Enables Men's/Women's tabs, entry tracking |
| battle_royal | Multi-option without Rumble features |

---

### Migration Path

1. Create database tables
2. Seed with existing WrestleMania 41 config
3. Build admin UI
4. Update EventContext to check database first
5. Existing static configs remain as fallback

---

### Summary

| Area | Description |
|------|-------------|
| **Database** | 3 new tables for dynamic event configuration |
| **Admin UI** | New Events tab with full CRUD for matches and props |
| **Match Types** | Dropdown selection controls display behavior |
| **Props Categories** | Chaos, Rumble, and General categories with gender support |
| **Integration** | EventContext loads from DB with static fallback |
