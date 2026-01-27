import { motion } from "framer-motion";
import { Check, X, Crown } from "lucide-react";
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
      "p-3 flex items-center justify-between",
      isWinner && "bg-winner/5"
    )}>
      <div className="min-w-0 flex-1">
        <div className={cn(
          "text-sm",
          isWinner ? "text-winner" : "text-muted-foreground"
        )}>
          {isWinner && <Crown size={12} className="inline mr-1 mb-0.5" />}
          {label}
        </div>
        <div className={cn(
          "font-medium truncate",
          isWinner && "text-winner"
        )}>
          {prediction || "No pick"}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {isCorrect === true && (
          <>
            <Check size={18} className="text-success" />
            <span className="text-success text-sm font-medium">+{points}</span>
          </>
        )}
        {isCorrect === false && <X size={18} className="text-destructive" />}
        {isCorrect === null && <span className="text-xs text-muted-foreground">pending</span>}
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
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="px-3 py-2 bg-muted/50 rounded-t-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Undercard Matches</h3>
        </div>
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

      {/* Rumble Winners - Winner Theme */}
      <div className="bg-card border border-winner/30 rounded-xl divide-y divide-winner/20 overflow-hidden">
        <div className="px-3 py-2 bg-winner/10 rounded-t-xl flex items-center gap-2">
          <Crown size={14} className="text-winner" />
          <h3 className="text-xs font-semibold text-winner uppercase tracking-wide">Rumble Winners</h3>
        </div>
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
    </motion.div>
  );
}
