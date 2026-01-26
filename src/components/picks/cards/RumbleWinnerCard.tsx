import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { SCORING, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";

interface RumbleWinnerCardProps {
  title: string;
  gender: "mens" | "womens";
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  customEntrants?: string[];
}

export function RumbleWinnerCard({ 
  title, 
  gender, 
  value, 
  onChange, 
  disabled,
  customEntrants 
}: RumbleWinnerCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const defaultEntrants = gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS;
  const entrants = customEntrants && customEntrants.length > 0 ? customEntrants : defaultEntrants;
  
  const filteredEntrants = entrants.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (wrestler: string) => {
    if (disabled) return;
    onChange(wrestler);
    
    // Trigger confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#4B0082', '#FFD700'],
    });
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-6 h-6 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Royal Rumble Winner</div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="text-sm text-primary mb-4 font-bold">
        +{SCORING.RUMBLE_WINNER_PICK} pts if correct
      </div>

      {/* Current Selection */}
      {value && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary"
        >
          <div className="text-xs text-muted-foreground mb-1">Your Pick:</div>
          <div className="text-lg font-bold text-primary">{value}</div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search wrestlers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Wrestler Grid (Scrollable) */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 pb-4">
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
                {/* Photo Container */}
                <div
                  className={cn(
                    "relative w-[70px] h-[70px] rounded-full overflow-hidden border-[3px] transition-all duration-200",
                    isSelected
                      ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
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
                      <Check className="text-primary-foreground" size={28} strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Name */}
                <span
                  className={cn(
                    "mt-2 text-xs text-center leading-tight line-clamp-2 w-[70px]",
                    isSelected ? "text-primary font-semibold" : "text-foreground"
                  )}
                >
                  {wrestler}
                </span>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
