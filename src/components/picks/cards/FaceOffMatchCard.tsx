import React, { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { SCORING } from "@/lib/constants";
import { PickCardHeader } from "./PickCardHeader";

interface FaceOffMatchCardProps {
  title: string;
  options: readonly [string, string] | string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const FaceOffMatchCard = memo(forwardRef<HTMLDivElement, FaceOffMatchCardProps>(
  function FaceOffMatchCard({ title, options, value, onChange, disabled }, ref) {
    const [wrestler1, wrestler2] = options;
    
    return (
      <div ref={ref} className="bg-card rounded-2xl shadow-card border border-border flex flex-col h-full overflow-hidden">
        {/* Unified Header */}
        <div className="p-4 sm:p-6 pb-3">
          <PickCardHeader
            icon={Trophy}
            label="Match Winner"
            title={title}
            pointsText={`+${SCORING.UNDERCARD_WINNER} pts if correct`}
          />
        </div>

        {/* Face-Off Arena */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Wrestler 1 - Gold Corner */}
          <motion.button
            onClick={() => !disabled && onChange(wrestler1)}
            disabled={disabled}
            className={cn(
              "relative flex-1 flex flex-col items-center justify-center p-4 pb-2 transition-all duration-300",
              value === wrestler1 ? "faceoff-corner-1-selected" : "faceoff-corner-1",
              value && value !== wrestler1 && "spotlight-dimmed",
              disabled && "cursor-not-allowed"
            )}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
          >
            {/* Wrestler Photo */}
            <div className={cn(
              "relative rounded-full overflow-hidden border-4 transition-all duration-300",
              "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
              value === wrestler1 
                ? "gold-selection-glow scale-105" 
                : "border-primary/30"
            )}>
              <img
                src={getWrestlerImageUrl(wrestler1)}
                alt={wrestler1}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImageUrl(wrestler1);
                }}
              />
              {/* Selection Checkmark */}
              {value === wrestler1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Wrestler Name */}
            <div className={cn(
              "mt-2 text-base sm:text-lg font-bold text-center transition-colors duration-300 px-2",
              value === wrestler1 ? "text-primary" : "text-foreground"
            )}>
              {wrestler1}
            </div>
          </motion.button>

          {/* VS Badge - Dedicated Row */}
          <div className="relative py-2 flex items-center justify-center z-10">
            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-150" />
              {/* Badge */}
              <div className={cn(
                "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
                "gold-shimmer",
                "border-2 border-white/20",
                "shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              )}>
                <span className="text-base sm:text-lg font-black text-primary-foreground drop-shadow-sm">
                  VS
                </span>
              </div>
            </div>
          </div>

          {/* Wrestler 2 - Green Corner */}
          <motion.button
            onClick={() => !disabled && onChange(wrestler2)}
            disabled={disabled}
            className={cn(
              "relative flex-1 flex flex-col items-center justify-center p-4 pt-2 transition-all duration-300",
              value === wrestler2 ? "faceoff-corner-2-selected" : "faceoff-corner-2",
              value && value !== wrestler2 && "spotlight-dimmed",
              disabled && "cursor-not-allowed"
            )}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
          >
            {/* Wrestler Photo */}
            <div className={cn(
              "relative rounded-full overflow-hidden border-4 transition-all duration-300",
              "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
              value === wrestler2 
                ? "gold-selection-glow scale-105" 
                : "border-secondary/30"
            )}>
              <img
                src={getWrestlerImageUrl(wrestler2)}
                alt={wrestler2}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImageUrl(wrestler2);
                }}
              />
              {/* Selection Checkmark */}
              {value === wrestler2 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Wrestler Name */}
            <div className={cn(
              "mt-2 text-base sm:text-lg font-bold text-center transition-colors duration-300 px-2",
              value === wrestler2 ? "text-primary" : "text-foreground"
            )}>
              {wrestler2}
            </div>
          </motion.button>
        </div>
      </div>
    );
  }
));
