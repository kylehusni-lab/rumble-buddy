import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { CHAOS_PROPS, SCORING } from "@/lib/constants";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded: number | null;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface ChaosPropsSectionProps {
  picks: Pick[];
  results: MatchResult[];
}

export function ChaosPropsSection({ picks, results }: ChaosPropsSectionProps) {
  const getPickResult = (matchId: string): boolean | null => {
    const result = results.find(r => r.match_id === matchId);
    const pick = picks.find(p => p.match_id === matchId);
    if (!result || !pick) return null;
    return result.result === pick.prediction;
  };

  const getPick = (matchId: string): string => {
    const pick = picks.find(p => p.match_id === matchId);
    return pick?.prediction || "";
  };

  const renderCell = (matchId: string) => {
    const prediction = getPick(matchId);
    const isCorrect = getPickResult(matchId);
    
    return (
      <div className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded ${
        isCorrect === true
          ? "bg-success/10"
          : isCorrect === false
          ? "bg-destructive/10"
          : ""
      }`}>
        <span className={`text-sm font-bold ${
          prediction === "YES" ? "text-success" : prediction === "NO" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {prediction || "—"}
        </span>
        {isCorrect === true && (
          <>
            <Check size={14} className="text-success" />
            <span className="text-success text-xs font-medium">+{SCORING.PROP_BET}</span>
          </>
        )}
        {isCorrect === false && <X size={14} className="text-destructive" />}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Chaos Prop
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                🧔 Men's
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                👩 Women's
              </th>
            </tr>
          </thead>
          <tbody>
            {CHAOS_PROPS.map((prop, index) => {
              const mensMatchId = `mens_chaos_prop_${index + 1}`;
              const womensMatchId = `womens_chaos_prop_${index + 1}`;
              
              return (
                <tr key={prop.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-medium text-foreground">
                      {prop.shortName}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {renderCell(mensMatchId)}
                  </td>
                  <td className="px-2 py-2">
                    {renderCell(womensMatchId)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
