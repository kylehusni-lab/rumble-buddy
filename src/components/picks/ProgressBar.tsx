import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentIndex: number;
  completionStatus: boolean[];
  onJumpToCard: (index: number) => void;
}

export function ProgressBar({ 
  currentIndex, 
  completionStatus, 
  onJumpToCard 
}: ProgressBarProps) {
  const completedCount = completionStatus.filter(Boolean).length;
  const totalCards = completionStatus.length;
  const progressPercent = (completedCount / totalCards) * 100;

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

      {/* Dot Indicators */}
      <div className="flex items-center justify-between">
        {completionStatus.map((isComplete, index) => (
          <button
            key={index}
            onClick={() => onJumpToCard(index)}
            className="relative group"
          >
            {/* Dot */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                index === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isComplete 
                  ? "bg-primary" 
                  : index === currentIndex 
                  ? "bg-secondary" 
                  : "bg-muted"
              )}
            >
              {isComplete ? (
                <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
              )}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Card {index + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
