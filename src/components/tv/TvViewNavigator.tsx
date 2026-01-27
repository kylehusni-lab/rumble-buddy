import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveMatchDisplay } from "./ActiveMatchDisplay";
import { NumberCell } from "./NumberCell";
import { ParticipantPicksView } from "./ParticipantPicksView";
import { RumblePropsDisplay } from "./RumblePropsDisplay";
import { RumbleWinnerPredictions } from "./RumbleWinnerPredictions";
import { WrestlerImage } from "./WrestlerImage";
import { UNDERCARD_MATCHES, SCORING } from "@/lib/constants";
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

type ViewType = "undercard" | "rumble" | "rumble-props";

interface View {
  type: ViewType;
  id: string;
  title: string;
  options?: readonly [string, string];
  gender?: "mens" | "womens";
}

const VIEWS: View[] = [
  { type: "undercard", id: "undercard_1", title: UNDERCARD_MATCHES[0].title, options: UNDERCARD_MATCHES[0].options },
  { type: "undercard", id: "undercard_2", title: UNDERCARD_MATCHES[1].title, options: UNDERCARD_MATCHES[1].options },
  { type: "undercard", id: "undercard_3", title: UNDERCARD_MATCHES[2].title, options: UNDERCARD_MATCHES[2].options },
  { type: "rumble", id: "mens", title: "Men's Royal Rumble" },
  { type: "rumble-props", id: "mens_props", title: "Men's Rumble Props", gender: "mens" },
  { type: "rumble", id: "womens", title: "Women's Royal Rumble" },
  { type: "rumble-props", id: "womens_props", title: "Women's Rumble Props", gender: "womens" },
];

export function TvViewNavigator({
  matchResults,
  mensNumbers,
  womensNumbers,
  players,
  picks,
  getPlayerInitials,
  getNumberStatus,
}: TvViewNavigatorProps) {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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
      } else if (e.key >= "1" && e.key <= "7") {
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

  const currentView = VIEWS[currentViewIndex];

  const renderNumberGrid = (numbers: RumbleNumber[], title: string, rumbleId: string) => {
    const activeCount = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length;
    const winnerMatchId = rumbleId === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
    const winnerResult = matchResults.find(r => r.match_id === winnerMatchId);
    const winnerNumber = winnerResult 
      ? numbers.find(n => n.wrestler_name === winnerResult.result)
      : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="text-success text-lg font-semibold">Active: {activeCount}</span>
        </div>
        <div className="grid grid-cols-10 gap-2">
          {numbers.map((num) => (
            <NumberCell
              key={num.number}
              number={num.number}
              wrestlerName={num.wrestler_name}
              ownerInitials={getPlayerInitials(num.assigned_to_player_id)}
              status={getNumberStatus(num)}
              delay={num.number}
            />
          ))}
        </div>
        
        {/* Enhanced Winner Display - show when declared */}
        {winnerNumber && winnerNumber.wrestler_name && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mt-8 p-8 bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 rounded-2xl border-4 border-primary overflow-hidden"
          >
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/20"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-4">
              {/* Trophy + WINNER label */}
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-primary" />
                <motion.span 
                  className="text-2xl font-black text-primary uppercase tracking-widest"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Winner
                </motion.span>
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              
              {/* Large wrestler photo with animated border */}
              <motion.div
                className="relative"
                animate={{ 
                  boxShadow: [
                    "0 0 20px hsl(var(--primary) / 0.3)",
                    "0 0 40px hsl(var(--primary) / 0.5)",
                    "0 0 20px hsl(var(--primary) / 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <WrestlerImage 
                  name={winnerNumber.wrestler_name} 
                  size="xl" 
                  className="border-4 border-primary rounded-full" 
                />
              </motion.div>
              
              {/* Winner name - large */}
              <div className="text-4xl font-black text-primary tracking-tight">
                {winnerNumber.wrestler_name}
              </div>
              
              {/* Entry number and owner */}
              <div className="text-lg text-muted-foreground">
                Entry #{winnerNumber.number} • Owned by {getPlayerName(winnerNumber.assigned_to_player_id)}
              </div>
              
              {/* Points awarded */}
              <motion.div 
                className="text-2xl font-bold text-success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                +{SCORING.RUMBLE_WINNER_NUMBER} pts
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Winner Predictions Panel - always shown for Rumble views */}
        <RumbleWinnerPredictions
          gender={rumbleId as "mens" | "womens"}
          players={players}
          picks={picks}
          matchResults={matchResults}
        />
      </div>
    );
  };

  const renderCurrentView = () => {
    if (currentView.type === "undercard" && currentView.options) {
      const match = UNDERCARD_MATCHES.find(m => m.id === currentView.id);
      if (match) {
        return (
          <ActiveMatchDisplay
            match={match}
            matchResults={matchResults}
          />
        );
      }
    }

    if (currentView.type === "rumble") {
      const numbers = currentView.id === "mens" ? mensNumbers : womensNumbers;
      return renderNumberGrid(numbers, currentView.title, currentView.id);
    }

    if (currentView.type === "rumble-props" && currentView.gender) {
      return (
        <RumblePropsDisplay
          gender={currentView.gender}
          players={players}
          picks={picks}
          matchResults={matchResults}
        />
      );
    }

    return null;
  };

  const result = getViewResult(currentView);
  const isComplete = isViewComplete(currentView);

  return (
    <div className="relative">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="h-12 w-12 rounded-full bg-card/80 hover:bg-card border border-border"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* View Counter & Status */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {currentViewIndex + 1} / {VIEWS.length}
          </span>
          {isComplete && result && (
            <span className="text-xs font-semibold text-success uppercase">
              Winner: {result}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-12 w-12 rounded-full bg-card/80 hover:bg-card border border-border"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* View Content with Animation */}
      <div className="relative min-h-[400px]">
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

      {/* Participant Picks - only show for undercard matches */}
      {currentView.type === "undercard" && (
        <div className="mt-6">
          <ParticipantPicksView
            players={players}
            picks={picks}
            matchResults={matchResults}
            currentMatchId={currentView.id}
          />
        </div>
      )}

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {VIEWS.map((view, index) => {
          const complete = isViewComplete(view);
          return (
            <button
              key={view.id}
              onClick={() => {
                setDirection(index > currentViewIndex ? 1 : -1);
                setCurrentViewIndex(index);
              }}
              className={`
                w-3 h-3 rounded-full transition-all duration-200
                ${index === currentViewIndex 
                  ? "bg-primary scale-125" 
                  : complete 
                    ? "bg-success/50 hover:bg-success" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }
              `}
              aria-label={`Go to ${view.title}`}
            />
          );
        })}
      </div>
    </div>
  );
}
