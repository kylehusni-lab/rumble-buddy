import React, { forwardRef, memo } from "react";
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

export const MatchCard = memo(forwardRef<HTMLDivElement, MatchCardProps>(
  function MatchCard({ title, options, value, onChange, disabled }, ref) {
    return (
      <div ref={ref} className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 shadow-card border border-border min-h-[300px] md:min-h-[400px] flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Match Winner</div>
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-primary text-center mb-4 sm:mb-6 md:mb-8 font-semibold">
        +{SCORING.UNDERCARD_WINNER} pts if correct
      </div>

      {/* Wrestler Options - stacked layout for narrow container */}
      <div className="flex-1 flex flex-col gap-4 justify-center items-stretch relative">
        {options.map((wrestler, index) => (
          <React.Fragment key={wrestler}>
            <motion.button
              onClick={() => !disabled && onChange(wrestler)}
              disabled={disabled}
              className={cn(
                "relative p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl border-2 transition-all flex-1",
                "flex flex-row items-center gap-3 sm:gap-4",
                value === wrestler
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  : "border-border hover:border-muted-foreground",
                disabled && "opacity-60 cursor-not-allowed"
              )}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
            >
              {/* Wrestler Photo */}
              <div className={cn(
                "rounded-full bg-muted overflow-hidden flex-shrink-0 border-2",
                "w-14 h-14 sm:w-16 sm:h-16",
                value === wrestler ? "border-primary" : "border-border"
              )}>
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
                <div className={cn(
                  "font-bold text-foreground truncate",
                  "text-sm sm:text-lg"
                )}>
                  {wrestler}
                </div>
              </div>

              {/* Checkmark */}
              {value === wrestler && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground w-7 h-7 sm:w-8 sm:h-8"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
            
            {/* VS Divider */}
            {index === 0 && (
              <div className="flex items-center justify-center flex-shrink-0 py-1">
                <div className="relative">
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150" />
                  {/* VS badge */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/50 flex items-center justify-center">
                    <span className="text-sm sm:text-base font-black text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                      VS
                    </span>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
  }
));
