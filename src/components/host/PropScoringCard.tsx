import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PropScoringCardProps {
  propId: string;
  title: string;
  question: string;
  scoredResult: "YES" | "NO" | null;
  onScore: (propId: string, answer: "YES" | "NO") => Promise<void>;
  disabled?: boolean;
}

export function PropScoringCard({
  propId,
  title,
  question,
  scoredResult,
  onScore,
  disabled = false,
}: PropScoringCardProps) {
  const isScored = scoredResult !== null;

  const handleScore = async (answer: "YES" | "NO") => {
    if (isScored || disabled) return;
    await onScore(propId, answer);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-colors",
        isScored
          ? "bg-green-950/20 border-green-900"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold flex items-center gap-2">
            {title}
            {isScored && <Check className="text-green-500" size={16} />}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{question}</p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant={scoredResult === "YES" ? "gold" : "outline"}
            size="sm"
            className="min-h-[44px] min-w-[60px]"
            onClick={() => handleScore("YES")}
            disabled={isScored || disabled}
          >
            {scoredResult === "YES" && <Check size={14} className="mr-1" />}
            YES
          </Button>
          <Button
            variant={scoredResult === "NO" ? "gold" : "outline"}
            size="sm"
            className="min-h-[44px] min-w-[60px]"
            onClick={() => handleScore("NO")}
            disabled={isScored || disabled}
          >
            {scoredResult === "NO" && <Check size={14} className="mr-1" />}
            NO
          </Button>
        </div>
      </div>
    </div>
  );
}
