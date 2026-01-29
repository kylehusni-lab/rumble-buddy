import { useState, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Target, Users, Search, Check, X, Ban, Plus, Hash, Clock, Zap, Trophy, Timer, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { RUMBLE_PROPS, FINAL_FOUR_SLOTS, SCORING, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";
import { getBlockedWrestlers, getBlockedReason } from "@/lib/pick-validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Map prop IDs to Lucide icons
const PROP_ICONS: Record<string, LucideIcon> = {
  entrant_1: Hash,
  entrant_30: Hash,
  first_elimination: Zap,
  most_eliminations: Trophy,
  longest_time: Timer,
};

interface RumblePropsCardProps {
  title: string;
  gender: "mens" | "womens";
  values: Record<string, string | null>;
  onChange: (values: Record<string, string | null>) => void;
  disabled?: boolean;
  customEntrants?: string[];
}

export const RumblePropsCard = memo(function RumblePropsCard({
  title,
  gender,
  values,
  onChange,
  disabled,
  customEntrants,
}: RumblePropsCardProps) {
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFinalFourOpen, setIsFinalFourOpen] = useState(false);
  const [finalFourSelections, setFinalFourSelections] = useState<(string | null)[]>([null, null, null, null]);

  const defaultEntrants = gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS;
  const entrants = useMemo(() => 
    customEntrants && customEntrants.length > 0 ? customEntrants : defaultEntrants,
    [customEntrants, defaultEntrants]
  );

  const filteredEntrants = useMemo(() => 
    entrants
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort(sortEntrants),
    [entrants, searchQuery]
  );

  // Helper to get match_id for a prop
  const getMatchId = (propId: string) => `${gender}_${propId}`;

  // Extract current prop ID being edited (for conflict checking)
  const currentPropId = activePickerId?.replace(`${gender}_`, '') || null;

  // Get blocked wrestlers for the current picker
  const blockedWrestlers = useMemo(() => {
    if (!currentPropId) return new Set<string>();
    return getBlockedWrestlers(gender, currentPropId, values);
  }, [gender, currentPropId, values]);

  // Count completed props
  const completedWrestlerProps = RUMBLE_PROPS.filter(
    (p) => values[getMatchId(p.id)]
  ).length;
  const completedFinalFour = Array.from({ length: FINAL_FOUR_SLOTS }).filter(
    (_, i) => values[getMatchId(`final_four_${i + 1}`)]
  ).length;

  const totalProps = RUMBLE_PROPS.length + 1; // 5 wrestler props + 1 Final Four group
  const completedGroups = completedWrestlerProps + (completedFinalFour === 4 ? 1 : 0);

  const handleWrestlerSelect = useCallback((wrestler: string) => {
    if (!activePickerId || disabled) return;
    onChange({ ...values, [activePickerId]: wrestler });
    setActivePickerId(null);
    setSearchQuery("");
  }, [activePickerId, disabled, onChange, values]);

  const openPicker = useCallback((matchId: string) => {
    if (disabled) return;
    setActivePickerId(matchId);
    setSearchQuery("");
  }, [disabled]);

  // Final Four handlers
  const openFinalFourPicker = () => {
    if (disabled) return;
    // Load current selections
    const current = Array.from({ length: 4 }).map((_, i) => 
      values[getMatchId(`final_four_${i + 1}`)] || null
    );
    setFinalFourSelections(current);
    setIsFinalFourOpen(true);
  };

  const handleFinalFourSelect = (wrestler: string) => {
    // Find first empty slot or toggle if already selected
    const existingIndex = finalFourSelections.indexOf(wrestler);
    if (existingIndex !== -1) {
      // Remove selection
      const newSelections = [...finalFourSelections];
      newSelections[existingIndex] = null;
      setFinalFourSelections(newSelections);
    } else {
      // Add to first empty slot
      const emptyIndex = finalFourSelections.indexOf(null);
      if (emptyIndex !== -1) {
        const newSelections = [...finalFourSelections];
        newSelections[emptyIndex] = wrestler;
        setFinalFourSelections(newSelections);
      }
    }
  };

  const saveFinalFour = () => {
    const updates: Record<string, string | null> = {};
    finalFourSelections.forEach((wrestler, i) => {
      updates[getMatchId(`final_four_${i + 1}`)] = wrestler;
    });
    onChange({ ...values, ...updates });
    setIsFinalFourOpen(false);
  };

  // Get Final Four picks for display
  const finalFourPicks = Array.from({ length: 4 }).map((_, i) => 
    values[getMatchId(`final_four_${i + 1}`)]
  ).filter(Boolean);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border flex flex-col overflow-hidden h-full max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Rumble Props</div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {completedGroups}/{totalProps}
        </div>
      </div>

      <div className="flex-1 min-h-0 -mx-2 px-2 overflow-y-auto">
        <div className="space-y-3 sm:space-y-4 pb-20">
          {/* Wrestler Props Grid - 2 columns on mobile, 3 on larger screens */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {RUMBLE_PROPS.map((prop) => {
              const matchId = getMatchId(prop.id);
              const selectedWrestler = values[matchId];
              const points = prop.id === 'most_eliminations' || prop.id === 'longest_time' 
                ? SCORING.MOST_ELIMINATIONS 
                : prop.id.startsWith('entrant') 
                  ? SCORING.ENTRANT_GUESS 
                  : SCORING.FIRST_ELIMINATION;
              
              return (
                <button
                  key={prop.id}
                  onClick={() => openPicker(matchId)}
                  disabled={disabled}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl border text-left transition-all",
                    selectedWrestler 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const Icon = PROP_ICONS[prop.id] || Target;
                      return <Icon className="w-4 h-4 text-primary flex-shrink-0" />;
                    })()}
                    <span className="text-xs sm:text-sm font-medium text-foreground">{prop.title}</span>
                  </div>
                  {selectedWrestler ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(selectedWrestler))}
                        alt={getEntrantDisplayName(selectedWrestler)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 border border-primary"
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(selectedWrestler));
                        }}
                      />
                      <span className={cn(
                        "text-xs sm:text-sm font-medium truncate",
                        isUnconfirmedEntrant(selectedWrestler) && "italic opacity-80"
                      )}>
                        {getEntrantDisplayName(selectedWrestler)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      Tap to pick • +{points}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Final Four Section - Compact */}
          <div className="border-t border-border pt-3">
            <button
              onClick={openFinalFourPicker}
              disabled={disabled}
              className={cn(
                "w-full p-3 rounded-xl border text-left transition-all",
                completedFinalFour === 4
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Final Four</span>
                </div>
                <span className="text-xs text-primary">+{SCORING.FINAL_FOUR_PICK} pts each</span>
              </div>
              
              {completedFinalFour > 0 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const pick = values[getMatchId(`final_four_${i + 1}`)];
                    return pick ? (
                      <img
                        key={i}
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                    ) : (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    );
                  })}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {completedFinalFour}/4 picked
                  </span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Tap to pick 4 wrestlers who make the Final Four
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Single Wrestler Picker Modal */}
      <Dialog open={!!activePickerId} onOpenChange={(open) => !open && setActivePickerId(null)}>
        <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {activePickerId && RUMBLE_PROPS.find(p => getMatchId(p.id) === activePickerId)?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Current Selection - matching RumbleWinnerCard style */}
          {activePickerId && values[activePickerId] && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary flex items-center gap-3"
            >
              <img
                src={getWrestlerImageUrl(values[activePickerId]!)}
                alt={values[activePickerId]!}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImageUrl(values[activePickerId]!);
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Your Pick:</div>
                <div className="text-lg font-bold text-primary truncate">{getEntrantDisplayName(values[activePickerId]!)}</div>
              </div>
              <Check className="w-6 h-6 text-primary flex-shrink-0" />
            </motion.div>
          )}

          {/* Search */}
          <div className="relative">
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

          {/* Wrestler Grid */}
          <div className="flex-1 mt-4 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 pb-4">
              {filteredEntrants.map((wrestler) => {
                const isSelected = activePickerId ? values[activePickerId] === wrestler : false;
                const isBlocked = blockedWrestlers.has(wrestler);
                const blockReason = isBlocked && currentPropId 
                  ? getBlockedReason(gender, currentPropId, wrestler, values)
                  : null;
                
                const wrestlerButton = (
                  <motion.button
                    key={wrestler}
                    onClick={() => !isBlocked && handleWrestlerSelect(wrestler)}
                    disabled={disabled || isBlocked}
                    className={cn(
                      "flex flex-col items-center",
                      isBlocked && "opacity-40"
                    )}
                    whileTap={!disabled && !isBlocked ? { scale: 0.95 } : undefined}
                  >
                    <div
                      className={cn(
                        "relative w-full aspect-square max-w-[60px] sm:max-w-[70px] rounded-full overflow-hidden border-[3px] transition-all duration-200",
                        isSelected
                          ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                          : isBlocked
                            ? "border-destructive/50"
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
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Check className="text-primary-foreground w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                        </motion.div>
                      )}
                      {isBlocked && !isSelected && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <Ban className="text-destructive w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[9px] sm:text-[10px] text-center leading-tight line-clamp-2 w-full max-w-[60px] sm:max-w-[70px]",
                        isSelected ? "text-primary font-semibold" : "text-foreground",
                        isBlocked && "text-destructive/70",
                        isUnconfirmedEntrant(wrestler) && "italic opacity-80"
                      )}
                    >
                      {getEntrantDisplayName(wrestler)}
                    </span>
                  </motion.button>
                );
                
                if (isBlocked && blockReason) {
                  return (
                    <TooltipProvider key={wrestler}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {wrestlerButton}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{blockReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                
              return wrestlerButton;
            })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Four Picker Modal */}
      <Dialog open={isFinalFourOpen} onOpenChange={setIsFinalFourOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pick Your Final Four
            </DialogTitle>
          </DialogHeader>

          {/* Current Selections Display */}
          <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
            {finalFourSelections.map((wrestler, i) => (
              <div key={i} className="relative">
                {wrestler ? (
                  <button
                    onClick={() => handleFinalFourSelect(wrestler)}
                    className="relative"
                  >
                    <img
                      src={getWrestlerImageUrl(getEntrantDisplayName(wrestler))}
                      alt={getEntrantDisplayName(wrestler)}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                      onError={(e) => {
                        e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(wrestler));
                      }}
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </div>
                  </button>
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground py-2">
            {4 - finalFourSelections.filter(Boolean).length} slots remaining
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search wrestlers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Wrestler Grid */}
          <div className="flex-1 mt-2 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 pb-4">
              {filteredEntrants.map((wrestler) => {
                const isSelected = finalFourSelections.includes(wrestler);
                const isFull = finalFourSelections.filter(Boolean).length >= 4 && !isSelected;
                // Block first elimination pick from Final Four
                const firstElimPick = values[getMatchId('first_elimination')];
                const isBlockedByFirstElim = firstElimPick === wrestler;
                const isDisabled = isFull || isBlockedByFirstElim;
                
                return (
                  <motion.button
                    key={wrestler}
                    onClick={() => !isDisabled && handleFinalFourSelect(wrestler)}
                    disabled={disabled || isDisabled}
                    className={cn(
                      "flex flex-col items-center",
                      isDisabled && !isSelected && "opacity-40"
                    )}
                    whileTap={!disabled && !isDisabled ? { scale: 0.95 } : undefined}
                  >
                    <div
                      className={cn(
                        "relative w-full aspect-square max-w-[60px] sm:max-w-[70px] rounded-full overflow-hidden border-[3px] transition-all duration-200",
                        isSelected
                          ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                          : isBlockedByFirstElim
                            ? "border-destructive/50"
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
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Check className="text-primary-foreground w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                        </motion.div>
                      )}
                      {isBlockedByFirstElim && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <Ban className="text-destructive w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[9px] sm:text-[10px] text-center leading-tight line-clamp-2 w-full max-w-[60px] sm:max-w-[70px]",
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

          {/* Save Button */}
          <Button
            onClick={saveFinalFour}
            className="w-full mt-2"
            disabled={finalFourSelections.filter(Boolean).length === 0}
          >
            Save Final Four ({finalFourSelections.filter(Boolean).length}/4)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
});
