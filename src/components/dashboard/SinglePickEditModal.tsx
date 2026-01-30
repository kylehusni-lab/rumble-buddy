import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UNDERCARD_MATCHES, RUMBLE_PROPS, CHAOS_PROPS, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { WrestlerPickerModal } from "@/components/WrestlerPickerModal";
import { getBlockedWrestlers } from "@/lib/pick-validation";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { Check } from "lucide-react";

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

// Diagonal Face-Off component for binary match picks
function DiagonalFaceOff({
  options,
  currentPick,
  onSelect,
  title,
}: {
  options: readonly string[];
  currentPick: string;
  onSelect: (option: string) => void;
  title: string;
}) {
  const [wrestler1, wrestler2] = options;

  return (
    <div className="relative w-full bg-card overflow-hidden">
      {/* Match Title Header */}
      <div className="text-center py-4 px-4 bg-gradient-to-b from-card to-transparent">
        <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Tap a wrestler to select</p>
      </div>

      {/* Face-Off Container - Stacked vertical with diagonal visual */}
      <div className="relative">
        {/* Top Wrestler Zone */}
        <button
          onClick={() => onSelect(wrestler1)}
          className={cn(
            "relative w-full py-6 px-4 transition-all duration-300",
            "flex items-center gap-4",
            "faceoff-zone-1",
            currentPick === wrestler1 && "ring-2 ring-primary ring-inset bg-primary/10"
          )}
        >
          {/* Wrestler Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={getWrestlerImageUrl(wrestler1)}
              alt={wrestler1}
              className={cn(
                "w-24 h-24 rounded-full object-cover border-4 transition-all",
                currentPick === wrestler1 
                  ? "border-primary shadow-lg shadow-primary/30" 
                  : "border-border/50"
              )}
              onError={(e) => {
                e.currentTarget.src = getPlaceholderImageUrl(wrestler1);
              }}
            />
            {currentPick === wrestler1 && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
              </div>
            )}
          </div>
          
          {/* Wrestler Info */}
          <div className="flex-1 text-left">
            <span className={cn(
              "font-black text-xl uppercase tracking-wide block",
              currentPick === wrestler1 ? "text-primary" : "text-foreground"
            )}>
              {wrestler1}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Tap to select
            </span>
          </div>
        </button>

        {/* VS Divider */}
        <div className="relative h-0 flex items-center justify-center z-10">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="vs-badge-glow rounded-full">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-4 border-card">
              <span className="text-lg font-black text-primary-foreground">VS</span>
            </div>
          </div>
        </div>

        {/* Bottom Wrestler Zone */}
        <button
          onClick={() => onSelect(wrestler2)}
          className={cn(
            "relative w-full py-6 px-4 transition-all duration-300",
            "flex items-center gap-4 flex-row-reverse",
            "faceoff-zone-2",
            currentPick === wrestler2 && "ring-2 ring-primary ring-inset bg-primary/10"
          )}
        >
          {/* Wrestler Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={getWrestlerImageUrl(wrestler2)}
              alt={wrestler2}
              className={cn(
                "w-24 h-24 rounded-full object-cover border-4 transition-all",
                currentPick === wrestler2 
                  ? "border-primary shadow-lg shadow-primary/30" 
                  : "border-border/50"
              )}
              onError={(e) => {
                e.currentTarget.src = getPlaceholderImageUrl(wrestler2);
              }}
            />
            {currentPick === wrestler2 && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
              </div>
            )}
          </div>
          
          {/* Wrestler Info */}
          <div className="flex-1 text-right">
            <span className={cn(
              "font-black text-xl uppercase tracking-wide block",
              currentPick === wrestler2 ? "text-primary" : "text-foreground"
            )}>
              {wrestler2}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Tap to select
            </span>
          </div>
        </button>
      </div>
    </div>
  );
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
    const gender = matchId.includes("womens") ? "womens" : "mens";
    let propId = matchId.replace(`${gender}_`, "");
    return getBlockedWrestlers(gender as "mens" | "womens", propId, allPicks);
  }, [matchId, allPicks, config]);

  // Filter entrants to exclude blocked wrestlers
  const availableEntrants = useMemo(() => {
    if (!config?.entrants) return [];
    return config.entrants.filter(wrestler => !blockedWrestlers.has(wrestler));
  }, [config?.entrants, blockedWrestlers]);

  if (!config) return null;

  // Binary options (match winner with 2 options) - WWE Diagonal Face-Off style
  if (config.type === "binary") {
    const handleSelect = (option: string) => {
      onSave(matchId, option);
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <DiagonalFaceOff
            options={config.options}
            currentPick={currentPick}
            onSelect={handleSelect}
            title={config.title}
          />
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
