
# Bottom Nav Badges + Demo Seeder Enhancement

## Overview

Two enhancements:
1. **Nav Tab Badges** - Show correct/pending pick counts on each bottom nav tab
2. **Demo Seeder Update** - Add Kyle (kyle.husni@gmail.com) as the host player in demo mode

---

## Part 1: Bottom Navigation Badges

### Current State
The `BottomNavBar` component shows tabs but no indication of pick status per category.

### Solution
Pass pick statistics to `BottomNavBar` and display small badge indicators:
- **Green badge** - Number of correct picks in that tab
- **Gray/pending indicator** - Shows "X pending" if results aren't in yet

### Match ID Groupings per Tab

**Matches Tab (5 picks):**
- `undercard_1`, `undercard_2`, `undercard_3`
- `mens_rumble_winner`, `womens_rumble_winner`

**Men's Tab (10 picks):**
- `mens_first_elimination`, `mens_most_eliminations`, `mens_longest_time`
- `mens_entrant_1`, `mens_entrant_30`
- `mens_final_four_1` through `mens_final_four_4`
- `mens_no_show`

**Women's Tab (10 picks):**
- Same pattern with `womens_` prefix

**Chaos Tab (12 picks):**
- `mens_chaos_prop_1` through `mens_chaos_prop_6`
- `womens_chaos_prop_1` through `womens_chaos_prop_6`

### Implementation

**File: `src/components/dashboard/BottomNavBar.tsx`**

Add optional badge props:

```typescript
interface TabBadge {
  correct: number;
  pending: number;
}

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showNumbers?: boolean;
  badges?: Record<TabId, TabBadge>;
}
```

Render badges inside each tab button:
- If `correct > 0`, show green badge with checkmark and count
- If `pending > 0` and no correct, show subtle pending indicator

**File: `src/pages/PlayerDashboard.tsx`**

Add a helper function to calculate badges from picks and results:

```typescript
const calculateBadges = (picks: Pick[], results: MatchResult[]) => {
  const TAB_MATCH_IDS: Record<TabId, string[]> = {
    numbers: [], // Numbers don't have picks
    matches: ['undercard_1', 'undercard_2', 'undercard_3', 'mens_rumble_winner', 'womens_rumble_winner'],
    mens: ['mens_first_elimination', 'mens_most_eliminations', 'mens_longest_time', 'mens_entrant_1', 'mens_entrant_30', 'mens_final_four_1', 'mens_final_four_2', 'mens_final_four_3', 'mens_final_four_4', 'mens_no_show'],
    womens: ['womens_first_elimination', 'womens_most_eliminations', 'womens_longest_time', 'womens_entrant_1', 'womens_entrant_30', 'womens_final_four_1', 'womens_final_four_2', 'womens_final_four_3', 'womens_final_four_4', 'womens_no_show'],
    chaos: ['mens_chaos_prop_1', 'mens_chaos_prop_2', 'mens_chaos_prop_3', 'mens_chaos_prop_4', 'mens_chaos_prop_5', 'mens_chaos_prop_6', 'womens_chaos_prop_1', 'womens_chaos_prop_2', 'womens_chaos_prop_3', 'womens_chaos_prop_4', 'womens_chaos_prop_5', 'womens_chaos_prop_6'],
  };
  
  // For each tab, count correct and pending picks
  const badges: Record<TabId, TabBadge> = {};
  for (const [tabId, matchIds] of Object.entries(TAB_MATCH_IDS)) {
    let correct = 0;
    let pending = 0;
    
    for (const matchId of matchIds) {
      const pick = picks.find(p => p.match_id === matchId);
      const result = results.find(r => r.match_id === matchId);
      
      if (!pick) continue;
      if (!result) {
        pending++;
      } else if (pick.prediction === result.result) {
        correct++;
      }
    }
    
    badges[tabId as TabId] = { correct, pending };
  }
  
  return badges;
};
```

Pass badges to BottomNavBar:
```typescript
<BottomNavBar 
  activeTab={activeTab} 
  onTabChange={setActiveTab}
  showNumbers={showNumbers}
  badges={calculateBadges(picks, results)}
/>
```

### Badge Visual Design
- Small circular badge positioned at top-right of the icon container
- Green background for correct picks (`bg-success`)
- Muted gray for pending (`bg-muted`)
- Size: ~16px diameter with small text

---

## Part 2: Demo Seeder Enhancement

### Current State
Demo mode creates:
- "Demo Host" (demo-host@demo.local) as the host player
- 5 wrestling-themed guests (Randy Savage, Hulk Hogan, etc.)

### Solution
Replace "Demo Host" with Kyle's actual details and update session accordingly.

### Implementation

**File: `src/lib/demo-seeder.ts`**

Update the host creation in `seedDemoParty`:

```typescript
// Before
const { data: hostPlayer, error: hostError } = await supabase
  .from("players")
  .insert({
    party_code: partyCode,
    email: "demo-host@demo.local",
    display_name: "Demo Host",
    session_id: hostSessionId,
  })
  
// After
const { data: hostPlayer, error: hostError } = await supabase
  .from("players")
  .insert({
    party_code: partyCode,
    email: "kyle.husni@gmail.com",
    display_name: "Kyle",
    session_id: hostSessionId,
  })
```

**File: `src/pages/Index.tsx`**

Update the session after demo seeding:

```typescript
// Before
setPlayerSession({
  sessionId,
  playerId: hostPlayerId,
  partyCode: demoCode,
  displayName: "Demo Host",
  email: "demo-host@demo.local",
  isHost: true,
});

// After
setPlayerSession({
  sessionId,
  playerId: hostPlayerId,
  partyCode: demoCode,
  displayName: "Kyle",
  email: "kyle.husni@gmail.com",
  isHost: true,
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/BottomNavBar.tsx` | Add `badges` prop and render badge indicators |
| `src/pages/PlayerDashboard.tsx` | Calculate badges from picks/results and pass to nav |
| `src/lib/demo-seeder.ts` | Update host to Kyle (kyle.husni@gmail.com) |
| `src/pages/Index.tsx` | Update session details for demo host |

---

## Technical Notes

### Badge Calculation Logic
- **Correct**: Pick exists AND result exists AND they match
- **Pending**: Pick exists AND result does not exist
- **Incorrect**: Pick exists AND result exists AND they don't match (not shown as badge)

### Numbers Tab
The Numbers tab doesn't show a badge since it doesn't contain picks - it shows assigned Rumble numbers.
