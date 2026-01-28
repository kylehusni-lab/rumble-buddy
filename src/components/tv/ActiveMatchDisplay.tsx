import { useMemo } from "react";
import { motion } from "framer-motion";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES } from "@/lib/constants";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

  // Calculate pick distribution
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
      {/* Status bar */}
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
        <span className="text-sm text-muted-foreground">Undercard Match</span>
      </div>

      {/* Match display */}
      <div className="p-8">
        <div className="flex items-center justify-center gap-8 md:gap-16">
          {/* Wrestler 1 */}
          <motion.div
            className="flex flex-col items-center gap-4 min-w-[200px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <WrestlerImage
                name={wrestler1}
                size="lg"
                className={`border-4 shadow-lg ${
                  result === wrestler1
                    ? "border-success shadow-success/30"
                    : result
                      ? "border-muted opacity-50"
                      : "border-primary/50 shadow-primary/20"
                }`}
              />
              {result === wrestler1 && (
                <div className="absolute -top-2 -right-2 bg-success rounded-full p-1">
                  <Check className="w-5 h-5 text-success-foreground" />
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

          {/* Wrestler 2 */}
          <motion.div
            className="flex flex-col items-center gap-4 min-w-[200px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <WrestlerImage
                name={wrestler2}
                size="lg"
                className={`border-4 shadow-lg ${
                  result === wrestler2
                    ? "border-success shadow-success/30"
                    : result
                      ? "border-muted opacity-50"
                      : "border-primary/50 shadow-primary/20"
                }`}
              />
              {result === wrestler2 && (
                <div className="absolute -top-2 -right-2 bg-success rounded-full p-1">
                  <Check className="w-5 h-5 text-success-foreground" />
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

        {/* 3D Visual distribution bar */}
        {pickStats.total > 0 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Player names above bars */}
            <div className="flex justify-between mb-3 text-sm text-muted-foreground">
              <span>{pickStats.wrestler1.players.join(", ") || "No picks"}</span>
              <span>{pickStats.wrestler2.players.join(", ") || "No picks"}</span>
            </div>
            
            {/* 3D Progress bar container */}
            <div className="relative h-8 rounded-full overflow-hidden bg-muted/30 shadow-inner">
              {/* Primary side (wrestler 1) - gold gradient with 3D effect */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-b from-primary via-primary to-primary/70 transition-all duration-700 ease-out"
                style={{ 
                  width: `${pickStats.wrestler1.percentage}%`,
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 2px 0 8px rgba(0,0,0,0.3)'
                }}
              >
                {/* Inner highlight for 3D effect */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
              </div>
              
              {/* Secondary side (wrestler 2) - purple gradient with 3D effect */}
              <div 
                className="absolute inset-y-0 right-0 bg-gradient-to-b from-secondary via-secondary to-secondary/70 transition-all duration-700 ease-out"
                style={{ 
                  width: `${pickStats.wrestler2.percentage}%`,
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), -2px 0 8px rgba(0,0,0,0.3)'
                }}
              >
                {/* Inner highlight for 3D effect */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
