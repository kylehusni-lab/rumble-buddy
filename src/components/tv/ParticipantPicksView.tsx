import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Check, X } from "lucide-react";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  display_name: string;
}

interface Pick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface ParticipantPicksViewProps {
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
  currentMatchId?: string; // Optional override to sync with navigator
}

export function ParticipantPicksView({ players, picks, matchResults, currentMatchId }: ParticipantPicksViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find the current active match (fallback if no currentMatchId provided)
  const activeMatch = useMemo(() => {
    const completedMatchIds = new Set(matchResults.map(r => r.match_id));
    return UNDERCARD_MATCHES.find(m => !completedMatchIds.has(m.id));
  }, [matchResults]);

  // Get the match to display - prioritize currentMatchId if provided
  const displayMatch = useMemo(() => {
    // If currentMatchId is provided, use it directly
    if (currentMatchId) {
      const match = UNDERCARD_MATCHES.find(m => m.id === currentMatchId);
      if (match) {
        const result = matchResults.find(r => r.match_id === currentMatchId);
        return { 
          match, 
          isComplete: !!result, 
          result: result?.result || null 
        };
      }
    }
    
    // Fallback to auto-detection
    if (activeMatch) return { match: activeMatch, isComplete: false, result: null };
    
    // Show last completed undercard match
    const completedUndercards = UNDERCARD_MATCHES.filter(m => 
      matchResults.some(r => r.match_id === m.id)
    );
    
    if (completedUndercards.length > 0) {
      const lastMatch = completedUndercards[completedUndercards.length - 1];
      const result = matchResults.find(r => r.match_id === lastMatch.id);
      return { match: lastMatch, isComplete: true, result: result?.result || null };
    }
    
    return null;
  }, [currentMatchId, activeMatch, matchResults]);

  // Get picks for current match
  const currentPicks = useMemo(() => {
    if (!displayMatch?.match) return [];
    
    return players.map(player => {
      const pick = picks.find(p => p.player_id === player.id && p.match_id === displayMatch.match.id);
      return {
        player,
        pick: pick?.prediction || null,
        isCorrect: displayMatch.isComplete && pick?.prediction === displayMatch.result,
        isIncorrect: displayMatch.isComplete && pick?.prediction && pick.prediction !== displayMatch.result,
      };
    }).filter(p => p.pick); // Only show players who made picks
  }, [displayMatch, players, picks]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Don't render if no match or no picks
  if (!displayMatch?.match || currentPicks.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary">Who Did They Pick?</h3>
          <p className="text-sm text-muted-foreground">{displayMatch.match.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable picks */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {currentPicks.map(({ player, pick, isCorrect, isIncorrect }, index) => (
          <motion.div
            key={player.id}
            className={cn(
              "flex-shrink-0 w-40 p-4 rounded-xl border-2 flex flex-col items-center gap-2 relative",
              "bg-card/80 transition-all duration-300",
              isCorrect && "border-success bg-success/10",
              isIncorrect && "border-muted bg-muted/20 opacity-60",
              !isCorrect && !isIncorrect && "border-primary/30"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Result indicator */}
            {(isCorrect || isIncorrect) && (
              <motion.div
                className={cn(
                  "absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center",
                  isCorrect && "bg-success text-success-foreground",
                  isIncorrect && "bg-destructive text-destructive-foreground"
                )}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {isCorrect ? <Check size={16} /> : <X size={16} />}
              </motion.div>
            )}

            {/* Wrestler photo */}
            <WrestlerImage
              name={pick!}
              size="md"
              className={cn(
                "border-2",
                isCorrect && "border-success",
                isIncorrect && "border-muted grayscale",
                !isCorrect && !isIncorrect && "border-primary/30"
              )}
            />

            {/* Wrestler name */}
            <span className={cn(
              "text-sm font-semibold text-center truncate w-full",
              isIncorrect && "text-muted-foreground"
            )}>
              {pick}
            </span>

            {/* Player name */}
            <span className="text-xs text-primary font-medium truncate w-full text-center">
              {player.display_name.length > 12 
                ? player.display_name.slice(0, 12) + "…" 
                : player.display_name}
            </span>

            {/* Lock icon */}
            {!displayMatch.isComplete && (
              <Lock size={14} className="text-muted-foreground opacity-50" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
