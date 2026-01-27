import { motion } from "framer-motion";
import { X } from "lucide-react";

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

function NumberCard({ num, type }: { num: RumbleNumber; type: "mens" | "womens" }) {
  const status = getNumberStatus(num);
  
  return (
    <div
      className={`p-3 rounded-xl border ${
        status === "active"
          ? "bg-primary/20 border-primary active-pulse"
          : status === "eliminated"
          ? "bg-destructive/20 border-destructive opacity-60"
          : "bg-muted border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg">#{num.number}</span>
        {status === "active" && <span className="text-xs text-primary font-semibold">ACTIVE</span>}
        {status === "eliminated" && <X size={16} className="text-destructive" />}
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {num.wrestler_name || "Not yet entered"}
      </div>
    </div>
  );
}

export function NumbersSection({ mensNumbers, womensNumbers }: NumbersSectionProps) {
  if (mensNumbers.length === 0 && womensNumbers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Numbers will appear here once the event starts.</p>
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
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <span>🧔</span> Men's Rumble
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {mensNumbers.map((num) => (
              <NumberCard key={`mens-${num.number}`} num={num} type="mens" />
            ))}
          </div>
        </div>
      )}

      {womensNumbers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <span>👩</span> Women's Rumble
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {womensNumbers.map((num) => (
              <NumberCard key={`womens-${num.number}`} num={num} type="womens" />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
