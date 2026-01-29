import { cn } from "@/lib/utils";
import { getWrestlerImageUrl } from "@/lib/wrestler-data";

interface TvNumberCellProps {
  number: number;
  wrestlerName: string | null;
  ownerName: string | null;
  ownerColor: string | null; // hex color like #e91e63
  ownerTextColor?: string; // 'black' or 'white'
  status: "pending" | "active" | "eliminated" | "current";
  isAssigned: boolean;
}

export function TvNumberCell({
  number,
  wrestlerName,
  ownerName,
  ownerColor,
  ownerTextColor = "black",
  status,
  isAssigned,
}: TvNumberCellProps) {
  const imageUrl = wrestlerName ? getWrestlerImageUrl(wrestlerName) : null;

  // State: Empty unassigned (no player owns this number)
  if (!isAssigned && status === "pending") {
    return (
      <div 
        className="relative aspect-square rounded-xl flex items-center justify-center"
        style={{
          border: "2px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <span 
          className="font-light"
          style={{ 
            fontSize: "36px", 
            color: "rgba(255,255,255,0.15)",
          }}
        >
          {number}
        </span>
      </div>
    );
  }

  // State: Empty but assigned to player (wrestler not yet revealed)
  if (status === "pending" && isAssigned) {
    return (
      <div 
        className="relative aspect-square rounded-xl flex flex-col overflow-hidden"
        style={{
          border: ownerColor ? `3px solid ${ownerColor}` : "2px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Large centered number */}
        <div className="flex-1 flex items-center justify-center">
          <span 
            className="font-light"
            style={{ 
              fontSize: "36px", 
              color: "rgba(255,255,255,0.15)",
            }}
          >
            {number}
          </span>
        </div>

        {/* Owner banner */}
        {ownerName && ownerColor && (
          <div 
            className="w-full py-1.5 px-2 text-center"
            style={{ background: ownerColor }}
          >
            <span 
              className="text-xs font-bold uppercase tracking-wide"
              style={{ 
                color: ownerTextColor,
                letterSpacing: "0.5px",
              }}
            >
              {ownerName}
            </span>
          </div>
        )}
      </div>
    );
  }

  // States: Active, Current, or Eliminated (wrestler revealed)
  const isCurrent = status === "current";
  const isEliminated = status === "eliminated";

  return (
    <div 
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden transition-all duration-300",
        isCurrent && "animate-current-entrant-glow"
      )}
      style={{
        border: isCurrent 
          ? "3px solid #f5c518" 
          : ownerColor 
            ? `3px solid ${ownerColor}` 
            : "2px solid rgba(255,255,255,0.1)",
        opacity: isEliminated ? 0.6 : 1,
      }}
    >
      {/* Entry number badge (top-left) */}
      <div 
        className="absolute top-1.5 left-2 px-1.5 py-0.5 rounded z-20"
        style={{
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <span 
          className="text-xs font-semibold"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {number}
        </span>
      </div>

      {/* Wrestler image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={wrestlerName || ""}
          className={cn(
            "absolute inset-0 w-full h-full object-cover object-top",
            isEliminated && "grayscale"
          )}
        />
      )}

      {/* Eliminated X overlay */}
      {isEliminated && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <svg 
            viewBox="0 0 100 100" 
            className="w-[60%] h-[60%]"
          >
            <line 
              x1="15" y1="15" x2="85" y2="85" 
              stroke="#ff4444" 
              strokeWidth="8" 
              strokeLinecap="round"
            />
            <line 
              x1="85" y1="15" x2="15" y2="85" 
              stroke="#ff4444" 
              strokeWidth="8" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Owner banner (bottom) */}
      {ownerName && ownerColor && (
        <div 
          className="absolute bottom-0 inset-x-0 py-1.5 px-2 text-center z-20"
          style={{ 
            background: ownerColor,
            opacity: isEliminated ? 0.5 : 1,
          }}
        >
          <span 
            className="text-xs font-bold uppercase"
            style={{ 
              color: ownerTextColor,
              letterSpacing: "0.5px",
            }}
          >
            {ownerName}
          </span>
        </div>
      )}
    </div>
  );
}
