import { memo } from "react";
import { Check, X, Plus, Pencil, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { getEntrantDisplayName } from "@/lib/entrant-utils";
import { useEventConfig } from "@/contexts/EventContext";
import type { CardConfig, ScoringConfig } from "@/lib/events/types";
interface Pick {
  match_id: string;
  prediction: string;
  points_awarded?: number | null;
}

interface Result {
  match_id: string;
  result: string;
}

interface UnifiedMatchesTabProps {
  picks: Pick[] | Record<string, string>;
  results: Result[] | Record<string, string>;
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
  // Optional overrides for when not using context
  cardConfig?: CardConfig[];
  scoring?: ScoringConfig;
  isRumble?: boolean;
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

const MatchRow = memo(function MatchRow({ 
  id, 
  label, 
  pick, 
  result, 
  points,
  onEdit,
  canEdit = false,
}: {
  id: string;
  label: string;
  pick: string | undefined;
  result: string | undefined;
  points: number;
  onEdit?: () => void;
  canEdit?: boolean;
}) {
  const isCorrect = pick && result && pick === result;
  const isWrong = pick && result && pick !== result;

  return (
    <button
      onClick={() => {
        if (canEdit && !result) {
          onEdit?.();
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
      {/* Wrestler Avatar */}
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
      
      {/* Title and name stacked */}
      <div className="flex-1 min-w-0 text-left">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className={cn(
          "font-semibold text-foreground truncate",
          isWrong && "line-through text-destructive/80"
        )}>
          {pick ? getEntrantDisplayName(pick) : `+${points} pts`}
        </div>
        {result && !isCorrect && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Winner: {result}
          </div>
        )}
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
});

export const UnifiedMatchesTab = memo(function UnifiedMatchesTab({ 
  picks, 
  results,
  onEditPick,
  canEdit = false,
  cardConfig: propCardConfig,
  scoring: propScoring,
  isRumble: propIsRumble,
}: UnifiedMatchesTabProps) {
  // Use context if available, otherwise use props
  const eventContext = useEventConfig();
  const cardConfig = propCardConfig || eventContext.CARD_CONFIG;
  const scoring = propScoring || eventContext.SCORING;
  const isRumble = propIsRumble ?? eventContext.isRumble;

  const normalizedPicks = normalizePicks(picks);
  const normalizedResults = normalizeResults(results);
  
  const matchCards = cardConfig.filter(c => c.type === "match");

  return (
    <div className="space-y-3">
      {matchCards.map((card) => (
        <MatchRow
          key={card.id}
          id={card.id}
          label={card.title}
          pick={normalizedPicks[card.id]}
          result={normalizedResults[card.id]}
          points={scoring.UNDERCARD_WINNER}
          canEdit={canEdit}
          onEdit={() => onEditPick?.(card.id, normalizedPicks[card.id] || "")}
        />
      ))}
      {/* Only show Rumble winners for Rumble events */}
      {isRumble && ["mens_rumble_winner", "womens_rumble_winner"].map((id) => (
        <MatchRow
          key={id}
          id={id}
          label={id === "mens_rumble_winner" ? "Men's Rumble Winner" : "Women's Rumble Winner"}
          pick={normalizedPicks[id]}
          result={normalizedResults[id]}
          points={scoring.RUMBLE_WINNER_PICK || 25}
          canEdit={canEdit}
          onEdit={() => onEditPick?.(id, normalizedPicks[id] || "")}
        />
      ))}
    </div>
  );
});
