import { useState } from "react";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MatchScoringCardProps {
  matchId: string;
  title: string;
  options: readonly string[];
  scoredResult: string | null;
  onScore: (matchId: string, winner: string) => Promise<void>;
  onReset?: (matchId: string) => Promise<void>;
}

export function MatchScoringCard({
  matchId,
  title,
  options,
  scoredResult,
  onScore,
  onReset,
}: MatchScoringCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isScored = !!scoredResult;

  const handleConfirm = async () => {
    if (!selectedWinner) return;
    
    setIsSubmitting(true);
    try {
      await onScore(matchId, selectedWinner);
      setSelectedWinner(null);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    
    setIsSubmitting(true);
    try {
      await onReset(matchId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-colors",
            isScored
              ? "bg-green-950/20 border-green-900"
              : "bg-card border-border hover:border-primary/50"
          )}
        >
          <div className="text-left">
            <span className="font-semibold">{title}</span>
            {isScored && (
              <p className="text-sm text-green-400 mt-1">
                Winner: {scoredResult}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isScored ? (
              <Check className="text-green-500" size={20} />
            ) : (
              <span className="text-xs text-muted-foreground">Not scored</span>
            )}
            <ChevronDown
              className={cn(
                "text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
              size={20}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-card/50 border-x border-b border-border rounded-b-xl -mt-2"
            >
              {!isScored ? (
                <>
                  <div className="flex gap-2 mb-3">
                    {options.map((option) => (
                      <Button
                        key={option}
                        variant={selectedWinner === option ? "gold" : "outline"}
                        className="flex-1 min-h-[48px]"
                        onClick={() => setSelectedWinner(option)}
                        disabled={isSubmitting}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedWinner && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Button
                          variant="gold"
                          className="w-full min-h-[48px]"
                          onClick={handleConfirm}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Scoring..." : `Confirm ${selectedWinner} Wins`}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] gap-2"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  <RotateCcw size={16} />
                  Reset Result
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
