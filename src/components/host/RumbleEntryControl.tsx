import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface RumbleEntryControlProps {
  nextNumber: number;
  ownerName: string | null;
  entrants: string[];
  enteredCount: number;
  onConfirmEntry: (wrestlerName: string) => Promise<void>;
  disabled?: boolean;
}

export function RumbleEntryControl({
  nextNumber,
  ownerName,
  entrants,
  enteredCount,
  onConfirmEntry,
  disabled = false,
}: RumbleEntryControlProps) {
  const [selectedWrestler, setSelectedWrestler] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (enteredCount / 30) * 100;
  const isComplete = enteredCount >= 30;

  const handleConfirm = async () => {
    if (!selectedWrestler) return;

    setIsSubmitting(true);
    try {
      await onConfirmEntry(selectedWrestler);
      setSelectedWrestler("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-green-950/20 border border-green-900 rounded-xl p-4 text-center">
        <p className="text-green-400 font-semibold">All 30 entrants have entered!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{enteredCount}/30 entered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Entry control */}
      <div className="bg-primary/10 border border-primary rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Next Entrant</span>
          <span className="text-3xl font-black text-primary">#{nextNumber}</span>
        </div>

        <div className="text-sm">
          Owner:{" "}
          <span className="font-semibold">
            {ownerName || <span className="text-muted-foreground">Vacant</span>}
          </span>
        </div>

        <Select
          value={selectedWrestler}
          onValueChange={setSelectedWrestler}
          disabled={disabled || isSubmitting}
        >
          <SelectTrigger className="min-h-[48px]">
            <SelectValue placeholder="Select wrestler..." />
          </SelectTrigger>
          <SelectContent>
            {entrants.map((wrestler) => (
              <SelectItem
                key={wrestler}
                value={wrestler}
                className="min-h-[44px]"
              >
                {wrestler}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="gold"
          className="w-full min-h-[48px]"
          onClick={handleConfirm}
          disabled={!selectedWrestler || isSubmitting || disabled}
        >
          {isSubmitting ? "Entering..." : `Confirm #${nextNumber} Entry`}
        </Button>
      </div>
    </div>
  );
}
