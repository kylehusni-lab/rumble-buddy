import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Users } from "lucide-react";

interface FinalFourWrestler {
  number: number;
  wrestler_name: string;
  ownerName: string;
}

interface FinalFourConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "mens" | "womens";
  wrestlers: FinalFourWrestler[];
  correctPredictionCount: number;
  totalPlayers: number;
  onConfirm: () => void;
}

export function FinalFourConfirmationModal({
  open,
  onOpenChange,
  type,
  wrestlers,
  correctPredictionCount,
  totalPlayers,
  onConfirm,
}: FinalFourConfirmationModalProps) {
  const label = type === "mens" ? "Men's" : "Women's";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Check className="text-primary" size={20} />
            Confirm {label} Final Four
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>The following 4 wrestlers will be recorded as the Final Four:</p>
              
              <div className="grid grid-cols-2 gap-2">
                {wrestlers.map((w) => (
                  <div
                    key={w.number}
                    className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-center"
                  >
                    <p className="text-xs text-muted-foreground">#{w.number}</p>
                    <p className="font-semibold text-sm text-foreground">{w.wrestler_name}</p>
                    <p className="text-xs text-muted-foreground">{w.ownerName}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                <Users className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {correctPredictionCount} of {totalPlayers} players
                  </p>
                  <p className="text-xs text-muted-foreground">
                    picked at least one correct Final Four wrestler
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Players earn +10 pts for each of their 4 picks that matches any wrestler in the Final Four.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm & Score
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
