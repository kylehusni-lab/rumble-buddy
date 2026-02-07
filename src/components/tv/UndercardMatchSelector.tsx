import { Check, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventConfig } from "@/contexts/EventContext";
import type { MatchConfig } from "@/lib/events/types";

interface UndercardMatchSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  matchResults: { match_id: string; result: string }[];
  // Optional override for when not using context
  matches?: MatchConfig[];
}

export function UndercardMatchSelector({
  selectedIndex,
  onSelect,
  matchResults,
  matches: propMatches,
}: UndercardMatchSelectorProps) {
  // Use context if available, otherwise use props
  const eventContext = useEventConfig();
  const matches = propMatches || eventContext.UNDERCARD_MATCHES;

  const isMatchComplete = (matchId: string) => {
    return matchResults.some(r => r.match_id === matchId);
  };

  return (
    <div className="undercard-selector">
      {matches.map((match, index) => {
        const isSelected = index === selectedIndex;
        const isComplete = isMatchComplete(match.id);

        return (
          <button
            key={match.id}
            onClick={() => onSelect(index)}
            className={cn(
              "undercard-match-btn",
              isSelected && "undercard-match-active",
              isComplete && !isSelected && "undercard-match-complete"
            )}
          >
            {/* Match indicator */}
            <div className="relative">
              <Swords className="w-5 h-5" />
              {isComplete && (
                <Check className="absolute -top-1 -right-1 w-3.5 h-3.5 text-success bg-background rounded-full p-0.5" />
              )}
            </div>

            {/* Match title */}
            <span className="font-semibold">{match.title}</span>
          </button>
        );
      })}
    </div>
  );
}
