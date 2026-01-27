import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ChevronDown, Zap, Target } from "lucide-react";
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
    <div className={cn(
      "p-4 flex items-center justify-between gap-3 pick-row-interactive",
      isCorrect === true && "status-correct-glow bg-success/5",
      isCorrect === false && "bg-destructive/5"
    )}>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide mb-0.5 text-muted-foreground">
          {label}
        </div>
        <div className={cn(
          "font-semibold text-[15px] truncate",
          isCorrect === true && "text-success",
          isCorrect === false && "text-destructive/80 line-through"
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
      <div className="card-gradient border border-border/80 rounded-2xl shadow-premium overflow-hidden">
        <div className="section-header ring-rope-texture">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Target size={14} className="text-primary" />
            {emoji} {title} Rumble Props
          </h3>
        </div>
        <div className="divide-y divide-border/50">
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
      </div>

      {/* Final Four */}
      <div className="card-gradient-purple border border-secondary/30 rounded-2xl shadow-premium overflow-hidden">
        <div className="section-header border-secondary/20">
          <h3 className="text-sm font-bold text-secondary-foreground flex items-center gap-2">
            <span className="text-base">🏅</span>
            {emoji} Final Four Predictions
          </h3>
        </div>
        <div className="divide-y divide-secondary/20">
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
      </div>

      {/* Chaos Props - Collapsible */}
      <Collapsible open={chaosOpen} onOpenChange={setChaosOpen}>
        <div className="card-gradient-gold border border-primary/30 rounded-2xl shadow-premium overflow-hidden">
          <CollapsibleTrigger className="w-full section-header border-primary/20 flex items-center justify-between hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {emoji} Chaos Props
              </h3>
              {chaosStats.correct > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-white point-badge px-1.5 py-0.5 rounded-full">
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
            <div className="divide-y divide-primary/20">
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
