import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SCORING } from "@/lib/constants";

interface WinnerDeclarationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "mens" | "womens";
  winnerNumber: number;
  winnerName: string;
  ownerName: string | null;
  ironPersonName: string | null;
  correctPredictionCount: number;
  onConfirm: () => Promise<void>;
}

export function WinnerDeclarationModal({
  open,
  onOpenChange,
  type,
  winnerNumber,
  winnerName,
  ownerName,
  ironPersonName,
  correctPredictionCount,
  onConfirm,
}: WinnerDeclarationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-primary/20 to-background border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {type === "mens" ? "Men's" : "Women's"} Royal Rumble Winner
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-6">
          <Trophy className="mx-auto text-primary mb-4" size={64} />

          <p className="text-sm text-primary font-semibold mb-2">
            {type === "mens" ? "Men's" : "Women's"} Royal Rumble Winner
          </p>

          <div className="text-6xl font-black text-primary mb-2">
            #{winnerNumber}
          </div>

          <div className="text-3xl font-bold mb-6">{winnerName}</div>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left text-sm space-y-3">
            <div className="flex justify-between">
              <span>
                Number Owner{" "}
                {ownerName && (
                  <span className="text-muted-foreground">({ownerName})</span>
                )}
              </span>
              <span className="font-bold text-primary">
                +{SCORING.RUMBLE_WINNER_NUMBER} pts
              </span>
            </div>

            {correctPredictionCount > 0 && (
              <div className="flex justify-between">
                <span>
                  Correct Predictions{" "}
                  <span className="text-muted-foreground">
                    ({correctPredictionCount})
                  </span>
                </span>
                <span className="font-bold text-primary">
                  +{SCORING.RUMBLE_WINNER_PICK} pts each
                </span>
              </div>
            )}

            {ironPersonName && (
              <div className="flex justify-between">
                <span>
                  Iron {type === "mens" ? "Man" : "Woman"}{" "}
                  <span className="text-muted-foreground">({ironPersonName})</span>
                </span>
                <span className="font-bold text-primary">
                  +{SCORING.IRON_MAN} pts
                </span>
              </div>
            )}
          </div>

          <Button
            variant="gold"
            className="w-full min-h-[52px] text-lg"
            onClick={handleConfirm}
          >
            <Trophy size={20} className="mr-2" />
            Confirm Winner & Award Points
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
