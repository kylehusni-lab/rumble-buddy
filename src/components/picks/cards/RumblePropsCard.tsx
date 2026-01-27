import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Users, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { RUMBLE_PROPS, FINAL_FOUR_SLOTS, SCORING, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RumblePropsCardProps {
  title: string;
  gender: "mens" | "womens";
  values: Record<string, string | null>;
  onChange: (values: Record<string, string | null>) => void;
  disabled?: boolean;
  customEntrants?: string[];
}

export function RumblePropsCard({
  title,
  gender,
  values,
  onChange,
  disabled,
  customEntrants,
}: RumblePropsCardProps) {
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const defaultEntrants = gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS;
  const entrants = customEntrants && customEntrants.length > 0 ? customEntrants : defaultEntrants;

  const filteredEntrants = entrants
    .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(sortEntrants);

  // Helper to get match_id for a prop
  const getMatchId = (propId: string) => `${gender}_${propId}`;

  // Count completed props
  const wrestlerProps = RUMBLE_PROPS.filter((p) => p.type === "wrestler");
  const yesNoProps = RUMBLE_PROPS.filter((p) => p.type === "yesno");
  
  const completedWrestlerProps = wrestlerProps.filter(
    (p) => values[getMatchId(p.id)]
  ).length;
  const completedFinalFour = Array.from({ length: FINAL_FOUR_SLOTS }).filter(
    (_, i) => values[getMatchId(`final_four_${i + 1}`)]
  ).length;
  const completedYesNo = yesNoProps.filter(
    (p) => values[getMatchId(p.id)]
  ).length;
  
  const totalProps = wrestlerProps.length + FINAL_FOUR_SLOTS + yesNoProps.length;
  const completedProps = completedWrestlerProps + completedFinalFour + completedYesNo;

  const handleWrestlerSelect = (wrestler: string) => {
    if (!activePickerId || disabled) return;
    onChange({ ...values, [activePickerId]: wrestler });
    setActivePickerId(null);
    setSearchQuery("");
  };

  const handleYesNoSelect = (propId: string, answer: "YES" | "NO") => {
    if (disabled) return;
    const matchId = getMatchId(propId);
    onChange({ ...values, [matchId]: answer });
  };

  const openPicker = (matchId: string) => {
    if (disabled) return;
    setActivePickerId(matchId);
    setSearchQuery("");
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border flex flex-col overflow-hidden h-full max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Rumble Props</div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {completedProps}/{totalProps} filled
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
        <div className="space-y-4 pb-24">
          {/* Wrestler Select Props */}
          {wrestlerProps.map((prop) => {
            const matchId = getMatchId(prop.id);
            const selectedWrestler = values[matchId];
            return (
              <div key={prop.id} className="space-y-1">
                <div className="text-sm font-medium text-foreground">{prop.question}</div>
                <div className="text-xs text-primary">
                  +{prop.id === 'most_eliminations' || prop.id === 'longest_time' ? SCORING.MOST_ELIMINATIONS : prop.id.startsWith('entrant') ? SCORING.ENTRANT_GUESS : SCORING.FIRST_ELIMINATION} pts
                </div>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start h-12",
                    selectedWrestler && "border-primary bg-primary/10"
                  )}
                  onClick={() => openPicker(matchId)}
                  disabled={disabled}
                >
                  {selectedWrestler ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(selectedWrestler))}
                        alt={getEntrantDisplayName(selectedWrestler)}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(selectedWrestler));
                        }}
                      />
                      <span className={cn("font-medium", isUnconfirmedEntrant(selectedWrestler) && "italic opacity-80")}>
                        {getEntrantDisplayName(selectedWrestler)}
                      </span>
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Tap to select wrestler...</span>
                  )}
                </Button>
              </div>
            );
          })}

          {/* Final Four Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">Final Four</div>
                <div className="text-xs text-muted-foreground">
                  Pick 4 wrestlers who make the Final Four (+{SCORING.FINAL_FOUR_PICK} pts each)
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, index) => {
                const matchId = getMatchId(`final_four_${index + 1}`);
                const selectedWrestler = values[matchId];
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      "h-14 justify-start",
                      selectedWrestler && "border-primary bg-primary/10"
                    )}
                    onClick={() => openPicker(matchId)}
                    disabled={disabled}
                  >
                    {selectedWrestler ? (
                      <div className="flex items-center gap-2 w-full">
                        <img
                          src={getWrestlerImageUrl(getEntrantDisplayName(selectedWrestler))}
                          alt={getEntrantDisplayName(selectedWrestler)}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(selectedWrestler));
                          }}
                        />
                        <span className={cn("font-medium text-sm truncate", isUnconfirmedEntrant(selectedWrestler) && "italic opacity-80")}>
                          {getEntrantDisplayName(selectedWrestler)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Slot {index + 1}</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Yes/No Props */}
          {yesNoProps.map((prop) => {
            const matchId = getMatchId(prop.id);
            const answer = values[matchId] as "YES" | "NO" | null;
            return (
              <div key={prop.id} className="space-y-2 pt-2 border-t border-border">
                <div className="text-sm font-medium text-foreground">{prop.question}</div>
                <div className="text-xs text-primary mb-2">+{SCORING.NO_SHOW_PROP} pts</div>
                <div className="flex gap-2">
                  <Button
                    variant={answer === "YES" ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      answer === "YES" && "bg-primary hover:bg-primary/90"
                    )}
                    onClick={() => handleYesNoSelect(prop.id, "YES")}
                    disabled={disabled}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    YES
                  </Button>
                  <Button
                    variant={answer === "NO" ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      answer === "NO" && "bg-destructive hover:bg-destructive/90"
                    )}
                    onClick={() => handleYesNoSelect(prop.id, "NO")}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4 mr-2" />
                    NO
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Wrestler Picker Modal */}
      <Dialog open={!!activePickerId} onOpenChange={(open) => !open && setActivePickerId(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Wrestler</DialogTitle>
          </DialogHeader>

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
          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-4 gap-3 pb-4">
              {filteredEntrants.map((wrestler) => {
                const isSelected = activePickerId ? values[activePickerId] === wrestler : false;
                // Check if already used in another slot (for Final Four)
                const isUsedElsewhere = activePickerId?.includes("final_four") && 
                  Array.from({ length: FINAL_FOUR_SLOTS }).some((_, i) => {
                    const slotId = getMatchId(`final_four_${i + 1}`);
                    return slotId !== activePickerId && values[slotId] === wrestler;
                  });
                
                return (
                  <motion.button
                    key={wrestler}
                    onClick={() => !isUsedElsewhere && handleWrestlerSelect(wrestler)}
                    disabled={disabled || isUsedElsewhere}
                    className={cn(
                      "flex flex-col items-center",
                      isUsedElsewhere && "opacity-40"
                    )}
                    whileTap={!disabled && !isUsedElsewhere ? { scale: 0.95 } : undefined}
                  >
                    <div
                      className={cn(
                        "relative w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] transition-all duration-200",
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
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Check className="text-primary-foreground" size={24} strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[10px] text-center leading-tight line-clamp-2 w-[60px]",
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
