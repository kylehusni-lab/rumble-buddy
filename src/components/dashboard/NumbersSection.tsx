import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown, Hash } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [mensOpen, setMensOpen] = useState(true);
  const [womensOpen, setWomensOpen] = useState(true);

  if (mensNumbers.length === 0 && womensNumbers.length === 0) {
    return (
      <div className="card-gradient border border-border rounded-2xl shadow-premium p-8 text-center ring-rope-texture">
        <p className="text-muted-foreground">Numbers will appear here once the event starts.</p>
      </div>
    );
  }

  const mensActiveCount = mensNumbers.filter(n => getNumberStatus(n) === "active").length;
  const womensActiveCount = womensNumbers.filter(n => getNumberStatus(n) === "active").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {mensNumbers.length > 0 && (
        <Collapsible open={mensOpen} onOpenChange={setMensOpen}>
          <div className="card-gradient border border-border/80 rounded-2xl shadow-premium overflow-hidden">
            <CollapsibleTrigger className="w-full section-header ring-rope-texture flex items-center justify-between hover:bg-muted/5 transition-colors">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Hash size={14} className="text-primary" />
                Men's Rumble
              </h3>
              <div className="flex items-center gap-2">
                {mensActiveCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {mensActiveCount} active
                  </span>
                )}
                <ChevronDown 
                  size={16} 
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    mensOpen && "rotate-180"
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 grid grid-cols-2 gap-3">
                {mensNumbers.map((num) => (
                  <NumberCard key={`mens-${num.number}`} num={num} />
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {womensNumbers.length > 0 && (
        <Collapsible open={womensOpen} onOpenChange={setWomensOpen}>
          <div className="card-gradient border border-border/80 rounded-2xl shadow-premium overflow-hidden">
            <CollapsibleTrigger className="w-full section-header ring-rope-texture flex items-center justify-between hover:bg-muted/5 transition-colors">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Hash size={14} className="text-primary" />
                Women's Rumble
              </h3>
              <div className="flex items-center gap-2">
                {womensActiveCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {womensActiveCount} active
                  </span>
                )}
                <ChevronDown 
                  size={16} 
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    womensOpen && "rotate-180"
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 grid grid-cols-2 gap-3">
                {womensNumbers.map((num) => (
                  <NumberCard key={`womens-${num.number}`} num={num} />
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </motion.div>
  );
}
