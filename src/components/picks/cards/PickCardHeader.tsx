import { type LucideIcon } from "lucide-react";

interface PickCardHeaderProps {
  icon: LucideIcon;
  label: string;
  title: string;
  pointsText?: string;
  counter?: string;
}

export function PickCardHeader({
  icon: Icon,
  label,
  title,
  pointsText,
  counter,
}: PickCardHeaderProps) {
  return (
    <div className="mb-4 shrink-0">
      {/* Top row: Icon + Label + Counter */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary shrink-0" />
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </span>
        </div>
        {counter && (
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {counter}
          </span>
        )}
      </div>
      
      {/* Title */}
      <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
        {title}
      </h2>
      
      {/* Points text */}
      {pointsText && (
        <div className="text-xs sm:text-sm text-primary font-semibold mt-1">
          {pointsText}
        </div>
      )}
    </div>
  );
}
