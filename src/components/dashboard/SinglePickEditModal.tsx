import { useState } from "react";
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

interface SinglePickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentPick: string;
  onSave: (matchId: string, newValue: string) => void;
  customEntrants?: string[];
}

// Determine the pick type and options based on matchId
function getPickConfig(matchId: string, customEntrants?: string[]) {
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
    const gender = matchId.includes("mens") ? "mens" : "womens";
    return {
      type: "wrestler" as const,
      title: gender === "mens" ? "Men's Rumble Winner" : "Women's Rumble Winner",
      gender,
      entrants: customEntrants || (gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS),
    };
  }

  // Chaos props (yes/no)
  if (matchId.includes("chaos_prop")) {
    const gender = matchId.includes("mens") ? "Men's" : "Women's";
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
    const gender = matchId.includes("mens") ? "mens" : "womens";
    return {
      type: "wrestler" as const,
      title: rumblePropMatch.title,
      gender,
      entrants: customEntrants || (gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS),
    };
  }

  // Final four picks
  if (matchId.includes("final_four")) {
    const gender = matchId.includes("mens") ? "mens" : "womens";
    const slotNum = matchId.split("_").pop();
    return {
      type: "wrestler" as const,
      title: `${gender === "mens" ? "Men's" : "Women's"} Final Four #${slotNum}`,
      gender,
      entrants: customEntrants || (gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS),
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
  customEntrants,
}: SinglePickEditModalProps) {
  const [selectedValue, setSelectedValue] = useState(currentPick);

  const config = getPickConfig(matchId, customEntrants);

  if (!config) return null;

  const handleSave = () => {
    if (selectedValue && selectedValue !== currentPick) {
      onSave(matchId, selectedValue);
    }
    onClose();
  };

  // Binary options (match winner with 2 options)
  if (config.type === "binary") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{config.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {config.options.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedValue(option)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left font-semibold transition-all",
                  selectedValue === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedValue === option && <Check size={20} className="text-primary" />}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!selectedValue}>
              Save
            </Button>
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
        wrestlers={config.entrants}
        currentSelection={currentPick}
        triggerConfetti={false}
      />
    );
  }

  return null;
}
