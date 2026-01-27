import { memo } from "react";
import { WrestlerImage } from "./WrestlerImage";
import { cn } from "@/lib/utils";
import type { TvPhotoSize } from "@/hooks/useTvScale";

interface NumberCellProps {
  number: number;
  wrestlerName: string | null;
  ownerInitials: string;
  ownerName?: string;
  status: "pending" | "active" | "eliminated";
  delay?: number;
  /** Scale factor from useTvScale (1.0-2.0) */
  scale?: number;
  /** Photo size variant from useTvScale */
  photoSize?: TvPhotoSize;
}

export const NumberCell = memo(function NumberCell({
  number,
  wrestlerName,
  ownerInitials,
  status,
  scale = 1.0,
  photoSize = "sm",
}: NumberCellProps) {
  // Get first name only for display
  const firstName = wrestlerName?.split(" ")[0] || "";

  // Dynamic font sizes based on scale
  const nameSize = scale >= 1.5 ? "text-sm" : scale >= 1.25 ? "text-xs" : "text-[10px]";
  const initialsSize = scale >= 1.5 ? "text-xs" : scale >= 1.25 ? "text-[11px]" : "text-[9px]";
  const badgeSize = scale >= 1.5 ? "w-9 h-9 text-base" : scale >= 1.25 ? "w-8 h-8 text-sm" : "w-7 h-7 text-sm";
  const pendingNumSize = scale >= 1.5 ? "text-4xl" : scale >= 1.25 ? "text-3xl" : "text-2xl";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl transition-all duration-300 p-2",
        "aspect-square border-2 animate-scale-in",
        status === "active" && "tv-number-cell-active",
        status === "eliminated" && "tv-number-cell-eliminated",
        status === "pending" && "tv-number-cell-pending"
      )}
    >
      {/* Number badge - scales with viewport */}
      <div className={cn(
        "absolute -top-2 -left-2 rounded-full flex items-center justify-center font-bold z-10",
        badgeSize,
        status === "active" && "bg-success text-success-foreground",
        status === "eliminated" && "bg-muted text-muted-foreground",
        status === "pending" && "bg-card text-foreground border border-border"
      )}>
        {number}
      </div>

      {/* Wrestler photo - only show if not pending */}
      {status !== "pending" && wrestlerName && (
        <WrestlerImage
          name={wrestlerName}
          size={photoSize}
          eliminated={status === "eliminated"}
          className={cn(
            "mb-1",
            status === "active" && "ring-2 ring-success ring-offset-1 ring-offset-background"
          )}
        />
      )}

      {/* Wrestler name (first name only) - scales with viewport */}
      {status !== "pending" && wrestlerName && (
        <div className={cn(
          "font-medium text-center leading-tight truncate w-full",
          nameSize,
          status === "eliminated" && "text-muted-foreground line-through"
        )}>
          {firstName}
        </div>
      )}

      {/* Owner initials - scales with viewport */}
      {status !== "pending" && (
        <div className={cn(
          "font-bold mt-0.5 px-1.5 py-0.5 rounded bg-card/80",
          initialsSize,
          status === "active" ? "text-primary" : "text-muted-foreground"
        )}>
          {ownerInitials}
        </div>
      )}

      {/* Pending state - show just number centered */}
      {status === "pending" && (
        <div className={cn("font-bold text-muted-foreground", pendingNumSize)}>
          {number}
        </div>
      )}

      {/* Eliminated X overlay */}
      {status === "eliminated" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-0.5 bg-destructive rotate-45 opacity-60" />
          <div className="absolute w-full h-0.5 bg-destructive -rotate-45 opacity-60" />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render when relevant props change
  return (
    prevProps.number === nextProps.number &&
    prevProps.wrestlerName === nextProps.wrestlerName &&
    prevProps.status === nextProps.status &&
    prevProps.ownerInitials === nextProps.ownerInitials &&
    prevProps.scale === nextProps.scale &&
    prevProps.photoSize === nextProps.photoSize
  );
});
