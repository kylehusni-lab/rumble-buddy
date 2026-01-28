import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UNDERCARD_MATCHES, RUMBLE_PROPS, CHAOS_PROPS, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [showWrestlerPicker, setShowWrestlerPicker] = useState(false);

  const config = getPickConfig(matchId, customEntrants);

  if (!config) return null;

  const handleSave = () => {
    if (selectedValue && selectedValue !== currentPick) {
      onSave(matchId, selectedValue);
    }
    onClose();
  };

  const handleWrestlerSelect = (wrestler: string) => {
    setSelectedValue(wrestler);
    setShowWrestlerPicker(false);
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

  // Yes/No options (chaos props)
  if (config.type === "yesno") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{config.title}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 py-4">
            {["YES", "NO"].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedValue(option)}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 text-center font-bold text-lg transition-all",
                  selectedValue === option
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

  // Wrestler picker
  if (config.type === "wrestler") {
    return (
      <>
        <Dialog open={isOpen && !showWrestlerPicker} onOpenChange={onClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">{config.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <button
                onClick={() => setShowWrestlerPicker(true)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-center transition-all",
                  selectedValue
                    ? "border-primary bg-primary/10"
                    : "border-dashed border-muted-foreground/50 bg-muted/30"
                )}
              >
                {selectedValue ? (
                  <div className="font-semibold text-primary">{selectedValue}</div>
                ) : (
                  <div className="text-muted-foreground">Tap to select wrestler</div>
                )}
              </button>
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

        <WrestlerPickerModal
          isOpen={showWrestlerPicker}
          onClose={() => setShowWrestlerPicker(false)}
          onSelect={handleWrestlerSelect}
          title={`Select for ${config.title}`}
          wrestlers={config.entrants}
          triggerConfetti={false}
        />
      </>
    );
  }

  return null;
}
