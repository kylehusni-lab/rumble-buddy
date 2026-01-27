import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES } from "@/lib/constants";

interface MatchResult {
  match_id: string;
  result: string;
}

interface ActiveMatchDisplayProps {
  matchResults: MatchResult[];
}

export function ActiveMatchDisplay({ matchResults }: ActiveMatchDisplayProps) {
  // Find the current active undercard match (one without a result yet)
  const activeMatch = useMemo(() => {
    const completedMatchIds = new Set(matchResults.map(r => r.match_id));
    return UNDERCARD_MATCHES.find(m => !completedMatchIds.has(m.id));
  }, [matchResults]);

  // If no active undercard match, show nothing (Rumble will take over)
  if (!activeMatch) {
    return null;
  }

  const [wrestler1, wrestler2] = activeMatch.options;

  return (
    <motion.div
      className="bg-card/50 border border-border rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-bold uppercase tracking-wider">Live</span>
        </div>
        <span className="text-sm text-muted-foreground">Undercard Match</span>
      </div>

      {/* Match display */}
      <div className="p-8">
        <div className="flex items-center justify-center gap-8 md:gap-16">
          {/* Wrestler 1 */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WrestlerImage
              name={wrestler1}
              size="lg"
              className="border-4 border-primary/50 shadow-lg shadow-primary/20"
            />
            <span className="text-2xl font-bold text-center">{wrestler1}</span>
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
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WrestlerImage
              name={wrestler2}
              size="lg"
              className="border-4 border-primary/50 shadow-lg shadow-primary/20"
            />
            <span className="text-2xl font-bold text-center">{wrestler2}</span>
          </motion.div>
        </div>

        {/* Match title */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold text-muted-foreground">{activeMatch.title}</h3>
        </motion.div>
      </div>
    </motion.div>
  );
}
