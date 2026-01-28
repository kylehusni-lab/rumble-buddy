import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, UserMinus, Trophy, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  type: "entry" | "elimination" | "result";
  message: string;
  timestamp: Date;
}

interface TvActivityTickerProps {
  events: ActivityEvent[];
  className?: string;
}

const EVENT_ICONS = {
  entry: Zap,
  elimination: UserMinus,
  result: Trophy,
};

export function TvActivityTicker({ events, className }: TvActivityTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    }
  }, [events.length, isPaused]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-lg border border-border",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-6 px-6 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => {
            const Icon = EVENT_ICONS[event.type];
            const isNewest = index === 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -50, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap shrink-0",
                  isNewest && "text-primary font-semibold",
                  !isNewest && "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    event.type === "entry" && "text-primary",
                    event.type === "elimination" && "text-destructive",
                    event.type === "result" && "text-success"
                  )}
                />
                <span className="text-sm">{event.message}</span>
                {index < events.length - 1 && (
                  <span className="text-muted-foreground/50 ml-4">•</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
