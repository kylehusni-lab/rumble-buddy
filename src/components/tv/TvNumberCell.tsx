import { cn } from "@/lib/utils";
import { getWrestlerImageUrl } from "@/lib/wrestler-data";

interface PlayerColor {
  bg: string;
  border: string;
}

interface TvNumberCellProps {
  number: number;
  wrestlerName: string | null;
  playerColor: PlayerColor | null;
  status: "pending" | "active" | "eliminated";
  scale?: number;
}

export function TvNumberCell({
  number,
  wrestlerName,
  playerColor,
  status,
  scale = 1.0,
}: TvNumberCellProps) {
  const firstName = wrestlerName?.split(" ")[0] || "";
  const imageUrl = wrestlerName ? getWrestlerImageUrl(wrestlerName) : null;

  // Pending state - just show number
  if (status === "pending") {
    return (
      <div className="relative aspect-square rounded-xl bg-muted/30 border-2 border-muted flex items-center justify-center">
        <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-sm font-bold z-10">
          {number}
        </div>
        <span className="text-3xl font-bold text-muted-foreground">{number}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
        status === "active" && "border-primary animate-winner-glow",
        status === "eliminated" && "border-muted opacity-60"
      )}
    >
      {/* Number badge */}
      <div
        className={cn(
          "absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-20",
          status === "active" && "bg-primary text-primary-foreground",
          status === "eliminated" && "bg-muted text-muted-foreground"
        )}
      >
        {number}
      </div>

      {/* Full-frame wrestler image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={wrestlerName || ""}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            status === "eliminated" && "grayscale"
          )}
        />
      )}

      {/* Bottom banner with name + player color */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2 px-2 z-10">
        <div className="flex items-center gap-1.5">
          {/* Player color dot */}
          {playerColor && (
            <div className={cn("w-3 h-3 rounded-full shrink-0", playerColor.bg)} />
          )}
          <span className="text-white text-xs font-semibold truncate">
            {firstName}
          </span>
        </div>
      </div>

      {/* Eliminated X overlay */}
      {status === "eliminated" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-full h-0.5 bg-white/60 rotate-45 absolute" />
          <div className="w-full h-0.5 bg-white/60 -rotate-45 absolute" />
        </div>
      )}
    </div>
  );
}
