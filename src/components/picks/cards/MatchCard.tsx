import { motion } from "framer-motion";
import { Trophy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { SCORING } from "@/lib/constants";

interface MatchCardProps {
  title: string;
  options: readonly [string, string] | string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MatchCard({ title, options, value, onChange, disabled }: MatchCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border min-h-[400px] sm:min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Match Winner</div>
          <h2 className="text-base sm:text-xl font-bold text-foreground truncate">{title}</h2>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
        +{SCORING.UNDERCARD_WINNER} pts if correct
      </div>

      {/* Wrestler Options */}
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {options.map((wrestler) => (
            <motion.button
              key={wrestler}
              onClick={() => !disabled && onChange(wrestler)}
              disabled={disabled}
              className={cn(
                "relative p-3 sm:p-4 rounded-xl border-2 transition-all",
                "flex items-center gap-3 sm:gap-4",
                value === wrestler
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground",
                disabled && "opacity-60 cursor-not-allowed"
              )}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
            >
              {/* Wrestler Photo */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-border">
                <img
                  src={getWrestlerImageUrl(wrestler)}
                  alt={wrestler}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.src = getPlaceholderImageUrl(wrestler);
                  }}
                />
              </div>

              {/* Wrestler Name */}
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm sm:text-lg font-bold text-foreground truncate">{wrestler}</div>
              </div>

              {/* Checkmark */}
              {value === wrestler && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
  );
}
