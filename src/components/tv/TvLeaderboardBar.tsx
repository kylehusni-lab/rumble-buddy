import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface TvLeaderboardBarProps {
  players: Player[];
}

export function TvLeaderboardBar({ players }: TvLeaderboardBarProps) {
  // Sort players by points
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
      <div className="flex items-center gap-4">
        <Trophy className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="font-semibold text-sm text-muted-foreground flex-shrink-0">Leaderboard</span>
        <div className="flex items-center gap-3 overflow-x-auto">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0",
                index === 0 && "bg-primary/20 border border-primary",
                index === 1 && "bg-muted/80",
                index === 2 && "bg-muted/60",
                index > 2 && "bg-muted/40"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 && "tv-rank-gold",
                index === 1 && "tv-rank-silver",
                index === 2 && "tv-rank-bronze",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </span>
              <span className="font-medium text-sm">{player.display_name}</span>
              <span className={cn(
                "font-bold",
                index === 0 && "text-primary"
              )}>
                {player.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
