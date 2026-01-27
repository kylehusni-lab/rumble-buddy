import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ActiveWrestler {
  number: number;
  wrestler_name: string;
  ownerName: string | null;
}

interface EliminationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNumber: number;
  targetWrestler: string;
  activeWrestlers: ActiveWrestler[];
  onConfirm: (eliminatedByNumber: number) => Promise<void>;
}

export function EliminationModal({
  open,
  onOpenChange,
  targetNumber,
  targetWrestler,
  activeWrestlers,
  onConfirm,
}: EliminationModalProps) {
  const [eliminatedBy, setEliminatedBy] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out the target wrestler from selectable eliminators
  const eliminators = activeWrestlers.filter((w) => w.number !== targetNumber);

  const handleConfirm = async () => {
    if (eliminatedBy === null) return;

    setIsSubmitting(true);
    try {
      await onConfirm(eliminatedBy);
      setEliminatedBy(null);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEliminatedBy(null);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Eliminate #{targetNumber} {targetWrestler}?
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select who eliminated them:
          </p>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {eliminators.map((wrestler) => (
              <button
                key={wrestler.number}
                className={cn(
                  "w-full p-3 rounded-lg border text-left min-h-[48px] transition-colors",
                  eliminatedBy === wrestler.number
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setEliminatedBy(wrestler.number)}
              >
                <span className="font-bold text-primary">#{wrestler.number}</span>
                <span className="ml-2">{wrestler.wrestler_name}</span>
                {wrestler.ownerName && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({wrestler.ownerName})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DrawerClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={eliminatedBy === null || isSubmitting}
          >
            {isSubmitting ? "Eliminating..." : "Confirm Elimination"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
