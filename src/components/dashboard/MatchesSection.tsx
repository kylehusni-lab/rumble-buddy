import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";

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
  points 
}: { 
  label: string; 
  prediction: string; 
  isCorrect: boolean | null; 
  points: number;
}) {
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{prediction || "No pick"}</div>
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

      {/* Rumble Winners */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="px-3 py-2 bg-muted/50 rounded-t-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rumble Winners</h3>
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
            />
          );
        })}
      </div>
    </motion.div>
  );
}
