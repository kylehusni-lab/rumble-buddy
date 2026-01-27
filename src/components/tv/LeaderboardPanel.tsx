import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  display_name: string;
  points: number;
}

type LeaderboardState = "expanded" | "collapsed" | "hidden";

interface LeaderboardPanelProps {
  players: Player[];
}

export function LeaderboardPanel({ players }: LeaderboardPanelProps) {
  const [state, setState] = useState<LeaderboardState>(() => {
    const stored = localStorage.getItem("tv-leaderboard-state");
    return (stored as LeaderboardState) || "expanded";
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem("tv-leaderboard-state", state);
  }, [state]);

  const toggleCollapse = () => {
    setState(prev => prev === "collapsed" ? "expanded" : "collapsed");
  };

  const displayedPlayers = state === "collapsed" ? players.slice(0, 3) : players.slice(0, 10);

  if (state === "hidden") {
    return (
      <button
        onClick={() => setState("expanded")}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-card/90 border border-border border-r-0 rounded-l-lg px-2 py-4 hover:bg-card transition-colors"
      >
        <ChevronLeft className="text-primary mb-2" size={20} />
        <span className="text-primary font-bold text-xs [writing-mode:vertical-lr] rotate-180">
          Leaderboard
        </span>
      </button>
    );
  }

  return (
    <motion.div
      className={cn(
        "bg-card border border-border rounded-2xl sticky top-8 transition-all duration-300",
        state === "collapsed" ? "p-3" : "p-4"
      )}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-primary" size={state === "collapsed" ? 20 : 24} />
          <h2 className={cn("font-bold", state === "collapsed" ? "text-lg" : "text-xl")}>
            {state === "collapsed" ? "Top 3" : "Leaderboard"}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleCollapse}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            title={state === "collapsed" ? "Expand" : "Collapse"}
          >
            {state === "collapsed" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={() => setState("hidden")}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            title="Hide"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl",
                index === 0 && "bg-primary/20 border border-primary",
                index === 1 && "bg-muted/80",
                index === 2 && "bg-muted/60",
                index > 2 && "bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  index === 0 && "tv-rank-gold",
                  index === 1 && "tv-rank-silver",
                  index === 2 && "tv-rank-bronze",
                  index > 2 && "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  "font-medium truncate max-w-[80px] text-sm",
                  state === "collapsed" && "max-w-[60px]"
                )}>
                  {player.display_name}
                </span>
              </div>
              <span className={cn(
                "font-bold",
                index === 0 && "text-primary text-xl",
                index > 0 && "text-foreground"
              )}>
                {player.points}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show count if collapsed */}
      {state === "collapsed" && players.length > 3 && (
        <button
          onClick={() => setState("expanded")}
          className="w-full mt-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          +{players.length - 3} more players
        </button>
      )}
    </motion.div>
  );
}
