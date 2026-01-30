import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { ActiveMatchDisplay } from "./ActiveMatchDisplay";
import { TvNumberCell } from "./TvNumberCell";
import { RumblePropsDisplay } from "./RumblePropsDisplay";
import { ChaosPropsDisplay } from "./ChaosPropsDisplay";
import { RumbleWinnerPredictions } from "./RumbleWinnerPredictions";
import { TvLeaderboardView } from "./TvLeaderboardView";
import { WrestlerImage } from "./WrestlerImage";
import { UndercardMatchSelector } from "./UndercardMatchSelector";
import { TvTabId } from "./TvTabBar";
import { RumbleSubView } from "./TvUnifiedHeader";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";
import { cn } from "@/lib/utils";

// Player color palette with hex values for banners
const PLAYER_COLORS = [
  { name: "pink", hex: "#e91e63", textColor: "black" as const },
  { name: "amber", hex: "#ffc107", textColor: "black" as const },
  { name: "orange", hex: "#ff5722", textColor: "black" as const },
  { name: "green", hex: "#4caf50", textColor: "black" as const },
  { name: "blue", hex: "#2196f3", textColor: "white" as const },
  { name: "purple", hex: "#9c27b0", textColor: "white" as const },
  { name: "cyan", hex: "#00bcd4", textColor: "black" as const },
  { name: "indigo", hex: "#3f51b5", textColor: "white" as const },
];

interface MatchResult {
  match_id: string;
  result: string;
}

interface RumbleNumber {
  number: number;
  wrestler_name: string | null;
  assigned_to_player_id: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
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

export type ViewType = "leaderboard" | "undercard" | "rumble";

interface TvViewNavigatorProps {
  matchResults: MatchResult[];
  mensNumbers: RumbleNumber[];
  womensNumbers: RumbleNumber[];
  players: Player[];
  picks: Pick[];
  getPlayerInitials: (id: string | null) => string;
  getNumberStatus: (num: RumbleNumber) => "pending" | "active" | "eliminated";
  // Navigation props
  activeTab: TvTabId;
  undercardMatchIndex: number;
  onUndercardMatchChange: (index: number) => void;
  // Sub-view props (lifted from internal state)
  mensSubView: RumbleSubView;
  womensSubView: RumbleSubView;
}

export function TvViewNavigator({
  matchResults,
  mensNumbers,
  womensNumbers,
  players,
  picks,
  getPlayerInitials,
  getNumberStatus,
  activeTab,
  undercardMatchIndex,
  onUndercardMatchChange,
  mensSubView,
  womensSubView,
}: TvViewNavigatorProps) {
  // Get responsive scale values
  const { scale, gridGapClass } = useTvScale();

  // Helper to get player name
  const getPlayerName = useCallback((playerId: string | null): string => {
    if (!playerId) return "";
    const player = players.find((p) => p.id === playerId);
    return player?.display_name || "";
  }, [players]);

  // Get player color based on their index in the players array
  const getPlayerColor = useCallback(
    (playerId: string | null) => {
      if (!playerId) return null;
      const index = players.findIndex((p) => p.id === playerId);
      if (index === -1) return null;
      return PLAYER_COLORS[index % PLAYER_COLORS.length];
    },
    [players]
  );

  // Detect the "current entrant" (most recent entry without elimination)
  const getCurrentEntrantNumber = useCallback((numbers: RumbleNumber[]): number | null => {
    const activeNumbers = numbers
      .filter((n) => n.entry_timestamp && !n.elimination_timestamp)
      .sort((a, b) => {
        const aTime = a.entry_timestamp ? new Date(a.entry_timestamp).getTime() : 0;
        const bTime = b.entry_timestamp ? new Date(b.entry_timestamp).getTime() : 0;
        return bTime - aTime; // Most recent first
      });
    
    if (activeNumbers.length === 0) return null;
    
    // The most recent entry (within last 60 seconds) is the "current entrant"
    const mostRecent = activeNumbers[0];
    if (!mostRecent.entry_timestamp) return null;
    
    const entryTime = new Date(mostRecent.entry_timestamp).getTime();
    const now = Date.now();
    const timeSinceEntry = now - entryTime;
    
    // Only show "current" glow for 60 seconds after entry
    if (timeSinceEntry < 60000) {
      return mostRecent.number;
    }
    return null;
  }, []);

  // Keyboard navigation for undercard matches
  useEffect(() => {
    if (activeTab !== "undercard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && undercardMatchIndex > 0) {
        onUndercardMatchChange(undercardMatchIndex - 1);
      } else if (e.key === "ArrowRight" && undercardMatchIndex < UNDERCARD_MATCHES.length - 1) {
        onUndercardMatchChange(undercardMatchIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, undercardMatchIndex, onUndercardMatchChange]);

  const renderNumberGrid = (numbers: RumbleNumber[], rumbleId: string) => {
    const winnerMatchId = rumbleId === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
    const winnerResult = matchResults.find((r) => r.match_id === winnerMatchId);
    const winnerNumber = winnerResult
      ? numbers.find((n) => n.wrestler_name === winnerResult.result)
      : null;

    const currentEntrantNumber = getCurrentEntrantNumber(numbers);

    return (
      <div className="space-y-4 flex-1 flex flex-col">
        <div 
          className={cn("grid grid-cols-10 flex-1", gridGapClass)}
          style={{ gridAutoRows: "1fr" }}
        >
          {numbers.map((num) => {
            const playerColor = getPlayerColor(num.assigned_to_player_id);
            const ownerName = getPlayerName(num.assigned_to_player_id);
            const baseStatus = getNumberStatus(num);
            
            // Override to "current" if this is the most recent entrant
            const status = currentEntrantNumber === num.number && baseStatus === "active" 
              ? "current" as const
              : baseStatus;

            return (
              <TvNumberCell
                key={num.number}
                number={num.number}
                wrestlerName={num.wrestler_name}
                ownerName={ownerName || null}
                ownerColor={playerColor?.hex || null}
                ownerTextColor={playerColor?.textColor}
                status={status}
                isAssigned={!!num.assigned_to_player_id}
              />
            );
          })}
        </div>

        {/* Enhanced Winner Display - show when declared */}
        {winnerNumber && winnerNumber.wrestler_name && (
          <div className="relative mt-8 p-8 bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 rounded-2xl border-4 border-primary overflow-hidden animate-scale-in">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-glow-pulse" />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-primary" />
                <span className="text-2xl font-black text-primary uppercase tracking-widest animate-winner-pulse">
                  Winner
                </span>
                <Trophy className="w-8 h-8 text-primary" />
              </div>

              <div className="relative animate-winner-glow">
                <WrestlerImage
                  name={winnerNumber.wrestler_name}
                  size="xl"
                  className="border-4 border-primary rounded-full"
                />
              </div>

              <div className="text-4xl font-black text-primary tracking-tight">
                {winnerNumber.wrestler_name}
              </div>

              <div className="text-lg text-muted-foreground">
                Entry #{winnerNumber.number} • Owned by{" "}
                {getPlayerName(winnerNumber.assigned_to_player_id) || "Vacant"}
              </div>

              <motion.div
                className="text-2xl font-bold text-success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                +{SCORING.RUMBLE_WINNER_NUMBER} pts
              </motion.div>
            </div>
          </div>
        )}

        {/* Winner Predictions Panel */}
        <RumbleWinnerPredictions
          gender={rumbleId as "mens" | "womens"}
          players={players}
          picks={picks}
          matchResults={matchResults}
        />
      </div>
    );
  };

  const renderRumbleContent = (gender: "mens" | "womens") => {
    const numbers = gender === "mens" ? mensNumbers : womensNumbers;
    const subView = gender === "mens" ? mensSubView : womensSubView;

    return (
      <div className="space-y-4">
        {/* Content based on sub-view (tabs now in header) */}
        {subView === "grid" && renderNumberGrid(numbers, gender)}
        {subView === "props" && (
          <RumblePropsDisplay
            gender={gender}
            players={players}
            picks={picks}
            matchResults={matchResults}
          />
        )}
        {subView === "chaos" && (
          <ChaosPropsDisplay
            gender={gender}
            players={players}
            picks={picks}
            matchResults={matchResults}
          />
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "leaderboard":
        return <TvLeaderboardView players={players} />;

      case "undercard": {
        const currentMatch = UNDERCARD_MATCHES[undercardMatchIndex];
        if (!currentMatch) return null;

        return (
          <div className="space-y-4">
            {/* Undercard match selector */}
            <UndercardMatchSelector
              selectedIndex={undercardMatchIndex}
              onSelect={onUndercardMatchChange}
              matchResults={matchResults}
            />

            {/* Active match display */}
            <ActiveMatchDisplay
              match={currentMatch}
              matchResults={matchResults}
              players={players}
              picks={picks}
            />
          </div>
        );
      }

      case "mens":
        return renderRumbleContent("mens");

      case "womens":
        return renderRumbleContent("womens");

      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* View Content with Animation */}
      <div className="relative min-h-[400px] flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab + (activeTab === "undercard" ? `-${undercardMatchIndex}` : "")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
