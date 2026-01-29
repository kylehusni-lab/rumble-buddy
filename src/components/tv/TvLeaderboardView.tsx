import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Player color palette for bars
const PLAYER_COLORS = [
  { hex: "#e91e63" },  // Pink
  { hex: "#f44336" },  // Red
  { hex: "#ff9800" },  // Orange
  { hex: "#ffc107" },  // Amber
  { hex: "#4caf50" },  // Green
  { hex: "#00bcd4" },  // Cyan
  { hex: "#2196f3" },  // Blue
  { hex: "#9c27b0" },  // Purple
  { hex: "#795548" },  // Brown
  { hex: "#607d8b" },  // Blue Gray
];

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface TvLeaderboardViewProps {
  players: Player[];
}

export function TvLeaderboardView({ players }: TvLeaderboardViewProps) {
  // Sort players by points
  const sortedPlayers = useMemo(() => 
    [...players].sort((a, b) => b.points - a.points),
    [players]
  );

  // Calculate max points for bar scaling
  const maxPoints = useMemo(() => {
    const max = Math.max(...players.map(p => p.points), 1);
    return max;
  }, [players]);

  // Check if event has started (any points > 0)
  const hasStarted = players.some(p => p.points > 0);

  // Get player color by index
  const getPlayerColor = (index: number) => {
    return PLAYER_COLORS[index % PLAYER_COLORS.length].hex;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 px-4">
      {/* Pre-event message */}
      {!hasStarted && (
        <div className="text-center text-muted-foreground text-lg mb-6">
          Predictions locked — waiting for event to start
        </div>
      )}

      {/* Leaderboard rows */}
      {sortedPlayers.map((player, index) => {
        // Find original index for consistent color
        const originalIndex = players.findIndex(p => p.id === player.id);
        const playerColor = getPlayerColor(originalIndex);
        const barWidth = hasStarted 
          ? Math.max((player.points / maxPoints) * 100, 2) 
          : 0;

        return (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-4 h-16 px-6 rounded-xl",
              "bg-card/30 border border-border/50 transition-all duration-300",
              index === 0 && hasStarted && "ring-2 ring-primary/50"
            )}
          >
            {/* Rank */}
            <span
              className={cn(
                "text-2xl font-bold w-8 text-center",
                index === 0 && "text-[#FFD700]",  // Gold
                index === 1 && "text-[#C0C0C0]",  // Silver
                index === 2 && "text-[#CD7F32]",  // Bronze
                index > 2 && "text-muted-foreground"
              )}
            >
              {index + 1}
            </span>

            {/* Color indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: playerColor }}
            />

            {/* Name */}
            <span className="text-xl font-medium flex-shrink-0 w-28 truncate">
              {player.display_name}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-4 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: playerColor,
                }}
              />
            </div>

            {/* Points */}
            <div className="w-24 text-right flex-shrink-0">
              <span className="text-2xl font-bold">
                {player.points}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
