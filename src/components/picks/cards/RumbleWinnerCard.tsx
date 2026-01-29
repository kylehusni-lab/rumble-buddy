import { useState, memo, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { SCORING, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";
import { Input } from "@/components/ui/input";
import { PickCardHeader } from "./PickCardHeader";
import confetti from "canvas-confetti";

interface RumbleWinnerCardProps {
  title: string;
  gender: "mens" | "womens";
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  customEntrants?: string[];
}

export const RumbleWinnerCard = memo(function RumbleWinnerCard({ 
  title, 
  gender, 
  value, 
  onChange, 
  disabled,
  customEntrants 
}: RumbleWinnerCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const lastConfettiValue = useRef<string | null>(null);
  
  const defaultEntrants = gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS;
  const entrants = useMemo(() => 
    customEntrants && customEntrants.length > 0 ? customEntrants : defaultEntrants,
    [customEntrants, defaultEntrants]
  );
  
  // Filter and alphabetize, keeping "Surprise/Other Entrant" at the end
  const filteredEntrants = useMemo(() => 
    entrants
      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort(sortEntrants),
    [entrants, searchQuery]
  );

  const handleSelect = useCallback((wrestler: string) => {
    if (disabled) return;
    onChange(wrestler);
    
    // Only fire confetti if this is a new selection
    if (wrestler !== lastConfettiValue.current) {
      lastConfettiValue.current = wrestler;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#4B0082', '#FFD700'],
      });
    }
  }, [disabled, onChange]);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border flex flex-col overflow-hidden h-full">
      {/* Unified Header */}
      <PickCardHeader
        icon={Crown}
        label="Royal Rumble Winner"
        title={title}
        pointsText={`+${SCORING.RUMBLE_WINNER_PICK} pts if correct`}
      />

      {/* Current Selection */}
      {value && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary flex items-center gap-3"
        >
          <img
            src={getWrestlerImageUrl(value)}
            alt={value}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImageUrl(value);
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Your Pick:</div>
            <div className="text-lg font-bold text-primary truncate">{getEntrantDisplayName(value)}</div>
          </div>
          <Check className="w-6 h-6 text-primary flex-shrink-0" />
        </motion.div>
      )}

      {/* Search Bar - readOnly until tapped to prevent auto-keyboard */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search wrestlers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          autoFocus={false}
          inputMode="search"
          enterKeyHint="search"
        />
      </div>

      {/* Wrestler Grid (Scrollable) */}
      <div className="flex-1 min-h-0 -mx-2 px-2 overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3 pb-8">
          {filteredEntrants.map((wrestler) => {
            const isSelected = value === wrestler;
            return (
              <motion.button
                key={wrestler}
                onClick={() => handleSelect(wrestler)}
                disabled={disabled}
                className="flex flex-col items-center"
                whileTap={!disabled ? { scale: 0.95 } : undefined}
              >
                {/* Photo Container - using aspect-square for responsive sizing */}
                <div
                  className={cn(
                    "relative w-full aspect-square max-w-[70px] sm:max-w-[80px] md:max-w-[90px] rounded-full overflow-hidden border-[3px] transition-all duration-200",
                    isSelected
                      ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                      : isUnconfirmedEntrant(wrestler)
                        ? "border-dashed border-muted-foreground/50"
                        : "border-transparent"
                  )}
                >
                  <img
                    src={getWrestlerImageUrl(wrestler)}
                    alt={wrestler}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = getPlaceholderImageUrl(wrestler);
                    }}
                  />
                  
                  {/* Selected Checkmark Overlay */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Check className="text-primary-foreground w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Name */}
                <span
                  className={cn(
                    "mt-1 text-[9px] sm:text-[10px] md:text-xs text-center leading-tight line-clamp-2 w-full max-w-[70px] sm:max-w-[80px] md:max-w-[90px]",
                    isSelected ? "text-primary font-semibold" : "text-foreground",
                    isUnconfirmedEntrant(wrestler) && "italic opacity-80"
                  )}
                >
                  {getEntrantDisplayName(wrestler)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
