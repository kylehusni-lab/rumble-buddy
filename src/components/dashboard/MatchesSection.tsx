import { motion } from "framer-motion";
import { Check, X, Crown, Trophy } from "lucide-react";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded: number | null;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface MatchesSectionProps {
  picks: Pick[];
  results: MatchResult[];
}

function PickRow({ 
  label, 
  prediction, 
  isCorrect, 
  points,
  isWinner = false,
}: { 
  label: string; 
  prediction: string; 
  isCorrect: boolean | null; 
  points: number;
  isWinner?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 flex items-center justify-between gap-3 pick-row-interactive",
      isWinner && "bg-winner/5 border-l-2 border-winner",
      isCorrect === true && "status-correct-glow bg-success/5",
      isCorrect === false && "bg-destructive/5"
    )}>
      <div className="min-w-0 flex-1">
        <div className={cn(
          "text-xs font-medium uppercase tracking-wide mb-0.5",
          isWinner ? "text-winner" : "text-muted-foreground"
        )}>
          {isWinner && <Crown size={10} className="inline mr-1 mb-0.5" />}
          {label}
        </div>
        <div className={cn(
          "font-semibold text-[15px] truncate",
          isCorrect === true && "text-success",
          isCorrect === false && "text-destructive/80 line-through",
          isWinner && isCorrect === null && "text-winner"
        )}>
          {prediction || <span className="text-muted-foreground italic">No pick</span>}
        </div>
      </div>
      
      {/* Result indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isCorrect === true && (
          <div className="flex items-center gap-1.5 point-badge px-2.5 py-1 rounded-full">
            <Check size={14} className="text-white" />
            <span className="text-white text-sm font-bold">+{points}</span>
          </div>
        )}
        {isCorrect === false && (
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            <X size={16} className="text-destructive" />
          </div>
        )}
        {isCorrect === null && (
          <div className="px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium">
            Pending
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchesSection({ picks, results }: MatchesSectionProps) {
  const getPickResult = (matchId: string): boolean | null => {
    const result = results.find(r => r.match_id === matchId);
    const pick = picks.find(p => p.match_id === matchId);
    if (!result || !pick) return null;
    return result.result === pick.prediction;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Undercard Matches */}
      <div className="card-gradient border border-border/80 rounded-2xl shadow-premium overflow-hidden">
        <div className="section-header ring-rope-texture">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy size={14} className="text-primary" />
            Undercard Matches
          </h3>
        </div>
        <div className="divide-y divide-border/50">
          {UNDERCARD_MATCHES.map((match) => {
            const pick = picks.find(p => p.match_id === match.id);
            return (
              <PickRow
                key={match.id}
                label={match.title}
                prediction={pick?.prediction || ""}
                isCorrect={getPickResult(match.id)}
                points={SCORING.UNDERCARD_WINNER}
              />
            );
          })}
        </div>
      </div>

      {/* Rumble Winners - Winner Theme */}
      <div className="card-gradient-winner border border-winner/30 rounded-2xl shadow-premium overflow-hidden">
        <div className="section-header border-winner/20 flex items-center gap-2">
          <Crown size={14} className="text-winner" />
          <h3 className="text-sm font-bold text-winner uppercase tracking-wide">Rumble Winners</h3>
        </div>
        <div className="divide-y divide-winner/20">
          {["mens_rumble_winner", "womens_rumble_winner"].map((matchId) => {
            const pick = picks.find(p => p.match_id === matchId);
            const label = matchId === "mens_rumble_winner" ? "🧔 Men's Winner" : "👩 Women's Winner";
            return (
              <PickRow
                key={matchId}
                label={label}
                prediction={pick?.prediction || ""}
                isCorrect={getPickResult(matchId)}
                points={SCORING.RUMBLE_WINNER_PICK}
                isWinner
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
