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
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Match Winner</div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-6">
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
              "relative p-4 rounded-xl border-2 transition-all",
              "flex items-center gap-4",
              value === wrestler
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
          >
            {/* Wrestler Photo */}
            <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-border">
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
            <div className="flex-1 text-left">
              <div className="text-lg font-bold text-foreground">{wrestler}</div>
            </div>

            {/* Checkmark */}
            {value === wrestler && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
