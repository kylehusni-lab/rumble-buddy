
# Admin Control Panel Rebuild - Implementation Plan

## Overview

This plan rebuilds the host/admin control panel for the Royal Rumble party tracker app with improved mobile-first UX, PIN-based authentication, and enhanced scoring workflows. The existing database schema and player experience remain unchanged.

---

## Phase 1: Database Schema Update

### Add `host_pin` Column to Parties Table

The current `parties` table lacks a `host_pin` column for PIN-based authentication. We need to add this via migration.

**Migration SQL:**
```sql
ALTER TABLE parties ADD COLUMN host_pin TEXT;
```

This column will store a hashed or plain 4-digit PIN for host authentication. The PIN is optional (nullable) to maintain backward compatibility with existing parties.

---

## Phase 2: New Route Structure

### Routes to Create/Modify

| Route | Purpose | New/Modified |
|-------|---------|--------------|
| `/host/verify-pin/:code` | PIN entry authentication | **New** |
| `/host/setup/:code` | Pre-event setup (guests, entrants) | **Modified** |
| `/host/control/:code` | Live event control panel | **Modified** |

---

## Phase 3: Component Architecture

### New Components to Create

```text
src/
├── pages/
│   ├── HostVerifyPin.tsx          <- NEW: PIN entry screen
│   ├── HostSetup.tsx              <- MODIFIED: Collapsible sections, host participation
│   └── HostControl.tsx            <- MODIFIED: Enhanced tabs, better mobile UX
├── components/
│   └── host/
│       ├── HostHeader.tsx         <- NEW: Sticky header with menu
│       ├── QuickActionsSheet.tsx  <- NEW: Slide-in quick actions menu
│       ├── GuestStatusCard.tsx    <- NEW: Guest pick status display
│       ├── MatchScoringCard.tsx   <- NEW: Collapsible match scoring
│       ├── PropScoringCard.tsx    <- NEW: Prop YES/NO scoring
│       ├── BulkPropsModal.tsx     <- NEW: Score all props at once
│       ├── RumbleEntryControl.tsx <- NEW: Next entrant + dropdown
│       ├── ActiveWrestlerCard.tsx <- NEW: Active wrestler with eliminate button
│       ├── EliminationModal.tsx   <- NEW: Bottom sheet for elimination
│       ├── WinnerDeclarationModal.tsx <- NEW: Gold winner celebration modal
│       └── ConnectionStatus.tsx   <- NEW: Offline/reconnecting indicator
```

---

## Phase 4: Detailed Implementation

### 4.1 HostVerifyPin.tsx (New Route)

**Purpose:** iOS passcode-style PIN entry for host authentication

**Key Features:**
- 4 large input boxes (aspect-square, text-4xl)
- Auto-advance on digit entry
- Auto-submit when 4th digit entered
- Backspace navigates to previous box
- Inline error display (no alerts)
- Store verified PIN in localStorage as `party_${code}_pin`

**UX Flow:**
```text
1. User navigates to /host/verify-pin/1234
2. Enters 4-digit PIN
3. Validates against parties.host_pin
4. On success: Store in localStorage, redirect to /host/setup/:code
5. On failure: Show inline error, clear inputs
```

**Component Structure:**
```tsx
<div className="min-h-screen flex flex-col items-center justify-center p-6">
  <Lock className="text-primary mb-6" size={48} />
  <h1 className="text-2xl font-black mb-2">Host Access</h1>
  <p className="text-muted-foreground mb-8">Enter your 4-digit PIN</p>
  
  <div className="flex gap-3 mb-6">
    {[0, 1, 2, 3].map((index) => (
      <input
        key={index}
        type="text"
        inputMode="numeric"
        maxLength={1}
        className="aspect-square w-16 h-16 text-4xl font-bold text-center 
                   bg-card border-2 border-border rounded-xl focus:border-primary"
      />
    ))}
  </div>
  
  {error && (
    <p className="text-destructive text-sm mb-4">{error}</p>
  )}
  
  <button className="text-sm text-muted-foreground underline">
    Forgot PIN?
  </button>
</div>
```

---

### 4.2 HostSetup.tsx (Modified)

**Purpose:** Pre-event setup with collapsible sections and host participation tracking

**Layout Structure:**
```text
+-------------------------------------+
| Header (Sticky)                     | <- Party code, hamburger menu
+-------------------------------------+
| Status Overview Card                | <- X/Y guests ready, picks complete %
+-------------------------------------+
| Host Participation Card (if host)   | <- "You haven't completed picks yet"
+-------------------------------------+
| Guests List (Collapsible)           | <- Each guest with pick status
+-------------------------------------+
| Men's Entrants (Collapsible)        | <- Editable wrestler list
+-------------------------------------+
| Women's Entrants (Collapsible)      | <- Editable wrestler list
+-------------------------------------+
| Quick Actions                       | <- TV Display, Copy Code
+-------------------------------------+
| Start Event Button (Sticky Footer)  | <- Disabled if host picks incomplete
+-------------------------------------+
```

**Key Improvements:**
1. **Collapsible Sections** using `Collapsible` from Radix
2. **Real-time guest status** with check/clock icons
3. **Host participation check** - If `host_player_id` exists and picks incomplete, show warning
4. **Disabled start button** with explanation tooltip

**GuestStatusCard Component:**
```tsx
<div className="p-4 bg-muted/50 rounded-lg border border-border">
  <div className="flex items-center justify-between">
    <div>
      <div className="font-semibold text-white">{guest.display_name}</div>
      <div className="text-sm text-muted-foreground">
        {guest.picks_completed ? 'Picks complete' : `${guest.picks_count}/7 picks`}
      </div>
    </div>
    {guest.picks_completed ? (
      <Check className="w-5 h-5 text-primary" />
    ) : (
      <Clock className="w-5 h-5 text-muted-foreground" />
    )}
  </div>
</div>
```

---

### 4.3 HostControl.tsx (Major Rewrite)

**Purpose:** Live event control panel with enhanced mobile UX

**Tab Structure:**
- **Pre-Rumble:** `[Matches]` `[Props]`
- **During Men's:** `[Matches]` `[Props]` `[Men's Rumble]` `[Women's]`
- **Active tab gets red dot indicator**

**Tab 1: Matches**

Collapsible match cards with state-based styling:

```text
States:
- Unscored: border-border, "Not Scored" text
- Selected: border-primary, bg-primary/10
- Scored: border-green-900, bg-green-950/20, checkmark
```

**MatchScoringCard Structure:**
```tsx
<Collapsible>
  <CollapsibleTrigger className="w-full">
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
      <span className="font-semibold">{match.title}</span>
      <div className="flex items-center gap-2">
        {isScored ? <Check className="text-green-500" /> : <ChevronDown />}
      </div>
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent className="p-4 bg-card/50 border-x border-b rounded-b-xl">
    <div className="flex gap-2 mb-3">
      {match.options.map((option) => (
        <Button
          key={option}
          variant={selectedWinner === option ? "gold" : "outline"}
          className="flex-1 min-h-[48px]"
          onClick={() => setSelectedWinner(option)}
        >
          {option}
        </Button>
      ))}
    </div>
    {selectedWinner && (
      <Button variant="gold" className="w-full min-h-[48px]">
        Confirm {selectedWinner} Wins
      </Button>
    )}
  </CollapsibleContent>
</Collapsible>
```

**Tab 2: Props**

Split into Men's Props and Women's Props sections with bulk scoring:

```tsx
<div className="space-y-6">
  <section>
    <h3 className="font-bold mb-4">Men's Rumble Props</h3>
    {CHAOS_PROPS.map((prop) => (
      <PropScoringCard
        key={prop.id}
        prop={prop}
        matchId={`mens_chaos_${prop.id}`}
        onScore={handleScoreProp}
      />
    ))}
    <Button variant="outline" className="w-full mt-4">
      Score All Men's Props at Once
    </Button>
  </section>
  
  <section>
    <h3 className="font-bold mb-4">Women's Rumble Props</h3>
    {/* Same structure */}
  </section>
</div>
```

**Bulk Props Modal (Drawer on mobile):**
```tsx
<Drawer>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Score Men's Rumble Props</DrawerTitle>
    </DrawerHeader>
    <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
      {CHAOS_PROPS.map((prop) => (
        <div key={prop.id} className="flex items-center justify-between">
          <span>{prop.shortName}</span>
          <div className="flex gap-2">
            <Button variant={answers[prop.id] === "YES" ? "gold" : "outline"}>YES</Button>
            <Button variant={answers[prop.id] === "NO" ? "gold" : "outline"}>NO</Button>
          </div>
        </div>
      ))}
    </div>
    <DrawerFooter>
      <Button variant="gold" disabled={!allAnswered}>
        Submit All ({Object.keys(answers).length}/6)
      </Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**Tab 3 & 4: Rumble Control**

Mobile-first layout with sticky entry control:

```text
+-------------------------------------+
| Progress: 15/30 entered (Sticky)    |
+-------------------------------------+
| NEXT ENTRANT: #16                   |
| Owner: Kyle                         |
| [Select Wrestler ▼]                 |
| [Confirm #16 Entry]                 |
+-------------------------------------+
| ACTIVE WRESTLERS (8)                |
+-------------------------------------+
| #12 • Roman Reigns (Kyle)           |
| Duration: 12:34           [ELIM]    |
+-------------------------------------+
| #5 • Cody Rhodes (Sarah)            |
| Duration: 8:22            [ELIM]    |
+-------------------------------------+
```

**RumbleEntryControl Component:**
```tsx
<div className="bg-primary/10 border border-primary rounded-xl p-4 space-y-3">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Next Entrant</span>
    <span className="text-3xl font-black text-primary">#{nextNumber}</span>
  </div>
  <div className="text-sm">
    Owner: <span className="font-semibold">{ownerName || "Vacant"}</span>
  </div>
  <Select value={selectedWrestler} onValueChange={setSelectedWrestler}>
    <SelectTrigger className="min-h-[48px]">
      <SelectValue placeholder="Select wrestler..." />
    </SelectTrigger>
    <SelectContent>
      {entrants.map((wrestler) => (
        <SelectItem key={wrestler} value={wrestler} className="min-h-[44px]">
          {wrestler}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Button variant="gold" className="w-full min-h-[48px]" disabled={!selectedWrestler}>
    Confirm #{nextNumber} Entry
  </Button>
</div>
```

**ActiveWrestlerCard with duration:**
```tsx
<div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <span className="font-bold text-primary">#{number}</span>
      <span className="font-semibold">{wrestlerName}</span>
    </div>
    <div className="text-sm text-muted-foreground">
      {ownerName} • {formatDuration(duration)}
    </div>
  </div>
  <Button variant="destructive" size="sm" className="min-h-[44px]">
    <X size={16} className="mr-1" />
    Eliminate
  </Button>
</div>
```

**EliminationModal (Bottom Sheet):**
```tsx
<Drawer>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Eliminate #{number} {wrestlerName}?</DrawerTitle>
    </DrawerHeader>
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select who eliminated them:
      </p>
      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        {activeWrestlers.filter(w => w.number !== number).map((wrestler) => (
          <button
            key={wrestler.number}
            className={cn(
              "w-full p-3 rounded-lg border text-left min-h-[48px]",
              eliminatedBy === wrestler.number 
                ? "border-primary bg-primary/10" 
                : "border-border"
            )}
            onClick={() => setEliminatedBy(wrestler.number)}
          >
            #{wrestler.number} • {wrestler.wrestler_name}
          </button>
        ))}
      </div>
    </div>
    <DrawerFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="destructive" disabled={!eliminatedBy}>
        Confirm Elimination
      </Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**WinnerDeclarationModal:**
```tsx
<Dialog>
  <DialogContent className="bg-gradient-to-b from-primary/20 to-background border-primary">
    <div className="text-center py-8">
      <Trophy className="mx-auto text-primary mb-4" size={64} />
      <div className="text-6xl font-black text-primary mb-2">
        #{winner.number}
      </div>
      <div className="text-3xl font-bold mb-6">{winner.wrestler_name}</div>
      
      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left text-sm space-y-2">
        <div className="flex justify-between">
          <span>Number Owner ({ownerName})</span>
          <span className="font-bold text-primary">+50 pts</span>
        </div>
        <div className="flex justify-between">
          <span>Correct Predictions</span>
          <span className="font-bold text-primary">+50 pts each</span>
        </div>
        <div className="flex justify-between">
          <span>Iron {type === "mens" ? "Man" : "Woman"} ({ironManName})</span>
          <span className="font-bold text-primary">+20 pts</span>
        </div>
      </div>
      
      <Button variant="gold" className="w-full min-h-[52px] text-lg">
        <Trophy size={20} className="mr-2" />
        Confirm Winner & Award Points
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

### 4.4 QuickActionsSheet Component

**Slide-in menu accessible from header hamburger:**

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu size={24} />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[300px]">
    <SheetHeader>
      <SheetTitle>Quick Actions</SheetTitle>
    </SheetHeader>
    <div className="space-y-2 mt-6">
      <button className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted">
        <Tv className="text-primary" size={20} />
        <div className="text-left">
          <div className="font-semibold">TV Display</div>
          <div className="text-sm text-muted-foreground">Open in new tab</div>
        </div>
      </button>
      
      <button className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted">
        <Copy className="text-primary" size={20} />
        <div className="text-left">
          <div className="font-semibold">Copy Party Code</div>
          <div className="text-sm text-muted-foreground">Code: {code}</div>
        </div>
      </button>
      
      <button className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted">
        <ClipboardList className="text-primary" size={20} />
        <div className="text-left">
          <div className="font-semibold">View All Picks</div>
          <div className="text-sm text-muted-foreground">See predictions</div>
        </div>
      </button>
      
      <button className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted">
        <Hash className="text-primary" size={20} />
        <div className="text-left">
          <div className="font-semibold">Number Assignments</div>
          <div className="text-sm text-muted-foreground">Who owns what</div>
        </div>
      </button>
      
      <div className="border-t border-border my-4" />
      
      <button className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted text-destructive">
        <LogOut size={20} />
        <div className="text-left">
          <div className="font-semibold">Sign Out</div>
          <div className="text-sm text-muted-foreground">Clear PIN session</div>
        </div>
      </button>
    </div>
  </SheetContent>
</Sheet>
```

---

### 4.5 ConnectionStatus Component

**Fixed banner for connection issues:**

```tsx
{!isConnected && (
  <motion.div
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 left-0 right-0 bg-destructive/90 border-b border-destructive p-3 z-50"
  >
    <div className="flex items-center justify-center gap-2">
      <AlertCircle className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-medium">
        Connection Lost - Reconnecting...
      </span>
    </div>
  </motion.div>
)}
```

---

## Phase 5: Auto-Calculated Bonuses

### Scoring Logic (Already Exists - Verify Implementation)

**Jobber Penalty (-10 pts):**
```typescript
const durationSeconds = (eliminationTime - entryTime) / 1000;
if (durationSeconds < 60 && eliminatedOwner) {
  await updatePlayerPoints(eliminatedOwner.id, SCORING.JOBBER_PENALTY);
  toast.warning(`Jobber Penalty! ${eliminatedOwner.display_name} loses 10 pts`);
}
```

**Final Four (+10 pts each):**
```typescript
const activeCount = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length;
if (activeCount === 4 && !finalFourAwarded[type]) {
  for (const num of activeNumbers) {
    if (num.assigned_to_player_id) {
      await updatePlayerPoints(num.assigned_to_player_id, SCORING.FINAL_FOUR);
    }
  }
  setFinalFourAwarded(prev => ({ ...prev, [type]: true }));
  toast.success('Final Four! +10 pts awarded to each owner');
}
```

**Iron Man/Woman (+20 pts) - On Winner Declaration:**
```typescript
const durations = numbers.map(n => ({
  ...n,
  duration: n.entry_timestamp 
    ? (n.elimination_timestamp 
        ? new Date(n.elimination_timestamp).getTime() 
        : Date.now()) - new Date(n.entry_timestamp).getTime()
    : 0
}));

const ironPerson = durations.reduce((max, n) => n.duration > max.duration ? n : max);
if (ironPerson.assigned_to_player_id) {
  await updatePlayerPoints(ironPerson.assigned_to_player_id, SCORING.IRON_MAN);
}
```

---

## Phase 6: Session & Authentication

### PIN Storage Pattern

```typescript
// Store after successful verification
localStorage.setItem(`party_${code}_pin`, hashedPin);

// Check on page load
const storedPin = localStorage.getItem(`party_${code}_pin`);
if (!storedPin) {
  navigate(`/host/verify-pin/${code}`);
}

// Clear on sign out
localStorage.removeItem(`party_${code}_pin`);
clearPlayerSession();
navigate('/');
```

### Session Verification Flow

```text
1. User accesses /host/setup/:code or /host/control/:code
2. Check localStorage for party_${code}_pin
3. If missing → Redirect to /host/verify-pin/:code
4. If present → Verify against DB (optional) → Allow access
```

---

## Phase 7: Route Updates

**Update App.tsx:**
```tsx
<Route path="/host/verify-pin/:code" element={<HostVerifyPin />} />
<Route path="/host/setup/:code" element={<HostSetup />} />
<Route path="/host/control/:code" element={<HostControl />} />
```

---

## Implementation Order

### Step 1: Database Migration
- Add `host_pin` column to parties table

### Step 2: PIN Verification (New)
- Create `HostVerifyPin.tsx` page
- Implement PIN input with auto-advance
- Add localStorage storage

### Step 3: Host Setup Improvements
- Add collapsible sections
- Add guest status tracking with picks count
- Add host participation check
- Update start button logic

### Step 4: Host Control Rewrite
- Create modular components
- Implement collapsible match cards
- Split props by Men's/Women's
- Add bulk props modal
- Improve rumble control UX
- Add elimination bottom sheet
- Add winner declaration modal

### Step 5: Quick Actions Menu
- Create QuickActionsSheet component
- Add to header

### Step 6: Connection Status
- Add real-time connection monitoring
- Show reconnecting banner

---

## Mobile Optimization Checklist

- All touch targets 44px minimum height
- Single-column layouts on mobile
- Bottom sheets for modals (Drawer component)
- Sticky headers and footers
- No horizontal scrolling at 375px
- Thumb-zone optimized (primary actions in bottom third)
- Text minimum 14px body size

---

## Success Metrics

- Host can score a match in under 5 seconds
- No accidental eliminations (confirmation required)
- Works one-handed on phone
- All scoring reflects in leaderboard within 500ms
- Connection loss recovers automatically
