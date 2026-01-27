import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveWrestlerCardProps {
  number: number;
  wrestlerName: string;
  ownerName: string | null;
  duration: number; // in seconds
  onEliminate: () => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ActiveWrestlerCard({
  number,
  wrestlerName,
  ownerName,
  duration,
  onEliminate,
  disabled = false,
}: ActiveWrestlerCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-lg">#{number}</span>
          <span className="font-semibold truncate">{wrestlerName}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {ownerName || "Vacant"} • {formatDuration(duration)}
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="min-h-[44px] flex-shrink-0"
        onClick={onEliminate}
        disabled={disabled}
      >
        <X size={16} className="mr-1" />
        Eliminate
      </Button>
    </div>
  );
}
