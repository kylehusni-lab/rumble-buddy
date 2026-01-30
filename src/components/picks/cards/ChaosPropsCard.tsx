import React, { forwardRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAOS_PROPS, SCORING } from "@/lib/constants";
import { PickCardHeader } from "./PickCardHeader";

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

  return (
    <div ref={ref} className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border flex flex-col overflow-hidden h-full">
      {/* Unified Header */}
      <PickCardHeader
        icon={Zap}
        label="Chaos Props"
        title={title}
        pointsText={`+${SCORING.PROP_BET} pts each correct • ${CHAOS_PROPS.length * SCORING.PROP_BET} pts possible`}
        counter={`${answeredCount}/${CHAOS_PROPS.length}`}
      />

      {/* Props List (Scrollable) */}
      <div className="flex-1 min-h-0 -mx-2 px-2 overflow-y-auto">
        <div className="space-y-3 pb-4">
          {CHAOS_PROPS.map((prop) => {
            const matchId = `${gender}_chaos_${prop.id}`;
            const value = values[matchId];
            
            return (
              <div key={prop.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                {/* Prop Info - Left side */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground leading-tight">{prop.title}</div>
                  <div className="text-xs text-muted-foreground leading-tight line-clamp-2">{prop.question}</div>
                </div>

                {/* YES/NO Buttons - Right side, compact */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <motion.button
                    onClick={() => handlePropChange(prop.id, "YES")}
                    disabled={disabled}
                    className={cn(
                      "py-2 px-3 rounded-lg border-2 font-semibold transition-all text-xs",
                      "flex items-center justify-center gap-1",
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
                      "py-2 px-3 rounded-lg border-2 font-semibold transition-all text-xs",
                      "flex items-center justify-center gap-1",
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
      </div>
    </div>
  );
  }
));
