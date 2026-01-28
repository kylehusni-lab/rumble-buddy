import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { ActiveMatchDisplay } from "./ActiveMatchDisplay";
import { TvNumberCell } from "./TvNumberCell";
import { RumblePropsDisplay } from "./RumblePropsDisplay";
import { ChaosPropsDisplay } from "./ChaosPropsDisplay";
import { RumbleWinnerPredictions } from "./RumbleWinnerPredictions";
import { TvLeaderboardView } from "./TvLeaderboardView";
import { RumbleSubTabs, RumbleSubView } from "./RumbleSubTabs";
import { WrestlerImage } from "./WrestlerImage";
import { UndercardMatchSelector } from "./UndercardMatchSelector";
import { TvTabId } from "./TvTabBar";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";
import { cn } from "@/lib/utils";

// Player color palette (avoiding green/red for status indication)
const PLAYER_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-500" },
  { bg: "bg-orange-500", border: "border-orange-500" },
  { bg: "bg-purple-500", border: "border-purple-500" },
  { bg: "bg-cyan-500", border: "border-cyan-500" },
  { bg: "bg-pink-500", border: "border-pink-500" },
  { bg: "bg-amber-500", border: "border-amber-500" },
  { bg: "bg-teal-500", border: "border-teal-500" },
  { bg: "bg-indigo-500", border: "border-indigo-500" },
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
  // New consolidated navigation props
  activeTab: TvTabId;
  undercardMatchIndex: number;
  onUndercardMatchChange: (index: number) => void;
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
}: TvViewNavigatorProps) {
  // Sub-tab state for rumble views
  const [mensSubView, setMensSubView] = useState<RumbleSubView>("grid");
  const [womensSubView, setWomensSubView] = useState<RumbleSubView>("grid");
  
  // Get responsive scale values
  const { scale, gridGapClass } = useTvScale();

  // Helper to get player name
  const getPlayerName = useCallback((playerId: string | null): string => {
    if (!playerId) return "Unassigned";
    const player = players.find(p => p.id === playerId);
    return player?.display_name || "Unknown";
  }, [players]);

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

  // Get player color based on their index in the players array
  const getPlayerColor = useCallback((playerId: string | null) => {
    if (!playerId) return null;
    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) return null;
    return PLAYER_COLORS[index % PLAYER_COLORS.length];
  }, [players]);

  const renderNumberGrid = (numbers: RumbleNumber[], rumbleId: string) => {
    const winnerMatchId = rumbleId === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
    const winnerResult = matchResults.find(r => r.match_id === winnerMatchId);
    const winnerNumber = winnerResult 
      ? numbers.find(n => n.wrestler_name === winnerResult.result)
      : null;

    return (
      <div className="space-y-4">
        <div className={cn("grid grid-cols-10", gridGapClass)}>
          {numbers.map((num) => (
            <TvNumberCell
              key={num.number}
              number={num.number}
              wrestlerName={num.wrestler_name}
              playerColor={getPlayerColor(num.assigned_to_player_id)}
              status={getNumberStatus(num)}
              scale={scale}
            />
          ))}
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
                Entry #{winnerNumber.number} • Owned by {getPlayerName(winnerNumber.assigned_to_player_id)}
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
    const setSubView = gender === "mens" ? setMensSubView : setWomensSubView;

    return (
      <div className="space-y-4">
        {/* Sub-tabs */}
        <RumbleSubTabs value={subView} onChange={setSubView} />
        
        {/* Content based on sub-tab */}
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
