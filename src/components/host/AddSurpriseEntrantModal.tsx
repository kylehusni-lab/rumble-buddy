import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface AddSurpriseEntrantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  existingEntrants: string[];
  onAdd: (name: string) => void;
}

export function AddSurpriseEntrantModal({
  open,
  onOpenChange,
  initialName = "",
  existingEntrants,
  onAdd,
}: AddSurpriseEntrantModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      setError("Please enter a wrestler name");
      return;
    }

    if (existingEntrants.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      setError("This wrestler is already in the list");
      return;
    }

    onAdd(trimmed);
    setName("");
    setError("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setError("");
    }
    onOpenChange(open);
  };

  // Update name when initialName changes
  useState(() => {
    if (initialName) setName(initialName);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add Surprise Entrant
          </DialogTitle>
          <DialogDescription>
            Add a wrestler not in the pre-configured list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="wrestler-name" className="text-sm font-medium">
              Wrestler Name
            </label>
            <Input
              id="wrestler-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter wrestler name..."
              className="min-h-[48px]"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleAdd}
            disabled={!name.trim()}
            className="min-h-[44px]"
          >
            Add to Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
