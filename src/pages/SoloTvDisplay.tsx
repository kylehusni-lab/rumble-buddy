import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useAuth } from "@/hooks/useAuth";
import { useAutoHideHeader } from "@/hooks/useAutoHideHeader";
import { getSoloPicks, getSoloResults, calculateSoloScore } from "@/lib/solo-storage";
import { TvSoloScoreDisplay } from "@/components/tv/TvSoloScoreDisplay";
import { TvUnifiedHeader, RumbleSubView } from "@/components/tv/TvUnifiedHeader";
import { TvTabId } from "@/components/tv/TvTabBar";
import { ActiveMatchDisplay } from "@/components/tv/ActiveMatchDisplay";
import { UndercardMatchSelector } from "@/components/tv/UndercardMatchSelector";
import { RumblePropsDisplay } from "@/components/tv/RumblePropsDisplay";
import { ChaosPropsDisplay } from "@/components/tv/ChaosPropsDisplay";
import { TvNumberCell } from "@/components/tv/TvNumberCell";
import { RumbleWinnerPredictions } from "@/components/tv/RumbleWinnerPredictions";
import { OttLogoImage } from "@/components/logo";
import { UNDERCARD_MATCHES } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";
import { cn } from "@/lib/utils";

// Solo mode doesn't have multiple players, so we create a single "player" record
interface SoloPlayer {
  id: string;
  display_name: string;
  points: number;
}

interface SoloPick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface MatchResult {
  match_id: string;
  result: string;
}

// Solo mode simulated rumble number (for display purposes only)
interface SoloRumbleNumber {
  number: number;
  wrestler_name: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
}

export default function SoloTvDisplay() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: soloLoading, isAuthenticated, player } = useSoloCloud();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();
  
  // Auto-hide header hook
  const { isVisible: isHeaderVisible, showHeader } = useAutoHideHeader();
  
  // TV scale hook
  const { gridGapClass } = useTvScale();
  
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<TvTabId>("leaderboard");
  const [undercardMatchIndex, setUndercardMatchIndex] = useState(0);
  
  // Sub-view state for rumble tabs
  const [mensSubView, setMensSubView] = useState<RumbleSubView>("grid");
  const [womensSubView, setWomensSubView] = useState<RumbleSubView>("grid");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }
    
    if (!soloLoading && user && !isAuthenticated) {
      navigate("/solo/setup");
      return;
    }
    
    // Load local data
    setPicks(getSoloPicks());
    setResults(getSoloResults());
  }, [authLoading, soloLoading, user, isAuthenticated, navigate]);

  const score = useMemo(() => calculateSoloScore(picks, results), [picks, results]);

  // Create a solo player object for components that expect it
  const soloPlayer: SoloPlayer = useMemo(() => ({
    id: player?.id || "solo",
    display_name: player?.display_name || "You",
    points: score,
  }), [player, score]);

  // Convert picks to array format for TV components
  const picksArray: SoloPick[] = useMemo(() => {
    return Object.entries(picks).map(([match_id, prediction]) => ({
      player_id: soloPlayer.id,
      match_id,
      prediction,
    }));
  }, [picks, soloPlayer.id]);

  // Convert results to array format
  const resultsArray: MatchResult[] = useMemo(() => {
    return Object.entries(results).map(([match_id, result]) => ({
      match_id,
      result,
    }));
  }, [results]);

  // Generate simulated number grid for display (no assignments in solo mode)
  const generateNumberGrid = useCallback((entrants: string[]): SoloRumbleNumber[] => {
    return Array.from({ length: 30 }, (_, i) => ({
      number: i + 1,
      wrestler_name: null, // In solo mode, we don't track entries
      entry_timestamp: null,
      elimination_timestamp: null,
    }));
  }, []);

  const mensNumbers = useMemo(() => generateNumberGrid(mensEntrants), [mensEntrants, generateNumberGrid]);
  const womensNumbers = useMemo(() => generateNumberGrid(womensEntrants), [womensEntrants, generateNumberGrid]);

  // Handle tab selection
  const handleSelectTab = useCallback((tabId: TvTabId) => {
    setActiveTab(tabId);
    if (tabId === "undercard") {
      setUndercardMatchIndex(0);
    }
  }, []);

  // Keyboard navigation for undercard matches
  useEffect(() => {
    if (activeTab !== "undercard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && undercardMatchIndex > 0) {
        setUndercardMatchIndex(undercardMatchIndex - 1);
      } else if (e.key === "ArrowRight" && undercardMatchIndex < UNDERCARD_MATCHES.length - 1) {
        setUndercardMatchIndex(undercardMatchIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, undercardMatchIndex]);

  // Keyboard navigation for main tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tabs: TvTabId[] = ["leaderboard", "undercard", "mens", "womens"];
      if (e.key >= "1" && e.key <= "4") {
        const index = parseInt(e.key) - 1;
        setActiveTab(tabs[index]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (authLoading || soloLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthenticated || !player) return null;

  const hasResults = Object.keys(results).length > 0;

  const renderNumberGrid = (numbers: SoloRumbleNumber[], gender: "mens" | "womens") => {
    return (
      <div className="space-y-4 flex-1 flex flex-col">
        <div 
          className={cn("grid grid-cols-10 flex-1", gridGapClass)}
          style={{ gridAutoRows: "1fr" }}
        >
          {numbers.map((num) => (
            <TvNumberCell
              key={num.number}
              number={num.number}
              wrestlerName={num.wrestler_name}
              ownerName={null}
              ownerColor={null}
              status="pending"
              isAssigned={false}
            />
          ))}
        </div>

        {/* Winner Predictions Panel - shows your solo pick */}
        <RumbleWinnerPredictions
          gender={gender}
          players={[soloPlayer]}
          picks={picksArray}
          matchResults={resultsArray}
        />
      </div>
    );
  };

  const renderRumbleContent = (gender: "mens" | "womens") => {
    const numbers = gender === "mens" ? mensNumbers : womensNumbers;
    const subView = gender === "mens" ? mensSubView : womensSubView;

    return (
      <div className="space-y-4">
        {subView === "grid" && renderNumberGrid(numbers, gender)}
        {subView === "props" && (
          <RumblePropsDisplay
            gender={gender}
            players={[soloPlayer]}
            picks={picksArray}
            matchResults={resultsArray}
          />
        )}
        {subView === "chaos" && (
          <ChaosPropsDisplay
            gender={gender}
            players={[soloPlayer]}
            picks={picksArray}
            matchResults={resultsArray}
          />
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "leaderboard":
        // Solo mode shows score display instead of leaderboard
        return (
          <TvSoloScoreDisplay
            displayName={player.display_name}
            score={score}
            picks={picks}
            results={results}
          />
        );

      case "undercard": {
        const currentMatch = UNDERCARD_MATCHES[undercardMatchIndex];
        if (!currentMatch) return null;

        return (
          <div className="space-y-4">
            <UndercardMatchSelector
              selectedIndex={undercardMatchIndex}
              onSelect={setUndercardMatchIndex}
              matchResults={resultsArray}
            />
            <ActiveMatchDisplay
              match={currentMatch}
              matchResults={resultsArray}
              players={[soloPlayer]}
              picks={picksArray}
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
    <div className="min-h-screen bg-background text-foreground tv-mode flex flex-col">
      {/* Unified Header with Tab Navigation */}
      {hasResults ? (
        <TvUnifiedHeader
          partyCode="SOLO"
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          mensSubView={mensSubView}
          womensSubView={womensSubView}
          onMensSubViewChange={setMensSubView}
          onWomensSubViewChange={setWomensSubView}
          autoRotate={false}
          onToggleAutoRotate={() => {}}
          isVisible={isHeaderVisible}
          onShowHeader={showHeader}
        />
      ) : (
        // Simple header for pre-scoring state
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/solo/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-primary">Solo TV Mode</h1>
          <div className="w-16" />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-6 ${hasResults ? "pt-20" : ""}`}>
        {!hasResults ? (
          // Pre-scoring state
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <OttLogoImage size="lg" />
              <h2 className="text-3xl font-bold mb-2">Ready to Score</h2>
              <p className="text-muted-foreground mb-4">
                Start scoring results to see your picks come to life
              </p>
              <Button
                variant="hero"
                onClick={() => navigate("/solo/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          // Active scoring display
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab + (activeTab === "undercard" ? `-${undercardMatchIndex}` : "")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
