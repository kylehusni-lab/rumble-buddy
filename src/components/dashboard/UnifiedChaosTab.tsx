import { memo, useState } from "react";
import { Check, X, Pencil, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAOS_PROPS, SCORING } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded?: number | null;
}

interface Result {
  match_id: string;
  result: string;
}

interface UnifiedChaosTabProps {
  picks: Pick[] | Record<string, string>;
  results: Result[] | Record<string, string>;
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
}

// Normalize picks to Record format
function normalizePicks(picks: Pick[] | Record<string, string>): Record<string, string> {
  if (Array.isArray(picks)) {
    return picks.reduce((acc, p) => ({ ...acc, [p.match_id]: p.prediction }), {} as Record<string, string>);
  }
  return picks;
}

// Normalize results to Record format  
function normalizeResults(results: Result[] | Record<string, string>): Record<string, string> {
  if (Array.isArray(results)) {
    return results.reduce((acc, r) => ({ ...acc, [r.match_id]: r.result }), {} as Record<string, string>);
  }
  return results;
}

export const UnifiedChaosTab = memo(function UnifiedChaosTab({
  picks, 
  results,
  onEditPick,
  canEdit = false,
}: UnifiedChaosTabProps) {
  const normalizedPicks = normalizePicks(picks);
  const normalizedResults = normalizeResults(results);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);

  const getPickResult = (matchId: string): boolean | null => {
    const pick = normalizedPicks[matchId];
    const result = normalizedResults[matchId];
    if (!pick || !result) return null;
    return pick === result;
  };

  const renderCell = (matchId: string) => {
    const pick = normalizedPicks[matchId];
    const result = normalizedResults[matchId];
    const isCorrect = getPickResult(matchId);
    
    return (
      <button
        onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
        disabled={!canEdit || !!result}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded min-h-[44px]",
          canEdit && !result && "hover:bg-muted/50 transition-colors",
          isCorrect === true
            ? "bg-success/10"
            : isCorrect === false
            ? "bg-destructive/10"
            : ""
        )}
      >
        <span className={cn(
          "text-sm font-bold",
          pick === "YES" ? "text-success" : pick === "NO" ? "text-destructive" : "text-muted-foreground"
        )}>
          {pick || "-"}
        </span>
        {isCorrect === true && <Check size={14} className="text-success" />}
        {isCorrect === false && <X size={14} className="text-destructive" />}
        {canEdit && !result && pick && (
          <Pencil size={12} className="text-muted-foreground ml-1" />
        )}
      </button>
    );
  };

  const toggleExpand = (propId: string) => {
    setExpandedProp(expandedProp === propId ? null : propId);
  };

  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Chaos Prop
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 md:w-24">
                Men's
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 md:w-24">
                Women's
              </th>
            </tr>
          </thead>
          <tbody>
            {CHAOS_PROPS.map((prop, index) => {
              const mensMatchId = `mens_chaos_prop_${index + 1}`;
              const womensMatchId = `womens_chaos_prop_${index + 1}`;
              const isExpanded = expandedProp === prop.id;
              
              return (
                <tr key={prop.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2.5">
                    {/* Desktop: Show title + subtitle */}
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-foreground">
                        {prop.title}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {prop.question}
                      </div>
                    </div>
                    
                    {/* Mobile: Show title with info icon tooltip */}
                    <div className="md:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {prop.shortName}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => toggleExpand(prop.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            >
                              <Info size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px]">
                            <p className="text-xs">{prop.question}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Expanded explanation on mobile tap */}
                      {isExpanded && (
                        <div className="text-xs text-muted-foreground mt-1 leading-tight">
                          {prop.question}
                        </div>
                      )}
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
    </TooltipProvider>
  );
});
