

# TV Display Number Cell Redesign

## Overview

Transform the Rumble entry grid cells from the current small circular image layout to a full-frame wrestler image design with a transparent name banner and player-assigned color coding. This change applies only to TV mode, preserving the existing mobile/picking view.

---

## Current vs New Design

```text
CURRENT CELL:
+------------------+
|  [#]             |
|                  |
|   ( o )  <- small circle photo
|   Name           |
|   [AB]  <- initials |
+------------------+

NEW CELL:
+------------------+
|  [#]             |
|                  |
|   FULL           |
|   WRESTLER       |
|   PHOTO          |
|   COVERAGE       |
|__________________|
| [■] Rey Mysterio | <- color coded banner
+------------------+
```

---

## Design Specifications

### 1. Full-Frame Wrestler Image
- Image covers the entire cell using `object-cover`
- Wrestler photo becomes the background
- Rounded corners on the cell container

### 2. Name Banner (Bottom)
- Semi-transparent dark gradient overlay at bottom
- Wrestler's first name displayed
- Small color indicator dot/bar for player ownership

### 3. Player Color Coding
Instead of initials, each player gets a unique color from a predefined palette:

```typescript
const PLAYER_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-500", name: "Blue" },
  { bg: "bg-orange-500", border: "border-orange-500", name: "Orange" },
  { bg: "bg-purple-500", border: "border-purple-500", name: "Purple" },
  { bg: "bg-cyan-500", border: "border-cyan-500", name: "Cyan" },
  { bg: "bg-pink-500", border: "border-pink-500", name: "Pink" },
  { bg: "bg-amber-500", border: "border-amber-500", name: "Amber" },
  { bg: "bg-teal-500", border: "border-teal-500", name: "Teal" },
  { bg: "bg-indigo-500", border: "border-indigo-500", name: "Indigo" },
];
```

Colors are assigned based on player index in the party (consistent across all views).

### 4. Active/Eliminated States (No Green/Red)

**Active State:**
- Golden glow border animation (uses existing primary/gold color)
- Pulsing shadow effect
- Full brightness image

**Eliminated State:**
- Grayscale filter on image
- Reduced opacity (60%)
- Diagonal X overlay
- Muted border

**Pending State:**
- Empty cell with just the large entry number
- No image, no banner

---

## Technical Implementation

### New Component: `TvNumberCell.tsx`

A separate TV-specific component that doesn't affect the existing `NumberCell.tsx` used elsewhere:

```tsx
interface TvNumberCellProps {
  number: number;
  wrestlerName: string | null;
  playerColor: { bg: string; border: string } | null;
  status: "pending" | "active" | "eliminated";
  scale?: number;
}

export function TvNumberCell({
  number,
  wrestlerName,
  playerColor,
  status,
  scale = 1.0,
}: TvNumberCellProps) {
  const firstName = wrestlerName?.split(" ")[0] || "";
  const imageUrl = wrestlerName ? getWrestlerImageUrl(wrestlerName) : null;

  // Pending state - just show number
  if (status === "pending") {
    return (
      <div className="relative aspect-square rounded-xl bg-muted/30 border-2 border-muted flex items-center justify-center">
        <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <span className="text-3xl font-bold text-muted-foreground">{number}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
        status === "active" && "border-primary animate-winner-glow",
        status === "eliminated" && "border-muted opacity-60"
      )}
    >
      {/* Number badge */}
      <div className={cn(
        "absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-20",
        status === "active" && "bg-primary text-primary-foreground",
        status === "eliminated" && "bg-muted text-muted-foreground"
      )}>
        {number}
      </div>

      {/* Full-frame wrestler image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={wrestlerName}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            status === "eliminated" && "grayscale"
          )}
        />
      )}

      {/* Bottom banner with name + player color */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2 px-2 z-10">
        <div className="flex items-center gap-1.5">
          {/* Player color dot */}
          {playerColor && (
            <div className={cn("w-3 h-3 rounded-full shrink-0", playerColor.bg)} />
          )}
          <span className="text-white text-xs font-semibold truncate">
            {firstName}
          </span>
        </div>
      </div>

      {/* Eliminated X overlay */}
      {status === "eliminated" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-full h-0.5 bg-white/60 rotate-45" />
          <div className="absolute w-full h-0.5 bg-white/60 -rotate-45" />
        </div>
      )}
    </div>
  );
}
```

### Player Color Assignment Logic

Add a utility function to `TvViewNavigator.tsx`:

```typescript
const PLAYER_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-500" },
  { bg: "bg-orange-500", border: "border-orange-500" },
  { bg: "bg-purple-500", border: "border-purple-500" },
  { bg: "bg-cyan-500", border: "border-cyan-500" },
  { bg: "bg-pink-500", border: "border-pink-500" },
  { bg: "bg-amber-500", border: "border-amber-500" },
  { bg: "bg-teal-500", border: "border-teal-500" },
  { bg: "bg-indigo-500", border: "border-indigo-500" },
];

const getPlayerColor = (playerId: string | null, players: Player[]) => {
  if (!playerId) return null;
  const index = players.findIndex(p => p.id === playerId);
  if (index === -1) return null;
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
};
```

### Update `renderNumberGrid()` in TvViewNavigator

Replace `NumberCell` with `TvNumberCell` and pass the player color:

```tsx
const renderNumberGrid = (numbers: RumbleNumber[], rumbleId: string) => {
  return (
    <div className={cn("grid grid-cols-10", gridGapClass)}>
      {numbers.map((num) => (
        <TvNumberCell
          key={num.number}
          number={num.number}
          wrestlerName={num.wrestler_name}
          playerColor={getPlayerColor(num.assigned_to_player_id, players)}
          status={getNumberStatus(num)}
          scale={scale}
        />
      ))}
    </div>
  );
};
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/tv/TvNumberCell.tsx` | **Create** | New TV-specific number cell with full-frame image |
| `src/components/tv/TvViewNavigator.tsx` | **Modify** | Use TvNumberCell, add player color assignment |
| `src/lib/wrestler-data.ts` | **No change** | Already has `getWrestlerImageUrl` function |
| `src/components/tv/NumberCell.tsx` | **No change** | Preserved for mobile/other views |

---

## Visual States Summary

| State | Border | Image | Banner | Overlay |
|-------|--------|-------|--------|---------|
| **Pending** | Muted | None (just #) | None | None |
| **Active** | Gold glow pulse | Full color | Name + color dot | None |
| **Eliminated** | Muted | Grayscale 60% | Name + color dot | X stripes |

---

## Color Palette (Avoiding Green/Red)

The 8 player colors ensure no collision with status colors:
- Blue, Orange, Purple, Cyan, Pink, Amber, Teal, Indigo

All visible against both light and dark backgrounds, and distinguishable from gold (active) and muted (eliminated) states.

