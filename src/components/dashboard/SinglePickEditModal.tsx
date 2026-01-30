import { useState, useMemo, Fragment } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UNDERCARD_MATCHES, RUMBLE_PROPS, CHAOS_PROPS, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { WrestlerPickerModal } from "@/components/WrestlerPickerModal";
import { getBlockedWrestlers } from "@/lib/pick-validation";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";

interface SinglePickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentPick: string;
  onSave: (matchId: string, newValue: string) => void;
  mensEntrants?: string[];
  womensEntrants?: string[];
  allPicks?: Record<string, string>;
}

// Determine the pick type and options based on matchId
function getPickConfig(matchId: string, mensEntrants?: string[], womensEntrants?: string[]) {
  // Undercard matches
  const undercardMatch = UNDERCARD_MATCHES.find(m => m.id === matchId);
  if (undercardMatch) {
    return {
      type: "binary" as const,
      title: undercardMatch.title,
      options: undercardMatch.options,
    };
  }

  // Rumble winner picks
  if (matchId === "mens_rumble_winner" || matchId === "womens_rumble_winner") {
    const gender = matchId.includes("womens") ? "womens" : "mens";
    const entrants = gender === "mens" 
      ? (mensEntrants || DEFAULT_MENS_ENTRANTS)
      : (womensEntrants || DEFAULT_WOMENS_ENTRANTS);
    return {
      type: "wrestler" as const,
      title: gender === "mens" ? "Men's Rumble Winner" : "Women's Rumble Winner",
      gender,
      entrants,
    };
  }

  // Chaos props (yes/no)
  if (matchId.includes("chaos_prop")) {
    const gender = matchId.includes("womens") ? "Women's" : "Men's";
    const propIndex = parseInt(matchId.split("_").pop() || "1") - 1;
    const prop = CHAOS_PROPS[propIndex];
    return {
      type: "yesno" as const,
      title: `${gender} ${prop?.shortName || "Chaos Prop"}`,
      options: ["YES", "NO"],
    };
  }

  // Rumble props (wrestler select)
  const rumblePropMatch = RUMBLE_PROPS.find(p => matchId.includes(p.id));
  if (rumblePropMatch) {
    // Check for womens BEFORE mens to avoid substring collision
    const gender = matchId.includes("womens") ? "womens" : "mens";
    const entrants = gender === "mens" 
      ? (mensEntrants || DEFAULT_MENS_ENTRANTS)
      : (womensEntrants || DEFAULT_WOMENS_ENTRANTS);
    return {
      type: "wrestler" as const,
      title: rumblePropMatch.title,
      gender,
      entrants,
      propId: rumblePropMatch.id,
    };
  }

  // Final four picks
  if (matchId.includes("final_four")) {
    // Check for womens BEFORE mens to avoid substring collision
    const gender = matchId.includes("womens") ? "womens" : "mens";
    const slotNum = matchId.split("_").pop();
    const entrants = gender === "mens" 
      ? (mensEntrants || DEFAULT_MENS_ENTRANTS)
      : (womensEntrants || DEFAULT_WOMENS_ENTRANTS);
    return {
      type: "wrestler" as const,
      title: `${gender === "mens" ? "Men's" : "Women's"} Final Four #${slotNum}`,
      gender,
      entrants,
      propId: `final_four_${slotNum}`,
    };
  }

  return null;
}

export function SinglePickEditModal({
  isOpen,
  onClose,
  matchId,
  currentPick,
  onSave,
  mensEntrants,
  womensEntrants,
  allPicks,
}: SinglePickEditModalProps) {
  const [selectedValue, setSelectedValue] = useState(currentPick);

  const config = getPickConfig(matchId, mensEntrants, womensEntrants);

  // Calculate blocked wrestlers based on existing picks and validation rules
  const blockedWrestlers = useMemo(() => {
    if (!allPicks || config?.type !== "wrestler") return new Set<string>();
    
    // Extract gender and propId from matchId
    // Check for womens BEFORE mens to avoid substring collision
    const gender = matchId.includes("womens") ? "womens" : "mens";
    
    // Extract the propId by removing the gender prefix
    let propId = matchId.replace(`${gender}_`, "");
    
    return getBlockedWrestlers(gender as "mens" | "womens", propId, allPicks);
  }, [matchId, allPicks, config]);

  // Filter entrants to exclude blocked wrestlers
  const availableEntrants = useMemo(() => {
    if (!config?.entrants) return [];
    return config.entrants.filter(wrestler => !blockedWrestlers.has(wrestler));
  }, [config?.entrants, blockedWrestlers]);

  if (!config) return null;

  const handleSave = () => {
    if (selectedValue && selectedValue !== currentPick) {
      onSave(matchId, selectedValue);
    }
    onClose();
  };

  // Binary options (match winner with 2 options) - Visual Face-Off style
  if (config.type === "binary") {
    const handleSelect = (option: string) => {
      onSave(matchId, option);
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{config.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 relative">
            {config.options.map((option, index) => (
              <Fragment key={option}>
                <button
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 flex items-center gap-4 transition-all",
                    currentPick === option
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "relative w-[72px] h-[72px] rounded-full overflow-hidden border-2 flex-shrink-0",
                    currentPick === option ? "border-primary" : "border-border"
                  )}>
                    <img
                      src={getWrestlerImageUrl(option)}
                      alt={option}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getPlaceholderImageUrl(option);
                      }}
                    />
                  </div>
                  <span className={cn(
                    "text-lg font-bold flex-1 text-left",
                    currentPick === option ? "text-primary" : "text-foreground"
                  )}>
                    {option}
                  </span>
                  {currentPick === option && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
                {index === 0 && (
                  <div className="flex justify-center py-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/50 flex items-center justify-center">
                      <span className="text-sm font-black text-primary">VS</span>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Yes/No options (chaos props) - auto-save on selection
  if (config.type === "yesno") {
    const handleSelect = (option: string) => {
      onSave(matchId, option);
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{config.title}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 py-4">
            {["YES", "NO"].map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 text-center font-bold text-lg transition-all",
                  currentPick === option
                    ? option === "YES"
                      ? "border-success bg-success/10 text-success"
                      : "border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-card hover:border-muted-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Wrestler picker - open directly without intermediate dialog
  if (config.type === "wrestler") {
    return (
      <WrestlerPickerModal
        isOpen={isOpen}
        onClose={onClose}
        onSelect={(wrestler) => {
          onSave(matchId, wrestler);
          onClose();
        }}
        title={config.title}
        wrestlers={availableEntrants}
        currentSelection={currentPick}
        triggerConfetti={false}
      />
    );
  }

  return null;
}
