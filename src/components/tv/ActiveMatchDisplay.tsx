import { useMemo } from "react";
import { motion } from "framer-motion";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
import { Check } from "lucide-react";

// Player color palette
const PLAYER_COLORS = [
  { hex: "#e91e63" },  // Pink
  { hex: "#f44336" },  // Red
  { hex: "#ff9800" },  // Orange
  { hex: "#ffc107" },  // Amber
  { hex: "#4caf50" },  // Green
  { hex: "#00bcd4" },  // Cyan
  { hex: "#2196f3" },  // Blue
  { hex: "#9c27b0" },  // Purple
  { hex: "#795548" },  // Brown
  { hex: "#607d8b" },  // Blue Gray
];

interface MatchResult {
  match_id: string;
  result: string;
}

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface Pick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface ActiveMatchDisplayProps {
  match: typeof UNDERCARD_MATCHES[number];
  matchResults: MatchResult[];
  players: Player[];
  picks: Pick[];
}

export function ActiveMatchDisplay({ match, matchResults, players, picks }: ActiveMatchDisplayProps) {
  const result = useMemo(() => {
    return matchResults.find(r => r.match_id === match.id)?.result || null;
  }, [match.id, matchResults]);

  const [wrestler1, wrestler2] = match.options;
  const isComplete = !!result;

  // Get player color by player name
  const getPlayerColorByName = (displayName: string): string => {
    const index = players.findIndex(p => p.display_name === displayName);
    if (index === -1) return "#888";
    return PLAYER_COLORS[index % PLAYER_COLORS.length].hex;
  };

  // Calculate pick distribution with player colors
  const pickStats = useMemo(() => {
    const matchPicks = picks.filter(p => p.match_id === match.id);
    const totalPicks = matchPicks.length;
    
    const wrestler1Picks = matchPicks.filter(p => p.prediction === wrestler1);
    const wrestler2Picks = matchPicks.filter(p => p.prediction === wrestler2);
    
    return {
      wrestler1: {
        count: wrestler1Picks.length,
        percentage: totalPicks > 0 ? Math.round((wrestler1Picks.length / totalPicks) * 100) : 0,
        players: wrestler1Picks.map(p => 
          players.find(pl => pl.id === p.player_id)?.display_name || "Unknown"
        ),
      },
      wrestler2: {
        count: wrestler2Picks.length,
        percentage: totalPicks > 0 ? Math.round((wrestler2Picks.length / totalPicks) * 100) : 0,
        players: wrestler2Picks.map(p => 
          players.find(pl => pl.id === p.player_id)?.display_name || "Unknown"
        ),
      },
      total: totalPicks,
    };
  }, [match.id, picks, players, wrestler1, wrestler2]);

  return (
    <motion.div
      className="bg-card/50 border border-border rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm font-bold uppercase tracking-wider text-success">Complete</span>
            </>
          ) : (
            <>
              <motion.div
                className="w-3 h-3 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-bold uppercase tracking-wider">Live</span>
            </>
          )}
        </div>
        {/* Points indicator */}
        <span className="text-sm text-muted-foreground">
          Worth {SCORING.UNDERCARD_WINNER} pts
        </span>
      </div>

      {/* Match display */}
      <div className="p-8">
        <div className="flex items-center justify-center gap-8 md:gap-16">
          {/* Wrestler 1 - Larger image */}
          <motion.div
            className="flex flex-col items-center gap-4 min-w-[220px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <WrestlerImage
                name={wrestler1}
                size="tv"
                className={`border-4 shadow-lg ${
                  result === wrestler1
                    ? "border-success shadow-success/30"
                    : result
                      ? "border-muted opacity-50"
                      : "border-primary/50 shadow-primary/20"
                }`}
              />
              {result === wrestler1 && (
                <div className="absolute -top-2 -right-2 bg-success rounded-full p-1.5">
                  <Check className="w-6 h-6 text-success-foreground" />
                </div>
              )}
            </div>
            <span className={`text-2xl font-bold text-center ${result && result !== wrestler1 ? "opacity-50" : ""}`}>
              {wrestler1}
            </span>
            
            {/* Pick percentage */}
            <div className="text-3xl font-bold text-primary">
              {pickStats.wrestler1.percentage}%
            </div>
          </motion.div>

          {/* VS graphic */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <span className="text-5xl font-black text-primary drop-shadow-lg">VS</span>
          </motion.div>

          {/* Wrestler 2 - Larger image */}
          <motion.div
            className="flex flex-col items-center gap-4 min-w-[220px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <WrestlerImage
                name={wrestler2}
                size="tv"
                className={`border-4 shadow-lg ${
                  result === wrestler2
                    ? "border-success shadow-success/30"
                    : result
                      ? "border-muted opacity-50"
                      : "border-primary/50 shadow-primary/20"
                }`}
              />
              {result === wrestler2 && (
                <div className="absolute -top-2 -right-2 bg-success rounded-full p-1.5">
                  <Check className="w-6 h-6 text-success-foreground" />
                </div>
              )}
            </div>
            <span className={`text-2xl font-bold text-center ${result && result !== wrestler2 ? "opacity-50" : ""}`}>
              {wrestler2}
            </span>
            
            {/* Pick percentage */}
            <div className="text-3xl font-bold text-primary">
              {pickStats.wrestler2.percentage}%
            </div>
          </motion.div>
        </div>

        {/* Player-colored prediction bar */}
        {pickStats.total > 0 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Player names above bars - colored by player */}
            <div className="flex justify-between mb-3">
              <div className="flex gap-3 flex-wrap">
                {pickStats.wrestler1.players.map((name, i) => (
                  <span 
                    key={i}
                    className="text-sm font-medium"
                    style={{ color: getPlayerColorByName(name) }}
                  >
                    {name}
                  </span>
                ))}
                {pickStats.wrestler1.players.length === 0 && (
                  <span className="text-sm text-muted-foreground">No picks</span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap justify-end">
                {pickStats.wrestler2.players.map((name, i) => (
                  <span 
                    key={i}
                    className="text-sm font-medium"
                    style={{ color: getPlayerColorByName(name) }}
                  >
                    {name}
                  </span>
                ))}
                {pickStats.wrestler2.players.length === 0 && (
                  <span className="text-sm text-muted-foreground">No picks</span>
                )}
              </div>
            </div>
            
            {/* Stacked bar with player colors */}
            <div className="relative h-8 rounded-full overflow-hidden bg-muted/30 shadow-inner flex">
              {/* Wrestler 1 side - each player gets their color segment */}
              {pickStats.wrestler1.players.map((name, i) => (
                <div 
                  key={`w1-${i}`}
                  className="h-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${pickStats.wrestler1.percentage / pickStats.wrestler1.players.length}%`,
                    backgroundColor: getPlayerColorByName(name),
                  }}
                />
              ))}
              
              {/* Spacer if there's a gap */}
              {pickStats.wrestler1.percentage > 0 && pickStats.wrestler2.percentage > 0 && (
                <div className="w-0.5 h-full bg-background/50" />
              )}
              
              {/* Wrestler 2 side - each player gets their color segment */}
              <div className="flex-1 flex justify-end">
                {pickStats.wrestler2.players.map((name, i) => (
                  <div 
                    key={`w2-${i}`}
                    className="h-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${(pickStats.wrestler2.percentage / pickStats.wrestler2.players.length) * (100 / (pickStats.wrestler1.percentage + pickStats.wrestler2.percentage)) * 100}%`,
                      backgroundColor: getPlayerColorByName(name),
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
