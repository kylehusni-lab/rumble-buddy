import { useRef } from "react";
import { motion } from "framer-motion";
import { Crown, ChevronLeft, ChevronRight, Check, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WrestlerImage } from "./WrestlerImage";
import { cn } from "@/lib/utils";

interface MatchResult {
  match_id: string;
  result: string;
}

interface Player {
  id: string;
  display_name: string;
}

interface Pick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface RumbleWinnerPredictionsProps {
  gender: "mens" | "womens";
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
}

export function RumbleWinnerPredictions({
  gender,
  players,
  picks,
  matchResults,
}: RumbleWinnerPredictionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const winnerMatchId = gender === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
  const winnerResult = matchResults.find(r => r.match_id === winnerMatchId);
  const hasWinner = !!winnerResult;

  // Get all players' winner picks
  const winnerPicks = players.map(player => {
    const pick = picks.find(p => p.player_id === player.id && p.match_id === winnerMatchId);
    return {
      player,
      prediction: pick?.prediction || null,
      isCorrect: hasWinner && pick?.prediction === winnerResult?.result,
      isIncorrect: hasWinner && pick?.prediction && pick.prediction !== winnerResult?.result,
    };
  }).filter(p => p.prediction); // Only show players who made a pick

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (winnerPicks.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Winner Predictions</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {winnerPicks.map(({ player, prediction, isCorrect, isIncorrect }) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex-shrink-0 w-32 p-3 rounded-xl border-2 bg-card/50 backdrop-blur-sm",
              "flex flex-col items-center gap-2 text-center",
              isCorrect && "border-success bg-success/10",
              isIncorrect && "border-destructive/50 bg-destructive/5 opacity-60",
              !hasWinner && "border-muted"
            )}
          >
            {/* Wrestler Photo */}
            <div className="relative">
              <WrestlerImage
                name={prediction || ""}
                size="sm"
                className={cn(
                  "border-2",
                  isCorrect && "border-success",
                  isIncorrect && "border-destructive/50 grayscale",
                  !hasWinner && "border-muted"
                )}
              />
              {/* Status Icon */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                isCorrect && "bg-success",
                isIncorrect && "bg-destructive",
                !hasWinner && "bg-muted"
              )}>
                {isCorrect && <Check className="w-3 h-3 text-success-foreground" />}
                {isIncorrect && <X className="w-3 h-3 text-destructive-foreground" />}
                {!hasWinner && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>

            {/* Wrestler Name */}
            <div className={cn(
              "text-xs font-medium line-clamp-1",
              isIncorrect && "text-muted-foreground"
            )}>
              {prediction}
            </div>

            {/* Player Name */}
            <div className="text-xs text-muted-foreground line-clamp-1">
              {player.display_name}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
