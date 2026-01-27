import { motion } from "framer-motion";
import { WrestlerImage } from "./WrestlerImage";
import { cn } from "@/lib/utils";

interface NumberCellProps {
  number: number;
  wrestlerName: string | null;
  ownerInitials: string;
  ownerName?: string;
  status: "pending" | "active" | "eliminated";
  delay?: number;
}

export function NumberCell({
  number,
  wrestlerName,
  ownerInitials,
  status,
  delay = 0,
}: NumberCellProps) {
  // Get first name only for display
  const firstName = wrestlerName?.split(" ")[0] || "";

  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl transition-all duration-300 p-2",
        "aspect-[4/5] border-2",
        status === "active" && "tv-number-cell-active",
        status === "eliminated" && "tv-number-cell-eliminated",
        status === "pending" && "tv-number-cell-pending"
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay * 0.02 }}
    >
      {/* Number badge */}
      <div className={cn(
        "absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-10",
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
          size="sm"
          eliminated={status === "eliminated"}
          className={cn(
            "mb-1",
            status === "active" && "ring-2 ring-success ring-offset-1 ring-offset-background"
          )}
        />
      )}

      {/* Wrestler name (first name only) */}
      {status !== "pending" && wrestlerName && (
        <div className={cn(
          "text-[10px] font-medium text-center leading-tight truncate w-full",
          status === "eliminated" && "text-muted-foreground line-through"
        )}>
          {firstName}
        </div>
      )}

      {/* Owner initials */}
      {status !== "pending" && (
        <div className={cn(
          "text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded bg-card/80",
          status === "active" ? "text-primary" : "text-muted-foreground"
        )}>
          {ownerInitials}
        </div>
      )}

      {/* Pending state - show just number centered */}
      {status === "pending" && (
        <div className="text-2xl font-bold text-muted-foreground">
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
    </motion.div>
  );
}
