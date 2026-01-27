import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RumbleNumber {
  rumble_type: string;
  number: number;
  wrestler_name: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
}

interface NumbersSectionProps {
  mensNumbers: RumbleNumber[];
  womensNumbers: RumbleNumber[];
}

function getNumberStatus(num: RumbleNumber): "pending" | "active" | "eliminated" {
  if (!num.entry_timestamp) return "pending";
  if (num.elimination_timestamp) return "eliminated";
  return "active";
}

function NumberCard({ num }: { num: RumbleNumber }) {
  const status = getNumberStatus(num);
  
  return (
    <div className={cn(
      "relative p-4 rounded-2xl border-2 transition-all duration-300 shadow-premium overflow-hidden",
      status === "active" && "card-gradient-gold border-primary/50 status-active-glow",
      status === "eliminated" && "card-gradient border-destructive/30 opacity-60",
      status === "pending" && "card-gradient border-border"
    )}>
      {/* Ring rope texture overlay */}
      <div className="absolute inset-0 ring-rope-texture pointer-events-none" />
      
      <div className="relative z-10">
        {/* Number badge */}
        <div className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg mb-2",
          status === "active" && "bg-primary text-primary-foreground",
          status === "eliminated" && "bg-muted text-muted-foreground",
          status === "pending" && "bg-muted/50 text-muted-foreground border border-border"
        )}>
          {num.number}
        </div>
        
        {/* Status label */}
        {status === "active" && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold uppercase tracking-wide">
            Active
          </div>
        )}
        
        {/* Wrestler name */}
        <div className={cn(
          "text-sm font-medium truncate",
          status === "active" && "text-foreground",
          status === "eliminated" && "text-muted-foreground line-through",
          status === "pending" && "text-muted-foreground italic"
        )}>
          {num.wrestler_name || "Awaiting entrant..."}
        </div>
      </div>
      
      {/* Eliminated X overlay */}
      {status === "eliminated" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <X size={48} className="text-destructive/30" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export function NumbersSection({ mensNumbers, womensNumbers }: NumbersSectionProps) {
  if (mensNumbers.length === 0 && womensNumbers.length === 0) {
    return (
      <div className="card-gradient border border-border rounded-2xl shadow-premium p-8 text-center ring-rope-texture">
        <p className="text-muted-foreground">Numbers will appear here once the event starts.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {mensNumbers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
            <span className="text-base">🧔</span> 
            <span className="uppercase tracking-wide">Men's Rumble</span>
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {mensNumbers.filter(n => getNumberStatus(n) === "active").length} active
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {mensNumbers.map((num) => (
              <NumberCard key={`mens-${num.number}`} num={num} />
            ))}
          </div>
        </div>
      )}

      {womensNumbers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
            <span className="text-base">👩</span> 
            <span className="uppercase tracking-wide">Women's Rumble</span>
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {womensNumbers.filter(n => getNumberStatus(n) === "active").length} active
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {womensNumbers.map((num) => (
              <NumberCard key={`womens-${num.number}`} num={num} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
