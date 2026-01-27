import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { RUMBLE_PROPS, SCORING, FINAL_FOUR_SLOTS } from "@/lib/constants";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded: number | null;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface RumblePropsSectionProps {
  picks: Pick[];
  results: MatchResult[];
  gender: "mens" | "womens";
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

export function RumblePropsSection({ picks, results, gender }: RumblePropsSectionProps) {
  const prefix = gender;
  const emoji = gender === "mens" ? "🧔" : "👩";
  const title = gender === "mens" ? "Men's" : "Women's";

  const getPickResult = (matchId: string): boolean | null => {
    const result = results.find(r => r.match_id === matchId);
    const pick = picks.find(p => p.match_id === matchId);
    if (!result || !pick) return null;
    return result.result === pick.prediction;
  };

  const getPropScore = (propId: string): number => {
    switch (propId) {
      case "first_elimination":
        return SCORING.FIRST_ELIMINATION;
      case "most_eliminations":
        return SCORING.MOST_ELIMINATIONS;
      case "longest_time":
        return SCORING.LONGEST_TIME;
      case "entrant_1":
      case "entrant_30":
        return SCORING.ENTRANT_GUESS;
      case "no_show":
        return SCORING.NO_SHOW_PROP;
      default:
        return 10;
    }
  };

  // Main props (excluding Final Four)
  const mainProps = RUMBLE_PROPS.filter(p => !p.id.includes("final_four"));

  // Final Four picks
  const finalFourPicks = Array.from({ length: FINAL_FOUR_SLOTS }, (_, i) => {
    const matchId = `${prefix}_final_four_${i + 1}`;
    return picks.find(p => p.match_id === matchId);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Props */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="px-3 py-2 bg-muted/50 rounded-t-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {emoji} {title} Rumble Props
          </h3>
        </div>
        {mainProps.map((prop) => {
          const matchId = `${prefix}_${prop.id}`;
          const pick = picks.find(p => p.match_id === matchId);
          return (
            <PickRow
              key={matchId}
              label={prop.title}
              prediction={pick?.prediction || ""}
              isCorrect={getPickResult(matchId)}
              points={getPropScore(prop.id)}
            />
          );
        })}
      </div>

      {/* Final Four */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="px-3 py-2 bg-muted/50 rounded-t-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {emoji} Final Four Predictions
          </h3>
        </div>
        {finalFourPicks.map((pick, i) => {
          const matchId = `${prefix}_final_four_${i + 1}`;
          return (
            <PickRow
              key={matchId}
              label={`Final Four #${i + 1}`}
              prediction={pick?.prediction || ""}
              isCorrect={getPickResult(matchId)}
              points={SCORING.FINAL_FOUR_PICK}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
