import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ChevronDown, Zap } from "lucide-react";
import { RUMBLE_PROPS, SCORING, FINAL_FOUR_SLOTS, CHAOS_PROPS } from "@/lib/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [chaosOpen, setChaosOpen] = useState(true);
  
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

  // Chaos props for this gender
  const chaosPicksData = CHAOS_PROPS.map((prop, index) => {
    const matchId = `${prefix}_chaos_prop_${index + 1}`;
    const pick = picks.find(p => p.match_id === matchId);
    return {
      prop,
      matchId,
      pick,
    };
  });

  // Count chaos props correct/pending
  const chaosStats = chaosPicksData.reduce(
    (acc, { matchId, pick }) => {
      if (!pick) return acc;
      const result = results.find(r => r.match_id === matchId);
      if (!result) {
        acc.pending++;
      } else if (result.result === pick.prediction) {
        acc.correct++;
      }
      return acc;
    },
    { correct: 0, pending: 0 }
  );

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

      {/* Chaos Props - Collapsible */}
      <Collapsible open={chaosOpen} onOpenChange={setChaosOpen}>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <CollapsibleTrigger className="w-full px-3 py-2 bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {emoji} Chaos Props
              </h3>
              {chaosStats.correct > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded-full">
                  <Check size={10} />
                  {chaosStats.correct}
                </span>
              )}
              {chaosStats.correct === 0 && chaosStats.pending > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {chaosStats.pending} pending
                </span>
              )}
            </div>
            <ChevronDown 
              size={16} 
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                chaosOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y divide-border">
              {chaosPicksData.map(({ prop, matchId, pick }) => (
                <PickRow
                  key={matchId}
                  label={prop.shortName}
                  prediction={pick?.prediction || ""}
                  isCorrect={getPickResult(matchId)}
                  points={SCORING.PROP_BET}
                />
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
