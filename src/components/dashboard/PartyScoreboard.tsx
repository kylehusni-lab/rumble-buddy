import { useMemo } from "react";
import { Trophy, Medal, Crown, ArrowLeft, Tv, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";

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

interface PartyScoreboardProps {
  players: Player[];
  partyCode: string;
  eventTitle?: string;
  currentPlayerId?: string;
  isHost?: boolean;
}

export function PartyScoreboard({ 
  players, 
  partyCode, 
  eventTitle = "Event Complete",
  currentPlayerId,
  isHost = false,
}: PartyScoreboardProps) {
  const navigate = useNavigate();

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

  // Get player color by index
  const getPlayerColor = (index: number) => {
    return PLAYER_COLORS[index % PLAYER_COLORS.length].hex;
  };

  // Find current player's rank
  const currentPlayerRank = useMemo(() => {
    if (!currentPlayerId) return null;
    const idx = sortedPlayers.findIndex(p => p.id === currentPlayerId);
    return idx >= 0 ? idx + 1 : null;
  }, [sortedPlayers, currentPlayerId]);

  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/my-parties")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/party/${partyCode}/picks`}>
                <Eye className="h-4 w-4 mr-2" />
                View Picks
              </Link>
            </Button>
            {isHost && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/tv/${partyCode}`}>
                  <Tv className="h-4 w-4 mr-2" />
                  TV Mode
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Event complete banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground">
            <Trophy className="h-4 w-4" />
            {eventTitle}
          </div>
          <p className="text-muted-foreground text-sm">Final Standings</p>
        </div>

        {/* Winner spotlight */}
        {winner && (
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-6 text-center space-y-3">
            <Crown className="h-8 w-8 mx-auto text-primary" />
            <div>
              <p className="text-sm text-primary/80 uppercase tracking-wider font-medium">Champion</p>
              <h2 className="text-2xl font-bold">{winner.display_name}</h2>
            </div>
            <div className="text-3xl font-bold text-primary">
              {winner.points} <span className="text-lg font-normal">pts</span>
            </div>
          </div>
        )}

        {/* Your result (if not winner) */}
        {currentPlayerRank && currentPlayerRank > 1 && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                currentPlayerRank === 2 && "bg-[#C0C0C0]/20 text-[#C0C0C0]",
                currentPlayerRank === 3 && "bg-[#CD7F32]/20 text-[#CD7F32]",
                currentPlayerRank > 3 && "bg-muted text-muted-foreground"
              )}>
                #{currentPlayerRank}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your finish</p>
                <p className="font-semibold">
                  {sortedPlayers.find(p => p.id === currentPlayerId)?.display_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {sortedPlayers.find(p => p.id === currentPlayerId)?.points || 0}
              </p>
              <p className="text-sm text-muted-foreground">pts</p>
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground px-1">
            Final Leaderboard
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const originalIndex = players.findIndex(p => p.id === player.id);
              const playerColor = getPlayerColor(originalIndex);
              const barWidth = maxPoints > 0 
                ? Math.max((player.points / maxPoints) * 100, 2) 
                : 0;
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 h-14 px-4 rounded-xl transition-all",
                    "bg-card border border-border",
                    isCurrentPlayer && "ring-2 ring-primary/50 bg-primary/5"
                  )}
                >
                  {/* Rank */}
                  <span
                    className={cn(
                      "text-lg font-bold w-6 text-center",
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
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: playerColor }}
                  />

                  {/* Name */}
                  <span className={cn(
                    "font-medium flex-shrink-0 truncate",
                    isCurrentPlayer && "text-primary"
                  )}>
                    {player.display_name}
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: playerColor,
                      }}
                    />
                  </div>

                  {/* Points */}
                  <div className="w-16 text-right flex-shrink-0">
                    <span className="text-lg font-bold">
                      {player.points}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
