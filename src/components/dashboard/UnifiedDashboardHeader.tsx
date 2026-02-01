import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Cloud, LogOut, Tv, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OttLogoImage } from "@/components/logo";
import { cn } from "@/lib/utils";

interface UnifiedDashboardHeaderProps {
  mode: "solo" | "party";
  displayName: string;
  score: number;
  rank?: number | null;
  totalPlayers?: number;
  isSynced?: boolean;
  partyCode?: string;
  onLogout?: () => void;
  onOpenTv?: () => void;
  onBack?: () => void;
}

export const UnifiedDashboardHeader = memo(function UnifiedDashboardHeader({
  mode,
  displayName,
  score,
  rank,
  totalPlayers,
  isSynced = true,
  partyCode,
  onLogout,
  onOpenTv,
  onBack,
}: UnifiedDashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-muted-foreground -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <OttLogoImage size="xs" />
          </div>
          <div className="flex items-center gap-3">
            {mode === "solo" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cloud className={cn("w-3 h-3", isSynced ? "text-success" : "text-muted-foreground")} />
                {isSynced ? "Synced" : "Syncing..."}
              </div>
            )}
            {mode === "party" && partyCode && (
              <div className="text-xs text-muted-foreground font-mono">
                {partyCode}
              </div>
            )}
            {onOpenTv && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTv}
                className="text-muted-foreground"
              >
                <Tv className="w-4 h-4" />
              </Button>
            )}
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card-gradient rounded-xl p-4 border border-border shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Hey {displayName}!
              </div>
              <div className="text-3xl font-black text-primary tabular-nums">
                {score} pts
              </div>
              {mode === "party" && rank && totalPlayers && (
                <div className="text-xs text-muted-foreground mt-1">
                  Rank #{rank} of {totalPlayers}
                </div>
              )}
            </div>
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              rank === 1 ? "rank-badge-1" : 
              rank === 2 ? "rank-badge-2" : 
              rank === 3 ? "rank-badge-3" : 
              "bg-primary/10"
            )}>
              {rank && rank <= 3 ? (
                <span className={cn(
                  "text-xl font-black",
                  rank === 1 ? "text-primary-foreground" : "text-foreground"
                )}>
                  #{rank}
                </span>
              ) : (
                <Trophy className="w-7 h-7 text-primary" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
