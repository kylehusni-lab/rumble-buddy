import { memo } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActiveWrestlerCardProps {
  number: number;
  wrestlerName: string;
  ownerName: string | null;
  duration: number; // in seconds
  eliminationCount: number;
  onEliminate: () => void;
  disabled?: boolean;
  isWinner?: boolean;
  showOwner?: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "Awaiting start";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const ActiveWrestlerCard = memo(function ActiveWrestlerCard({
  number,
  wrestlerName,
  ownerName,
  duration,
  eliminationCount,
  onEliminate,
  disabled = false,
  isWinner = false,
  showOwner = true,
}: ActiveWrestlerCardProps) {
  return (
    <div className={`bg-card border rounded-xl p-4 flex items-center justify-between gap-4 ${isWinner ? 'border-primary bg-primary/10' : 'border-border'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-lg">#{number}</span>
          <span className="font-semibold truncate">{wrestlerName}</span>
          {eliminationCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-destructive/20 text-destructive border-destructive/30">
              {eliminationCount} KO{eliminationCount > 1 ? 's' : ''}
            </Badge>
          )}
          {isWinner && (
            <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary border-primary/30">
              WINNER
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {showOwner && <>{ownerName || "Vacant"} - </>}
          {formatDuration(duration)}
        </div>
      </div>

      {isWinner ? (
        <div className="flex items-center gap-2 text-primary px-3 py-2">
          <Trophy size={20} className="text-primary" />
        </div>
      ) : (
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
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when important values change
  const prevFormatted = formatDuration(prevProps.duration);
  const nextFormatted = formatDuration(nextProps.duration);
  
  return (
    prevProps.number === nextProps.number &&
    prevProps.wrestlerName === nextProps.wrestlerName &&
    prevProps.ownerName === nextProps.ownerName &&
    prevFormatted === nextFormatted &&
    prevProps.eliminationCount === nextProps.eliminationCount &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isWinner === nextProps.isWinner &&
    prevProps.showOwner === nextProps.showOwner
  );
});
