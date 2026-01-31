

# Realtime Performance Review and Optimization Plan

## Current State Analysis

After reviewing all realtime subscription implementations across the codebase, I identified several performance issues and optimization opportunities.

---

## Issues Found

### Issue 1: Unfiltered Picks Subscription in TvDisplay (Critical)

**File**: `src/pages/TvDisplay.tsx` (lines 404-409)

**Problem**: The subscription listens to ALL picks across ALL parties without any filter:
```typescript
.on("postgres_changes", { event: "*", schema: "public", table: "picks" }, () => {
  supabase.from("picks").select("player_id, match_id, prediction").then(...)
})
```

**Impact**: 
- Receives realtime events from every party in the system
- Triggers unnecessary re-fetches for unrelated data
- No filter on the fetch query either - fetches ALL picks from database

**Fix**: Add proper filter and use the RPC snapshot function that already exists.

---

### Issue 2: Unfiltered Picks Subscription in HostSetup (Medium)

**File**: `src/pages/HostSetup.tsx` (lines 210-221)

**Problem**: Similar issue - no filter on picks table subscription:
```typescript
.on("postgres_changes", { event: "*", schema: "public", table: "picks" }, async () => {
  // Refresh picks counts when picks change
})
```

**Impact**: Triggers on ANY pick change across the entire platform.

**Fix**: Filter by player IDs in the current party.

---

### Issue 3: Global Wrestlers Subscription in usePlatformConfig (Low)

**File**: `src/hooks/usePlatformConfig.ts` (lines 85-98)

**Problem**: No filter on wrestlers table - subscribes to ALL wrestler changes:
```typescript
.on("postgres_changes", {
  event: "*",
  schema: "public",
  table: "wrestlers",
}, () => fetchConfig())
```

**Impact**: Low impact since wrestlers table changes infrequently (admin-only), but still unnecessary overhead.

**Fix**: Add filter for `is_active=eq.true` and `is_rumble_participant=eq.true`.

---

### Issue 4: Overly Broad Event Types (Low)

**Multiple Files**: Most subscriptions use `event: "*"` instead of specific events.

**Problem**: Subscribing to INSERT, UPDATE, and DELETE when often only UPDATE or INSERT is needed.

**Examples**:
- `rumble_numbers`: Only needs UPDATE (entries and eliminations)
- `match_results`: Only needs INSERT (results are created, rarely updated/deleted)
- `players` points: Only needs UPDATE

**Fix**: Use specific event types where possible.

---

### Issue 5: Redundant Polling + Realtime in TvDisplay (Medium)

**File**: `src/pages/TvDisplay.tsx` (lines 218-260)

**Problem**: TvDisplay uses BOTH 3-second polling AND realtime subscriptions for the same data.

**Impact**: Duplicate network requests and processing.

**Fix**: Remove polling when realtime is connected, or reduce polling frequency as a fallback only.

---

## Optimization Plan

### 1. Fix TvDisplay Picks Subscription

```typescript
// Before (no filter, fetches everything)
.on("postgres_changes", { event: "*", schema: "public", table: "picks" }, () => {
  supabase.from("picks").select("player_id, match_id, prediction").then(...)
})

// After (filtered to party players, specific events)
.on("postgres_changes", { 
  event: "INSERT", 
  schema: "public", 
  table: "picks" 
}, async () => {
  // Use the existing RPC snapshot for efficiency
  const snapshot = await fetchTvSnapshot();
  if (snapshot?.picks) setPicks(snapshot.picks);
})
```

### 2. Fix HostSetup Picks Subscription

```typescript
// After - only listen for INSERT/UPDATE on picks
.on("postgres_changes", { 
  event: "INSERT", 
  schema: "public", 
  table: "picks" 
}, async () => {
  // Only refresh if we have players loaded
  if (players.length > 0) {
    // Batch fetch counts instead of individual queries
    const playerIds = players.map(p => p.id);
    const { data } = await supabase
      .from("picks")
      .select("player_id")
      .in("player_id", playerIds);
    
    if (data) {
      const picksCountMap: Record<string, number> = {};
      playerIds.forEach(id => {
        picksCountMap[id] = data.filter(p => p.player_id === id).length;
      });
      setPlayerPicks(picksCountMap);
    }
  }
})
```

### 3. Add Filters to usePlatformConfig

```typescript
// After - filter to only active rumble participants
.on("postgres_changes", {
  event: "*",
  schema: "public",
  table: "wrestlers",
  filter: "is_rumble_participant=eq.true"
}, () => fetchConfig())
```

### 4. Optimize Event Types

| Subscription | Current | Optimized |
|--------------|---------|-----------|
| `match_results` | `event: "*"` | `event: "INSERT"` (results are created, rarely updated) |
| `rumble_numbers` | `event: "*"` | `event: "UPDATE"` (entries/eliminations are updates) |
| `players` points | `event: "*"` | `event: "UPDATE"` (points only change via update) |

### 5. Remove Redundant Polling in TvDisplay

```typescript
// After - conditional polling as fallback only
useEffect(() => {
  if (!code) return;
  
  // Initial fetch
  poll();
  
  // Only poll if realtime fails to connect within 5 seconds
  let pollInterval: NodeJS.Timeout | null = null;
  const startPolling = () => {
    if (!pollInterval) {
      pollInterval = setInterval(poll, 5000); // Reduced frequency
    }
  };
  
  // Give realtime 5 seconds to connect, then fall back to polling
  const fallbackTimer = setTimeout(startPolling, 5000);
  
  return () => {
    clearTimeout(fallbackTimer);
    if (pollInterval) clearInterval(pollInterval);
  };
}, [code, fetchTvSnapshot, applySnapshot]);
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `src/pages/TvDisplay.tsx` | Add filter to picks subscription, remove redundant polling | High - prevents global event noise |
| `src/pages/HostSetup.tsx` | Batch picks count query, filter subscription | Medium - reduces N+1 queries |
| `src/hooks/usePlatformConfig.ts` | Add `is_rumble_participant` filter | Low - minor efficiency gain |
| `src/pages/HostControl.tsx` | Optimize event types (UPDATE only where appropriate) | Low - reduces event processing |
| `src/pages/PlayerDashboard.tsx` | Optimize event types | Low - reduces event processing |

---

## Technical Notes

- All filters use Supabase's supported filter syntax: `column=eq.value`
- The `picks` table doesn't have a direct `party_code` column, so we can't filter at the subscription level - instead we filter the refetch query
- The RPC function `get_tv_snapshot` already handles efficient data fetching for TvDisplay
- Channel names already use unique suffixes (e.g., `tv-display-${code}`) which is good practice

