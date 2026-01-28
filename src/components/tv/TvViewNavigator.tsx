import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { ActiveMatchDisplay } from "./ActiveMatchDisplay";
import { NumberCell } from "./NumberCell";
import { RumblePropsDisplay } from "./RumblePropsDisplay";
import { ChaosPropsDisplay } from "./ChaosPropsDisplay";
import { RumbleWinnerPredictions } from "./RumbleWinnerPredictions";
import { TvLeaderboardView } from "./TvLeaderboardView";
import { RumbleSubTabs, RumbleSubView } from "./RumbleSubTabs";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";
import { cn } from "@/lib/utils";

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

interface TvViewNavigatorProps {
  matchResults: MatchResult[];
  mensNumbers: RumbleNumber[];
  womensNumbers: RumbleNumber[];
  players: Player[];
  picks: Pick[];
  getPlayerInitials: (id: string | null) => string;
  getNumberStatus: (num: RumbleNumber) => "pending" | "active" | "eliminated";
}

export type ViewType = "leaderboard" | "undercard" | "rumble";

export interface View {
  type: ViewType;
  id: string;
  title: string;
  options?: readonly [string, string];
  gender?: "mens" | "womens";
}

// Simplified views - rumble now includes sub-tabs for grid, props, chaos
export const VIEWS: View[] = [
  { type: "leaderboard", id: "leaderboard", title: "Leaderboard" },
  { type: "undercard", id: "undercard_1", title: UNDERCARD_MATCHES[0].title, options: UNDERCARD_MATCHES[0].options },
  { type: "undercard", id: "undercard_2", title: UNDERCARD_MATCHES[1].title, options: UNDERCARD_MATCHES[1].options },
  { type: "undercard", id: "undercard_3", title: UNDERCARD_MATCHES[2].title, options: UNDERCARD_MATCHES[2].options },
  { type: "rumble", id: "mens", title: "Men's Royal Rumble", gender: "mens" },
  { type: "rumble", id: "womens", title: "Women's Royal Rumble", gender: "womens" },
];

interface TvViewNavigatorWithCallback extends TvViewNavigatorProps {
  onViewChange?: (viewType: ViewType, viewIndex: number, viewTitle: string) => void;
  currentViewIndex?: number;
  onSelectView?: (index: number) => void;
}

export function TvViewNavigator({
  matchResults,
  mensNumbers,
  womensNumbers,
  players,
  picks,
  getPlayerInitials,
  getNumberStatus,
  onViewChange,
  currentViewIndex: externalViewIndex,
  onSelectView,
}: TvViewNavigatorWithCallback) {
  const [internalViewIndex, setInternalViewIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Sub-tab state for rumble views
  const [mensSubView, setMensSubView] = useState<RumbleSubView>("grid");
  const [womensSubView, setWomensSubView] = useState<RumbleSubView>("grid");
  
  // Use external index if controlled, otherwise internal
  const currentViewIndex = externalViewIndex ?? internalViewIndex;
  const setCurrentViewIndex = onSelectView ?? setInternalViewIndex;
  const currentView = VIEWS[currentViewIndex];
  
  // Get responsive scale values
  const { scale, photoSize, gridGapClass } = useTvScale();

  // Check if a view is complete
  const isViewComplete = useCallback((view: View): boolean => {
    if (view.type === "undercard") {
      return matchResults.some(r => r.match_id === view.id);
    }
    // Rumble is complete when winner is declared
    if (view.id === "mens") {
      return matchResults.some(r => r.match_id === "mens_rumble_winner");
    }
    if (view.id === "womens") {
      return matchResults.some(r => r.match_id === "womens_rumble_winner");
    }
    return false;
  }, [matchResults]);

  // Get the result for a view
  const getViewResult = useCallback((view: View): string | null => {
    if (view.type === "undercard") {
      const result = matchResults.find(r => r.match_id === view.id);
      return result?.result || null;
    }
    if (view.id === "mens") {
      const result = matchResults.find(r => r.match_id === "mens_rumble_winner");
      return result?.result || null;
    }
    if (view.id === "womens") {
      const result = matchResults.find(r => r.match_id === "womens_rumble_winner");
      return result?.result || null;
    }
    return null;
  }, [matchResults]);

  // Find first incomplete view on match result change
  useEffect(() => {
    const firstIncompleteIndex = VIEWS.findIndex(v => !isViewComplete(v));
    if (firstIncompleteIndex !== -1 && firstIncompleteIndex !== currentViewIndex) {
      const timer = setTimeout(() => {
        setDirection(firstIncompleteIndex > currentViewIndex ? 1 : -1);
        setCurrentViewIndex(firstIncompleteIndex);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [matchResults, isViewComplete]);

  // Notify parent of view changes
  useEffect(() => {
    onViewChange?.(currentView.type, currentViewIndex, currentView.title);
  }, [currentViewIndex, onViewChange, currentView.type, currentView.title]);

  // Helper to get player name
  const getPlayerName = useCallback((playerId: string | null): string => {
    if (!playerId) return "Unassigned";
    const player = players.find(p => p.id === playerId);
    return player?.display_name || "Unknown";
  }, [players]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key >= "1" && e.key <= "6") {
        const index = parseInt(e.key) - 1;
        if (index < VIEWS.length) {
          setDirection(index > currentViewIndex ? 1 : -1);
          setCurrentViewIndex(index);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentViewIndex]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentViewIndex(prev => (prev === 0 ? VIEWS.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentViewIndex(prev => (prev === VIEWS.length - 1 ? 0 : prev + 1));
  };

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
            <NumberCell
              key={num.number}
              number={num.number}
              wrestlerName={num.wrestler_name}
              ownerInitials={getPlayerInitials(num.assigned_to_player_id)}
              status={getNumberStatus(num)}
              scale={scale}
              photoSize={photoSize}
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

  const renderCurrentView = () => {
    if (currentView.type === "leaderboard") {
      return <TvLeaderboardView players={players} />;
    }

    if (currentView.type === "undercard" && currentView.options) {
      const match = UNDERCARD_MATCHES.find(m => m.id === currentView.id);
      if (match) {
        return (
          <ActiveMatchDisplay
            match={match}
            matchResults={matchResults}
            players={players}
            picks={picks}
          />
        );
      }
    }

    if (currentView.type === "rumble" && currentView.gender) {
      return renderRumbleContent(currentView.gender);
    }

    return null;
  };

  // Check if view has active wrestlers (for rumble views)
  const isViewActive = useCallback((view: View): boolean => {
    if (view.type === "rumble") {
      const numbers = view.id === "mens" ? mensNumbers : womensNumbers;
      return numbers.some(n => n.entry_timestamp && !n.elimination_timestamp);
    }
    return false;
  }, [mensNumbers, womensNumbers]);

  return (
    <div className="relative flex flex-col h-full">
      {/* View Content with Animation */}
      <div className="relative min-h-[400px] flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentViewIndex}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
