import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center gap-3">
        <Trophy className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-bold">Leaderboard</h2>
        <Trophy className="w-8 h-8 text-primary" />
      </div>

      {/* Player Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
              index === 0 && "bg-gradient-to-br from-primary/30 to-primary/10 border-primary shadow-lg shadow-primary/20 scale-105",
              index === 1 && "bg-gradient-to-br from-muted/80 to-muted/40 border-muted-foreground/30",
              index === 2 && "bg-gradient-to-br from-muted/60 to-muted/30 border-muted-foreground/20",
              index > 2 && "bg-card/50 border-border"
            )}
          >
            {/* Rank Badge */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl font-black",
                index === 0 && "tv-rank-gold",
                index === 1 && "tv-rank-silver",
                index === 2 && "tv-rank-bronze",
                index > 2 && "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>

            {/* Player Name */}
            <span className={cn(
              "text-xl font-bold text-center",
              index === 0 && "text-primary"
            )}>
              {player.display_name}
            </span>

            {/* Points */}
            <div className={cn(
              "text-3xl font-black",
              index === 0 && "text-primary",
              index > 0 && "text-foreground"
            )}>
              {player.points}
              <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
