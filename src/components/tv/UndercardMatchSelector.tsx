import { Check, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNDERCARD_MATCHES } from "@/lib/constants";

interface UndercardMatchSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  matchResults: { match_id: string; result: string }[];
}

export function UndercardMatchSelector({
  selectedIndex,
  onSelect,
  matchResults,
}: UndercardMatchSelectorProps) {
  const isMatchComplete = (matchId: string) => {
    return matchResults.some(r => r.match_id === matchId);
  };

  return (
    <div className="undercard-selector">
      {UNDERCARD_MATCHES.map((match, index) => {
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
