import React, { forwardRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAOS_PROPS, SCORING } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChaosPropsCardProps {
  title: string;
  gender: "mens" | "womens";
  values: Record<string, "YES" | "NO" | null>;
  onChange: (values: Record<string, "YES" | "NO" | null>) => void;
  disabled?: boolean;
}

export const ChaosPropsCard = memo(forwardRef<HTMLDivElement, ChaosPropsCardProps>(
  function ChaosPropsCard({ title, gender, values, onChange, disabled }, ref) {
  const handlePropChange = useCallback((propId: string, value: "YES" | "NO") => {
    if (disabled) return;
    const matchId = `${gender}_chaos_${propId}`;
    onChange({ ...values, [matchId]: value });
  }, [disabled, gender, onChange, values]);

  const answeredCount = Object.values(values).filter(v => v !== null && v !== undefined).length;
  const allAnswered = answeredCount === 6;

  return (
    <div ref={ref} className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col overflow-hidden h-full max-h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-6 h-6 text-primary" />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Chaos Props</div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {answeredCount}/6
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        +{SCORING.PROP_BET} pts each correct • 60 pts possible
      </div>

      {/* Props List (Scrollable) */}
      <ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {CHAOS_PROPS.map((prop) => {
            const matchId = `${gender}_chaos_${prop.id}`;
            const value = values[matchId];
            
            return (
              <div key={prop.id} className="space-y-2">
                <div>
                  <div className="font-bold text-sm text-foreground">{prop.title}</div>
                  <div className="text-xs text-muted-foreground">{prop.question}</div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handlePropChange(prop.id, "YES")}
                    disabled={disabled}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all text-sm",
                      "flex items-center justify-center gap-2",
                      value === "YES"
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground",
                      disabled && "opacity-60 cursor-not-allowed"
                    )}
                    whileTap={!disabled ? { scale: 0.98 } : undefined}
                  >
                    {value === "YES" && <Check className="w-3 h-3" />}
                    YES
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handlePropChange(prop.id, "NO")}
                    disabled={disabled}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all text-sm",
                      "flex items-center justify-center gap-2",
                      value === "NO"
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground",
                      disabled && "opacity-60 cursor-not-allowed"
                    )}
                    whileTap={!disabled ? { scale: 0.98 } : undefined}
                  >
                    {value === "NO" && <Check className="w-3 h-3" />}
                    NO
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
  }
));
