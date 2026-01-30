import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  CARD_CONFIG, 
  RUMBLE_PROPS, 
  CHAOS_PROPS, 
  SCORING,
  FINAL_FOUR_SLOTS,
} from "@/lib/constants";

interface TvSoloScoreDisplayProps {
  displayName: string;
  score: number;
  picks: Record<string, string>;
  results: Record<string, string>;
}

interface ScoreBreakdownItem {
  label: string;
  pick: string;
  result: string | null;
  points: number;
  correct: boolean | null;
}

export const TvSoloScoreDisplay = memo(function TvSoloScoreDisplay({
  displayName,
  score,
  picks,
  results,
}: TvSoloScoreDisplayProps) {
  // Build score breakdown
  const breakdown: ScoreBreakdownItem[] = [];

  // Undercard matches
  CARD_CONFIG.filter(c => c.type === "match").forEach(match => {
    const pick = picks[match.id];
    const result = results[match.id];
    if (pick) {
      const correct = result ? pick === result : null;
      breakdown.push({
        label: match.title,
        pick,
        result,
        points: correct ? SCORING.UNDERCARD_WINNER : 0,
        correct,
      });
    }
  });

  // Rumble winners
  ["mens", "womens"].forEach(gender => {
    const matchId = `${gender}_rumble_winner`;
    const pick = picks[matchId];
    const result = results[matchId];
    if (pick) {
      const correct = result ? pick === result : null;
      breakdown.push({
        label: `${gender === "mens" ? "Men's" : "Women's"} Winner`,
        pick,
        result,
        points: correct ? SCORING.RUMBLE_WINNER_PICK : 0,
        correct,
      });
    }
  });

  // Rumble props
  ["mens", "womens"].forEach(gender => {
    RUMBLE_PROPS.forEach(prop => {
      const matchId = `${gender}_${prop.id}`;
      const pick = picks[matchId];
      const result = results[matchId];
      if (pick) {
        const correct = result ? pick === result : null;
        breakdown.push({
          label: `${gender === "mens" ? "Men's" : "Women's"} ${prop.title}`,
          pick,
          result,
          points: correct ? SCORING.PROP_BET : 0,
          correct,
        });
      }
    });

    // Final Four
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      const matchId = `${gender}_final_four_${i}`;
      const pick = picks[matchId];
      // Final four uses special result format
      const resultKey = `${gender}_final_four`;
      const result = results[resultKey];
      if (pick) {
        const correct = result ? result.includes(pick) : null;
        breakdown.push({
          label: `${gender === "mens" ? "Men's" : "Women's"} Final Four #${i}`,
          pick,
          result: result || null,
          points: correct ? SCORING.FINAL_FOUR : 0,
          correct,
        });
      }
    }
  });

  // Chaos props
  ["mens", "womens"].forEach(gender => {
    CHAOS_PROPS.forEach((prop, i) => {
      const matchId = `${gender}_chaos_prop_${i + 1}`;
      const pick = picks[matchId];
      const result = results[matchId];
      if (pick) {
        const correct = result ? pick === result : null;
        breakdown.push({
          label: `${gender === "mens" ? "Men's" : "Women's"} ${prop.shortName}`,
          pick,
          result,
          points: correct ? SCORING.PROP_BET : 0,
          correct,
        });
      }
    });
  });

  const correctCount = breakdown.filter(b => b.correct === true).length;
  const scoredCount = breakdown.filter(b => b.correct !== null).length;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Main Score Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="text-muted-foreground text-lg mb-2">
          {displayName}'s Score
        </div>
        <div className="relative">
          <motion.div
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-8xl font-black text-primary tabular-nums"
          >
            {score}
          </motion.div>
          <div className="text-2xl text-muted-foreground font-medium mt-2">
            points
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="flex gap-8 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-success mb-1">
            <Check className="w-5 h-5" />
            <span className="text-3xl font-bold">{correctCount}</span>
          </div>
          <div className="text-sm text-muted-foreground">Correct</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-3xl font-bold">{scoredCount}</span>
          </div>
          <div className="text-sm text-muted-foreground">Scored</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-3xl font-bold">{breakdown.length}</span>
          </div>
          <div className="text-sm text-muted-foreground">Total Picks</div>
        </div>
      </div>

      {/* Score Breakdown Table */}
      {scoredCount > 0 && (
        <div className="w-full max-w-2xl bg-card/50 border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Scoring Breakdown</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-sm text-muted-foreground">Category</th>
                  <th className="p-3 text-left text-sm text-muted-foreground">Your Pick</th>
                  <th className="p-3 text-left text-sm text-muted-foreground">Result</th>
                  <th className="p-3 text-right text-sm text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.filter(b => b.correct !== null).map((item, i) => (
                  <tr 
                    key={i} 
                    className={cn(
                      "border-b border-border/30",
                      item.correct ? "bg-success/10" : "bg-destructive/10"
                    )}
                  >
                    <td className="p-3 text-sm font-medium">{item.label}</td>
                    <td className="p-3 text-sm text-muted-foreground">{item.pick}</td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {item.correct ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                        <span>{item.result}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-right font-bold">
                      {item.points > 0 ? (
                        <span className="text-success">+{item.points}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
