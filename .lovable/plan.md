

# Host Control Mobile Layout Improvements

## Overview

Improve the mobile layout of the Host Control page with better navigation, collapsible sections with point totals, and auto-scoring for Final Four participants.

---

## Changes Summary

### 1. Redesigned Header (`src/components/host/HostHeader.tsx`)

**Current Layout:**
```
[Logo]                    [Code: 1534 📋] [☰]
```

**New Layout:**
```
[← Home]         Party #1534          [☰]
```

Changes:
- Replace Logo with a back arrow icon that navigates to home
- Center the party code prominently
- Keep the menu (hamburger) icon on the right
- Simpler, more mobile-friendly header

---

### 2. Fixed Navigation Arrows (`src/pages/HostControl.tsx`)

**Current Issues:**
- Tab navigation requires horizontal scrolling
- "Swipe to navigate" message takes up space
- Arrows are not always visible

**New Design:**
- Remove any "swipe to navigate" hints
- Add fixed left/right arrow buttons that are always visible
- Position arrows at the bottom of the tab content area or as floating buttons
- Keep tab indicators for showing current position

```
┌─────────────────────────────────┐
│  [← Home]   Party #1534    [☰]  │
├─────────────────────────────────┤
│  [Matches] [Props] [Men's] [Wom]│
├─────────────────────────────────┤
│                                 │
│       Tab Content Here          │
│                                 │
│                                 │
├─────────────────────────────────┤
│     [◀]    ● ● ● ●      [▶]     │  ← Fixed nav arrows
└─────────────────────────────────┘
```

---

### 3. Collapsible Sections with Point Totals

Make each major section collapsible with a summary when collapsed:

**Matches Tab:**
```
┌──────────────────────────────────────┐
│ ▼ Undercard Matches              3/3 │  ← Collapsible header
│   scored, 75 pts awarded             │
├──────────────────────────────────────┤
│   [Match cards when expanded]        │
└──────────────────────────────────────┘
```

**Props Tab - Each section collapsible:**
```
┌──────────────────────────────────────┐
│ ▼ Men's Rumble Props             4/6 │
│   40 pts awarded                     │
├──────────────────────────────────────┤
│ ▼ Men's Final Four               4/4 │
│   40 pts awarded                     │
├──────────────────────────────────────┤
│ ▼ Men's Chaos Props              6/6 │
│   60 pts awarded                     │
└──────────────────────────────────────┘
```

Implementation:
- Wrap each section in a Collapsible component
- Calculate scored count and total points for each section
- Show summary stats in the collapsed header
- Default to collapsed for scored sections, expanded for unscored

---

### 4. Auto-Score Final Four Participants

**Current Behavior:** Final Four predictions must be manually scored one by one

**New Behavior:** When Final Four is detected (exactly 4 active wrestlers), automatically score all player predictions:

Logic:
1. When `finalFourArray.length === 4` and Final Four hasn't been scored yet
2. For each player's Final Four picks (`mens_final_four_1` through `mens_final_four_4`)
3. Check if their pick matches ANY of the 4 wrestlers in the Final Four
4. Auto-insert match results and award points

Add a "Score Final Four Predictions" button that:
- Shows when Final Four is detected
- Scores all 4 Final Four prop slots for all players
- Awards +10 pts for each correct Final Four pick

```typescript
// New function: handleScoreFinalFourPredictions
const handleScoreFinalFourPredictions = async (type: "mens" | "womens") => {
  const numbers = type === "mens" ? mensNumbers : womensNumbers;
  const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
  
  if (active.length !== 4) {
    toast.error("Final Four not yet reached");
    return;
  }
  
  const finalFourNames = active.map(n => n.wrestler_name);
  
  // Score each slot with the corresponding wrestler
  for (let slot = 1; slot <= 4; slot++) {
    const propId = `${type}_final_four_${slot}`;
    const wrestler = finalFourNames[slot - 1];
    if (wrestler) {
      await handleScoreRumbleProp(propId, wrestler);
    }
  }
  
  // Award points to players whose picks match ANY of the Final Four
  // This is already handled by handleScoreRumbleProp
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/host/HostHeader.tsx` | Redesign with back arrow, centered party code |
| `src/pages/HostControl.tsx` | Add fixed nav arrows, collapsible sections, Final Four auto-scoring |

---

## Technical Implementation

### HostHeader Changes
```typescript
interface HostHeaderProps {
  code: string;
  onMenuClick: () => void;
}

export function HostHeader({ code, onMenuClick }: HostHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
        {/* Back to Home */}
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </Button>
        
        {/* Party Code - centered */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Party #{code}</span>
          <Button variant="ghost" size="icon" onClick={handleCopyCode}>
            <Copy size={16} />
          </Button>
        </div>
        
        {/* Menu */}
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu size={24} />
        </Button>
      </div>
    </div>
  );
}
```

### Fixed Tab Navigation
```typescript
// Add at bottom of tab content
<div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 safe-area-pb">
  <div className="flex items-center justify-between max-w-lg mx-auto">
    <Button 
      variant="outline" 
      size="icon"
      onClick={() => navigateTab(-1)}
      disabled={currentTabIndex === 0}
    >
      <ChevronLeft size={24} />
    </Button>
    
    {/* Tab indicators */}
    <div className="flex gap-2">
      {tabs.map((tab, i) => (
        <div 
          key={tab}
          className={cn(
            "w-2 h-2 rounded-full",
            i === currentTabIndex ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
    
    <Button 
      variant="outline" 
      size="icon"
      onClick={() => navigateTab(1)}
      disabled={currentTabIndex === tabs.length - 1}
    >
      <ChevronRight size={24} />
    </Button>
  </div>
</div>
```

### Collapsible Section Component
```typescript
interface CollapsibleSectionProps {
  title: string;
  scoredCount: number;
  totalCount: number;
  pointsAwarded: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ 
  title, 
  scoredCount, 
  totalCount, 
  pointsAwarded,
  defaultOpen = true,
  children 
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2">
        <div className="flex items-center gap-2">
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          <span className="font-semibold">{title}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {scoredCount}/{totalCount} scored
          {pointsAwarded > 0 && (
            <span className="text-success ml-2">+{pointsAwarded} pts</span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Final Four Auto-Scoring
```typescript
// Add button in Props tab when Final Four is detected
{mensDerivedProps.mens_final_four_1 && !getMatchResult('mens_final_four_1') && (
  <Button
    variant="gold"
    className="w-full"
    onClick={() => handleScoreFinalFourPredictions("mens")}
  >
    Score All Men's Final Four Predictions
  </Button>
)}
```

---

## User Experience Improvements

**Navigation:**
- One-tap back to home (no hunting for menu)
- Always-visible arrow buttons for tab navigation
- No more hidden navigation or scroll-dependent actions

**Sections:**
- Collapsed sections reduce visual clutter
- Point totals visible at a glance even when collapsed
- Quick understanding of overall progress

**Final Four:**
- One button to score all 4 Final Four predictions at once
- No manual entry needed when the system already knows the answer

