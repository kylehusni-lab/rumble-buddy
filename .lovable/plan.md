
# Admin Rumble Entry Control Enhancements

## Overview

This plan improves the host's Royal Rumble entry control with three key enhancements:

1. **Delayed Timer Start for #1 & #2** - Timer won't start until the match officially begins (due to entrances)
2. **Alphabetized & Searchable Wrestler List** - Easier to find entrants quickly
3. **Add Surprise Entrant** - Quick way to add a wrestler not in the pre-configured list

## User Flow

```text
Host Control > Men's/Women's Tab
        |
        v
+------------------------------------------+
|  Next Entrant: #1                        |
|  Owner: Stone Cold                       |
+------------------------------------------+
|  [ Start Match ]   <-- New button for #1/#2
|                                          |
|  Match hasn't started yet                |
|  Timer will begin when you start match   |
+------------------------------------------+
|  [ Search wrestlers... 🔍 ]              |
+------------------------------------------+
|  Alexa Bliss                             |
|  Asuka                                   |
|  Bayley                                  |
|  Charlotte Flair                         |
|  ...alphabetized list...                 |
|  ─────────────────────────────           |
|  ✨ Add Surprise Entrant                 |
+------------------------------------------+
|  [ Confirm #1 Entry ]                    |
+------------------------------------------+
```

## Technical Changes

### 1. RumbleEntryControl Component Updates

#### New Props

| Prop | Type | Purpose |
|------|------|---------|
| `matchStarted` | `boolean` | Whether the Rumble match has officially started |
| `onStartMatch` | `() => void` | Callback when host clicks "Start Match" |
| `onAddSurprise` | `(name: string) => void` | Callback when host adds a custom wrestler |

#### Alphabetization

Sort the entrants alphabetically before rendering:

```typescript
const sortedEntrants = useMemo(() => 
  [...entrants].sort((a, b) => a.localeCompare(b)),
  [entrants]
);
```

#### Search Implementation

Add search input that filters the dropdown options:

```typescript
const [searchQuery, setSearchQuery] = useState("");

const filteredEntrants = useMemo(() => 
  sortedEntrants.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  ),
  [sortedEntrants, searchQuery]
);
```

#### Surprise Entrant Feature

When search has no matches, show an "Add as Surprise" option:

```typescript
{filteredEntrants.length === 0 && searchQuery.length > 0 && (
  <button onClick={() => onAddSurprise(searchQuery)}>
    ✨ Add "{searchQuery}" as Surprise Entrant
  </button>
)}
```

### 2. Host Control Page Updates

#### Match Start State

Track whether each Rumble match has started:

```typescript
const [mensMatchStarted, setMensMatchStarted] = useState(false);
const [womensMatchStarted, setWomensMatchStarted] = useState(false);
```

#### Modified Entry Confirmation

Only set `entry_timestamp` when the match has started. For #1 and #2 before match start:
- Record wrestler name immediately
- Set `entry_timestamp` to null until match starts
- When "Start Match" is clicked, set `entry_timestamp` for all pending entries

```typescript
const handleConfirmEntry = async (type, wrestlerName) => {
  const matchStarted = type === "mens" ? mensMatchStarted : womensMatchStarted;
  const entryCount = type === "mens" ? mensEnteredCount : womensEnteredCount;
  
  // For #1 and #2, don't set timestamp until match starts
  const shouldSetTimestamp = matchStarted || entryCount >= 2;
  
  await supabase.from("rumble_numbers").update({
    wrestler_name: wrestlerName,
    entry_timestamp: shouldSetTimestamp ? new Date().toISOString() : null,
  }).eq("id", numberRecord.id);
};
```

#### Start Match Handler

When host clicks "Start Match":

```typescript
const handleStartMatch = async (type: "mens" | "womens") => {
  const numbers = type === "mens" ? mensNumbers : womensNumbers;
  const now = new Date().toISOString();
  
  // Set entry_timestamp for all wrestlers who have entered but no timestamp
  const pendingEntries = numbers.filter(n => 
    n.wrestler_name && !n.entry_timestamp
  );
  
  for (const entry of pendingEntries) {
    await supabase.from("rumble_numbers")
      .update({ entry_timestamp: now })
      .eq("id", entry.id);
  }
  
  if (type === "mens") setMensMatchStarted(true);
  else setWomensMatchStarted(true);
  
  toast.success(`${type === "mens" ? "Men's" : "Women's"} Rumble has begun!`);
};
```

### 3. New UI Components

#### Enhanced RumbleEntryControl Layout

```text
+------------------------------------------+
|  Progress: 0/30 entered                  |
|  [████████░░░░░░░░░░░░]                  |
+------------------------------------------+
|  Next Entrant: #1                        |
|  Owner: Demo Host                        |
+------------------------------------------+
|  MATCH NOT STARTED (only for #1/#2)      |
|  [ 🔔 Start Match ]                      |
|  Timer begins when match starts          |
+------------------------------------------+
|  🔍 Search wrestlers...                  |
+------------------------------------------+
|  ┌────────────────────────────────────┐  |
|  │ AJ Styles                          │  |
|  │ Asuka                              │  |
|  │ Bayley                             │  |
|  │ ...                                │  |
|  │ ────────────────────────           │  |
|  │ ✨ Add Surprise Entrant            │  |
|  └────────────────────────────────────┘  |
+------------------------------------------+
|  [ Confirm #1 Entry ]                    |
+------------------------------------------+
```

#### Add Surprise Modal

Simple dialog for adding a custom wrestler name:

```text
+------------------------------------------+
|  Add Surprise Entrant                    |
+------------------------------------------+
|  Wrestler Name:                          |
|  [ _____________________________ ]       |
|                                          |
|  This wrestler will be added to the      |
|  match and available for selection.      |
+------------------------------------------+
|  [ Cancel ]        [ Add to Match ]      |
+------------------------------------------+
```

## File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/host/RumbleEntryControl.tsx` | Add search, alphabetization, match start UI, surprise option |
| `src/pages/HostControl.tsx` | Add match start state, handlers, and pass new props |

### New Files

| File | Purpose |
|------|---------|
| `src/components/host/AddSurpriseEntrantModal.tsx` | Modal for adding custom wrestler names |

## Implementation Details

### RumbleEntryControl.tsx Updates

```typescript
interface RumbleEntryControlProps {
  nextNumber: number;
  ownerName: string | null;
  entrants: string[];
  enteredCount: number;
  onConfirmEntry: (wrestlerName: string) => Promise<void>;
  disabled?: boolean;
  // New props
  matchStarted: boolean;
  onStartMatch: () => void;
  onAddSurprise: (name: string) => void;
}

export function RumbleEntryControl({ ... }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSurprise, setShowAddSurprise] = useState(false);
  
  // Alphabetize and filter
  const sortedAndFiltered = useMemo(() => 
    [...entrants]
      .sort((a, b) => a.localeCompare(b))
      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase())),
    [entrants, searchQuery]
  );
  
  // Show match start UI for #1 and #2 only
  const showMatchStartUI = nextNumber <= 2 && !matchStarted;
  
  // ...render logic
}
```

### Duration Calculation Fix

Update `getDuration` in HostControl to handle null `entry_timestamp`:

```typescript
const getDuration = (entryTimestamp: string | null) => {
  if (!entryTimestamp) return 0; // Not started yet
  return Math.floor((Date.now() - new Date(entryTimestamp).getTime()) / 1000);
};
```

### Active Wrestler Display Update

Show "Awaiting Start" instead of timer for wrestlers without `entry_timestamp`:

```typescript
// In ActiveWrestlerCard or display logic
{wrestler.entry_timestamp ? (
  formatDuration(getDuration(wrestler.entry_timestamp))
) : (
  "Awaiting match start"
)}
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Host adds #1, #2, then clicks Start Match | Both get same timestamp (fair start) |
| Host adds #1, starts match, then adds #2 | #2 gets current timestamp (arrived after start) |
| Host adds #3+ before match started | Automatically uses current timestamp (match must have started) |
| Surprise entrant name already exists | Show error toast "Wrestler already in list" |
| Empty search query | Show all entrants alphabetically |

## Benefits

1. **Fair Timing** - #1 and #2 don't have inflated durations due to entrance time
2. **Easy Discovery** - Alphabetized list makes finding wrestlers quick
3. **Fast Search** - Type-to-filter for instant lookup
4. **Flexibility** - Surprise entrants can be added on the fly without pre-configuration
