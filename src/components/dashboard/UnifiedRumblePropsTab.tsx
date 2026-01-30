import { memo } from "react";
import { Check, X, Plus, Pencil, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { getEntrantDisplayName } from "@/lib/entrant-utils";
import { RUMBLE_PROPS, FINAL_FOUR_SLOTS, SCORING } from "@/lib/constants";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded?: number | null;
}

interface Result {
  match_id: string;
  result: string;
}

interface UnifiedRumblePropsTabProps {
  gender: "mens" | "womens";
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

// Map prop IDs to display info
const propPoints: Record<string, number> = {
  entrant_1: SCORING.ENTRANT_GUESS,
  entrant_30: SCORING.ENTRANT_GUESS,
  first_elimination: SCORING.FIRST_ELIMINATION,
  most_eliminations: SCORING.MOST_ELIMINATIONS,
  longest_time: SCORING.LONGEST_TIME,
};

export const UnifiedRumblePropsTab = memo(function UnifiedRumblePropsTab({
  gender,
  picks,
  results,
  onEditPick,
  canEdit = false,
}: UnifiedRumblePropsTabProps) {
  const normalizedPicks = normalizePicks(picks);
  const normalizedResults = normalizeResults(results);

  return (
    <div className="space-y-3">
      {/* Universal list layout - consistent across all viewports */}
      <div className="space-y-2">
          {RUMBLE_PROPS.map((prop) => {
            const matchId = `${gender}_${prop.id}`;
            const pick = normalizedPicks[matchId];
            const result = normalizedResults[matchId];
            const isCorrect = pick && result && pick === result;
            const isWrong = pick && result && pick !== result;
            const points = propPoints[prop.id] || SCORING.PROP_BET;

            return (
              <button
                key={matchId}
                onClick={() => {
                  if (canEdit && !result) {
                    onEditPick?.(matchId, pick || "");
                  }
                }}
                className={cn(
                  "w-full min-h-[64px] p-3 rounded-xl border flex items-center gap-4",
                  "transition-all active:scale-[0.98]",
                  isCorrect ? "bg-success/10 border-success" :
                  isWrong ? "bg-destructive/10 border-destructive" :
                  "bg-card border-border",
                  canEdit && !result && "hover:border-primary/50 cursor-pointer"
                )}
              >
                {/* Large avatar on left */}
                <div className="relative flex-shrink-0">
                  {pick ? (
                    <>
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                        className={cn(
                          "w-[72px] h-[72px] rounded-full object-cover border-2 image-crisp",
                          isCorrect ? "border-success" :
                          isWrong ? "border-destructive" : 
                          "border-primary"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                      {isCorrect && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center animate-pulse">
                      <Plus className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                
                {/* Title and name stacked on right */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {prop.title}
                  </div>
                  <div className={cn(
                    "font-semibold truncate",
                    pick ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {pick ? getEntrantDisplayName(pick) : `+${points} pts`}
                  </div>
                </div>
                
                {/* Right side - edit indicator or points */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {isCorrect && (
                    <span className="text-xs font-bold text-success bg-success/20 px-2 py-1 rounded">
                      +{points}
                    </span>
                  )}
                  {canEdit && !result && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Pencil size={14} />
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      {/* Final Four Section */}
      <div className="mt-6 p-4 rounded-xl border border-primary/50 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Final Four</span>
          </div>
          <span className="text-xs text-primary">+{SCORING.FINAL_FOUR_PICK} pts each</span>
        </div>
        
        {/* 4-column grid for photos */}
        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, i) => {
            const matchId = `${gender}_final_four_${i + 1}`;
            const pick = normalizedPicks[matchId];
            
            // Check if this pick is correct (any of the Final Four results)
            const finalFourResults = Array.from({ length: 4 }).map((_, j) => 
              normalizedResults[`${gender}_final_four_${j + 1}`]
            ).filter(Boolean);
            const isCorrect = pick && finalFourResults.includes(pick);
            const isWrong = pick && finalFourResults.length > 0 && !finalFourResults.includes(pick);

            return (
              <div key={matchId} className="flex flex-col items-center">
                <button
                  onClick={() => canEdit && !finalFourResults.length && onEditPick?.(matchId, pick || "")}
                  disabled={!canEdit || !!finalFourResults.length}
                  className="relative"
                >
                  {pick ? (
                    <>
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                      className={cn(
                          "w-[72px] h-[72px] rounded-full object-cover border-2",
                          isCorrect 
                            ? "border-success" 
                            : isWrong 
                              ? "border-destructive" 
                              : "border-primary"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                      {isCorrect && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      )}
                      {canEdit && !finalFourResults.length && (
                        <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/30 flex items-center justify-center transition-colors">
                          <Pencil size={16} className="text-white opacity-0 hover:opacity-100" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={cn(
                      "w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center",
                      canEdit && "hover:border-primary/50"
                    )}>
                      <Plus className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-muted-foreground">
            {Array.from({ length: FINAL_FOUR_SLOTS }).filter((_, i) => normalizedPicks[`${gender}_final_four_${i + 1}`]).length}/4 picked
          </span>
        </div>
      </div>
    </div>
  );
});
