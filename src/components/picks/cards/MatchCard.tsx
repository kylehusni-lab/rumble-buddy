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
    <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 shadow-card border border-border min-h-[300px] md:min-h-[400px] flex flex-col">
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

      {/* Wrestler Options - stacked on mobile, side-by-side on desktop */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-10 justify-center items-stretch md:items-center md:px-4 lg:px-12">
        {options.map((wrestler, index) => (
          <motion.button
            key={wrestler}
            onClick={() => !disabled && onChange(wrestler)}
            disabled={disabled}
            className={cn(
              "relative p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl border-2 transition-all flex-1",
              "flex flex-row md:flex-col items-center gap-3 sm:gap-4 md:gap-4",
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
              "w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32",
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
            <div className="flex-1 md:flex-none text-left md:text-center min-w-0">
              <div className={cn(
                "font-bold text-foreground truncate md:whitespace-normal",
                "text-sm sm:text-lg md:text-xl lg:text-2xl"
              )}>
                {wrestler}
              </div>
            </div>

            {/* Checkmark */}
            {value === wrestler && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "rounded-full bg-primary flex items-center justify-center flex-shrink-0",
                  "w-7 h-7 sm:w-8 sm:h-8 md:absolute md:top-3 md:right-3 md:w-8 md:h-8"
                )}
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* VS indicator for desktop */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="text-2xl lg:text-3xl font-black text-muted-foreground/30">VS</div>
      </div>
    </div>
  );
}
