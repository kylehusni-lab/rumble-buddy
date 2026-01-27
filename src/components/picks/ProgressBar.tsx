import { motion } from "framer-motion";
import { Check, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentIndex: number;
  completionStatus: boolean[];
  onJumpToCard: (index: number) => void;
}

// Card groups for the progress bar
const CARD_GROUPS = [
  { name: "Undercard", range: [0, 2], icon: Trophy },
  { name: "Men's", range: [3, 5], icon: User },
  { name: "Women's", range: [6, 8], icon: User },
] as const;

export function ProgressBar({ 
  currentIndex, 
  completionStatus, 
  onJumpToCard 
}: ProgressBarProps) {
  const completedCount = completionStatus.filter(Boolean).length;
  const totalCards = completionStatus.length;
  const progressPercent = (completedCount / totalCards) * 100;

  const getGroupCompletion = (start: number, end: number) => {
    const groupCards = completionStatus.slice(start, end + 1);
    const completed = groupCards.filter(Boolean).length;
    return { completed, total: groupCards.length };
  };

  const isGroupActive = (start: number, end: number) => {
    return currentIndex >= start && currentIndex <= end;
  };

  return (
    <div className="bg-card border-b border-border p-4 space-y-3">
      {/* Progress Text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pick Progress</span>
        <span className="text-primary font-bold">
          {completedCount}/{totalCards} complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Grouped Sections */}
      <div className="flex items-stretch gap-2">
        {CARD_GROUPS.map((group) => {
          const [start, end] = group.range;
          const { completed, total } = getGroupCompletion(start, end);
          const isActive = isGroupActive(start, end);
          const isComplete = completed === total;
          const Icon = group.icon;

          return (
            <div
              key={group.name}
              className={cn(
                "flex-1 rounded-lg border p-2 transition-all",
                isActive 
                  ? "border-primary bg-primary/10" 
                  : isComplete 
                  ? "border-success/50 bg-success/5"
                  : "border-border bg-muted/30"
              )}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={cn(
                    isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"
                  )}>
                    {group.name}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold",
                  isComplete ? "text-success" : "text-muted-foreground"
                )}>
                  {completed}/{total}
                </span>
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const cardIndex = start + i;
                  const isCardComplete = completionStatus[cardIndex];
                  const isCardCurrent = cardIndex === currentIndex;

                  return (
                    <button
                      key={cardIndex}
                      onClick={() => onJumpToCard(cardIndex)}
                      className="relative group"
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          isCardCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          isCardComplete 
                            ? "bg-success" 
                            : isCardCurrent 
                            ? "bg-primary" 
                            : "bg-muted"
                        )}
                      >
                        {isCardComplete ? (
                          <Check className="w-3 h-3 text-success-foreground" strokeWidth={3} />
                        ) : (
                          <span className={cn(
                            "text-[10px] font-bold",
                            isCardCurrent ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {cardIndex + 1}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
