import { useState, useMemo } from "react";
import { Check, RefreshCw, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RumbleNumber {
  number: number;
  wrestler_name: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
  eliminated_by_number: number | null;
}

interface RumblePropScoringCardProps {
  propId: string;
  title: string;
  question: string;
  scoredResult: string | null;
  derivedValue: string | null;
  onScore: (propId: string, answer: string) => Promise<void>;
  onReset?: (propId: string) => Promise<void>;
  disabled?: boolean;
  type?: "wrestler" | "yesno";
  availableWrestlers?: string[];
}

export function RumblePropScoringCard({
  propId,
  title,
  question,
  scoredResult,
  derivedValue,
  onScore,
  onReset,
  disabled = false,
  type = "wrestler",
  availableWrestlers = [],
}: RumblePropScoringCardProps) {
  const isScored = scoredResult !== null;
  const [isOverriding, setIsOverriding] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const displayValue = scoredResult || derivedValue;
  const canDerive = derivedValue !== null;
  const matchesDerived = scoredResult === derivedValue;

  const handleAcceptDerived = async () => {
    if (!derivedValue || isScored || disabled) return;
    await onScore(propId, derivedValue);
  };

  const handleScoreYesNo = async (answer: "YES" | "NO") => {
    if (isScored || disabled) return;
    await onScore(propId, answer);
  };

  const handleOverrideSubmit = async () => {
    if (!customValue.trim() || disabled) return;
    await onScore(propId, customValue.trim());
    setIsOverriding(false);
    setCustomValue("");
  };

  const handleReset = async () => {
    if (!onReset || disabled) return;
    await onReset(propId);
  };

  // YES/NO type props
  if (type === "yesno") {
    return (
      <div
        className={cn(
          "p-4 rounded-xl border transition-colors",
          isScored ? "bg-green-950/20 border-green-900" : "bg-card border-border"
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
              onClick={() => handleScoreYesNo("YES")}
              disabled={isScored || disabled}
            >
              {scoredResult === "YES" && <Check size={14} className="mr-1" />}
              YES
            </Button>
            <Button
              variant={scoredResult === "NO" ? "gold" : "outline"}
              size="sm"
              className="min-h-[44px] min-w-[60px]"
              onClick={() => handleScoreYesNo("NO")}
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

  // Wrestler type props with auto-derivation
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-colors",
        isScored ? "bg-green-950/20 border-green-900" : "bg-card border-border"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center gap-2">
              {title}
              {isScored && <Check className="text-green-500" size={16} />}
            </h4>
            <p className="text-sm text-muted-foreground">{question}</p>
          </div>
          {isScored && onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleReset}
              disabled={disabled}
            >
              <RefreshCw size={14} />
            </Button>
          )}
        </div>

        {/* Derived value display */}
        {canDerive && !isScored && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Auto-detected:</p>
                <p className="font-semibold text-primary">{derivedValue}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  className="min-h-[40px]"
                  onClick={handleAcceptDerived}
                  disabled={disabled}
                >
                  <Check size={14} className="mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px]"
                  onClick={() => setIsOverriding(true)}
                  disabled={disabled}
                >
                  <Edit2 size={14} className="mr-1" />
                  Override
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scored result display */}
        {isScored && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Result:</p>
                <p className="font-bold text-success">{scoredResult}</p>
              </div>
              {!matchesDerived && derivedValue && (
                <p className="text-xs text-muted-foreground">
                  (Auto-detected: {derivedValue})
                </p>
              )}
            </div>
          </div>
        )}

        {/* No derived value yet */}
        {!canDerive && !isScored && !isOverriding && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground text-center">
              Not enough data yet. Wait for match progress or enter manually.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 min-h-[40px]"
              onClick={() => setIsOverriding(true)}
              disabled={disabled}
            >
              Enter Manually
            </Button>
          </div>
        )}

        {/* Override/manual entry form */}
        {isOverriding && !isScored && (
          <div className="space-y-2">
            <Input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Enter wrestler name..."
              className="min-h-[44px]"
              disabled={disabled}
            />
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="sm"
                className="flex-1 min-h-[44px]"
                onClick={handleOverrideSubmit}
                disabled={!customValue.trim() || disabled}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  setIsOverriding(false);
                  setCustomValue("");
                }}
                disabled={disabled}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
