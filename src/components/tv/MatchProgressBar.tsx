import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { CARD_CONFIG, UNDERCARD_MATCHES } from "@/lib/constants";

interface MatchResult {
  match_id: string;
  result: string;
}

interface MatchProgressBarProps {
  matchResults: MatchResult[];
}

export function MatchProgressBar({ matchResults }: MatchProgressBarProps) {
  const totalMatches = CARD_CONFIG.length;
  
  const { completedCount, nextMatch } = useMemo(() => {
    // Count unique match_ids that have results
    const completedMatchIds = new Set(matchResults.map(r => r.match_id));
    
    // Find the first card without a result
    const nextCard = CARD_CONFIG.find(card => !completedMatchIds.has(card.id));
    
    // Count completed (only count the main card items, not individual props)
    const mainCardIds = CARD_CONFIG.map(c => c.id);
    const completed = mainCardIds.filter(id => completedMatchIds.has(id)).length;
    
    return {
      completedCount: completed,
      nextMatch: nextCard,
    };
  }, [matchResults]);

  const progressPercent = Math.round((completedCount / totalMatches) * 100);

  // Get display title for next match
  const nextMatchTitle = nextMatch?.title ?? null;

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-primary" size={20} />
          <span className="text-sm font-medium text-muted-foreground">
            Matches: <span className="text-foreground font-bold">{completedCount}</span> of {totalMatches} Complete
          </span>
        </div>
        <span className="text-sm font-bold text-primary">{progressPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Up Next section */}
      {nextMatch && nextMatchTitle && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Up Next:</span>
          <span className="text-sm font-medium text-foreground">{nextMatchTitle}</span>
        </div>
      )}

      {/* All complete state */}
      {!nextMatch && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-sm font-bold text-success">🏆 All matches complete!</span>
        </div>
      )}
    </div>
  );
}
