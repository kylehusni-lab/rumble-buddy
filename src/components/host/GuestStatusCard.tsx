import { Check, Clock } from "lucide-react";

interface GuestStatusCardProps {
  displayName: string;
  picksCount: number;
  picksCompleted: boolean;
  totalPicks?: number;
}

export function GuestStatusCard({ 
  displayName, 
  picksCount, 
  picksCompleted,
  totalPicks = 7 
}: GuestStatusCardProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{displayName}</div>
          <div className="text-sm text-muted-foreground">
            {picksCompleted ? "Picks complete" : `${picksCount}/${totalPicks} picks`}
          </div>
        </div>
        {picksCompleted ? (
          <Check className="w-5 h-5 text-primary" />
        ) : (
          <Clock className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
