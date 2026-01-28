import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Save, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/picks/cards/MatchCard";
import { RumbleWinnerCard } from "@/components/picks/cards/RumbleWinnerCard";
import { ChaosPropsCard } from "@/components/picks/cards/ChaosPropsCard";
import { RumblePropsCard } from "@/components/picks/cards/RumblePropsCard";
import { ProgressBar } from "@/components/picks/ProgressBar";
import { 
  CARD_CONFIG, 
  TOTAL_CARDS, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS,
  DEFAULT_MENS_ENTRANTS,
  DEFAULT_WOMENS_ENTRANTS 
} from "@/lib/constants";
import { countCompletedPicks } from "@/lib/pick-validation";
import { getSoloPicks, saveSoloPicks } from "@/lib/solo-storage";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SoloPicks() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, player, savePicksToCloud } = useSoloCloud();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, any>>({});
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  
  // Touch swipe detection state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Debouncing refs for cloud sync
  const pendingPicksRef = useRef<Record<string, any>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayName = player?.display_name || "Me";

  // Debounced cloud save function
  const debouncedCloudSave = useCallback((newPicks: Record<string, any>) => {
    pendingPicksRef.current = newPicks;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      savePicksToCloud(pendingPicksRef.current);
      saveTimeoutRef.current = null;
    }, 800);
  }, [savePicksToCloud]);

  // Load existing picks on mount
  useEffect(() => {
    const existingPicks = getSoloPicks();
    if (Object.keys(existingPicks).length > 0) {
      setPicks(existingPicks);
    }
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save any pending picks before unmount
        if (Object.keys(pendingPicksRef.current).length > 0) {
          savePicksToCloud(pendingPicksRef.current);
        }
      }
    };
  }, [savePicksToCloud]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/solo/setup");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const currentCard = CARD_CONFIG[currentCardIndex];
  const isLastCard = currentCardIndex === TOTAL_CARDS - 1;

  // Calculate completion status for each card
  const cardCompletionStatus = useMemo(() => {
    return CARD_CONFIG.map((card) => {
      if (card.type === "chaos-props") {
        const gender = card.gender;
        const propCount = CHAOS_PROPS.filter((_, index) => {
          const matchId = `${gender}_chaos_prop_${index + 1}`;
          return picks[matchId] !== null && picks[matchId] !== undefined;
        }).length;
        return propCount === 6;
      }
      if (card.type === "rumble-props") {
        const gender = card.gender;
        
        const wrestlerPropsComplete = RUMBLE_PROPS.every(p => 
          picks[`${gender}_${p.id}`] !== null && picks[`${gender}_${p.id}`] !== undefined
        );
        const finalFourComplete = Array.from({ length: FINAL_FOUR_SLOTS }).every((_, i) =>
          picks[`${gender}_final_four_${i + 1}`] !== null && picks[`${gender}_final_four_${i + 1}`] !== undefined
        );
        
        return wrestlerPropsComplete && finalFourComplete;
      }
      const pick = picks[card.id];
      return pick !== null && pick !== undefined;
    });
  }, [picks]);

  const completedCount = cardCompletionStatus.filter(Boolean).length;
  const allPicksComplete = completedCount === TOTAL_CARDS;
  
  // Get detailed pick counts for the warning dialog
  const pickCounts = useMemo(() => countCompletedPicks(picks, CARD_CONFIG), [picks]);

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === "right" && currentCardIndex < TOTAL_CARDS - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else if (direction === "left" && currentCardIndex > 0) {
        setCurrentCardIndex(prev => prev - 1);
      }
      setSwipeDirection(null);
    }, 200);
  };

  const handlePickUpdate = useCallback((cardId: string, value: any) => {
    const newPicks = { ...picks, [cardId]: value };
    setPicks(newPicks);
    saveSoloPicks(newPicks);
    
    // Debounced cloud sync
    debouncedCloudSave(newPicks);
    
    // Auto-advance after selection (except for chaos props and rumble props)
    const card = CARD_CONFIG.find(c => c.id === cardId);
    if (card?.type !== "chaos-props" && card?.type !== "rumble-props" && currentCardIndex < TOTAL_CARDS - 1) {
      setTimeout(() => handleSwipe("right"), 300);
    }
  }, [picks, currentCardIndex, debouncedCloudSave]);

  const handleChaosPropsUpdate = useCallback((values: Record<string, "YES" | "NO" | null>) => {
    const newPicks = { ...picks, ...values };
    setPicks(newPicks);
    saveSoloPicks(newPicks);
    debouncedCloudSave(newPicks);
  }, [picks, debouncedCloudSave]);

  const handleRumblePropsUpdate = useCallback((values: Record<string, string | null>) => {
    const newPicks = { ...picks, ...values };
    setPicks(newPicks);
    saveSoloPicks(newPicks);
    debouncedCloudSave(newPicks);
  }, [picks, debouncedCloudSave]);

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentCardIndex < TOTAL_CARDS - 1) {
      handleSwipe("right");
    } else if (isRightSwipe && currentCardIndex > 0) {
      handleSwipe("left");
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleSaveClick = () => {
    // If not all picks complete, show warning
    if (!allPicksComplete) {
      setShowIncompleteWarning(true);
      return;
    }
    
    // All complete, submit directly
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowIncompleteWarning(false);
    
    try {
      // Save locally
      saveSoloPicks(picks);
      
      // Save to cloud
      await savePicksToCloud(picks);
      
      toast.success("Picks saved! Good luck! 🎉");
      navigate("/solo/dashboard");
    } catch (err) {
      toast.error("Failed to save picks");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get chaos props values for the current card
  const getChaosPropsValues = (gender: "mens" | "womens") => {
    const values: Record<string, "YES" | "NO" | null> = {};
    CHAOS_PROPS.forEach((_, index) => {
      const matchId = `${gender}_chaos_prop_${index + 1}`;
      values[matchId] = picks[matchId] || null;
    });
    return values;
  };

  // Get rumble props values for the current card
  const getRumblePropsValues = (gender: "mens" | "womens") => {
    const values: Record<string, string | null> = {};
    
    RUMBLE_PROPS.forEach((prop) => {
      const matchId = `${gender}_${prop.id}`;
      values[matchId] = picks[matchId] || null;
    });
    
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      const matchId = `${gender}_final_four_${i}`;
      values[matchId] = picks[matchId] || null;
    }
    
    return values;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Header with Home button FIRST */}
        <div className="py-2 px-4 border-b border-border flex items-center justify-between">
          <button 
            onClick={() => navigate("/solo/dashboard")}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Home className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
              Synced
            </div>
            <div className="font-bold text-primary">Hey {displayName}!</div>
          </div>
          <div className="w-9" /> {/* Spacer for balance */}
        </div>

        {/* Progress Bar SECOND */}
        <ProgressBar
          currentIndex={currentCardIndex}
          completionStatus={cardCompletionStatus}
          onJumpToCard={setCurrentCardIndex}
        />

        {/* Card Container */}
        <div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" custom={swipeDirection}>
          <motion.div
            key={currentCardIndex}
            custom={swipeDirection}
            initial={{ 
              x: swipeDirection === "left" ? -300 : 300,
              opacity: 0
            }}
            animate={{ 
              x: 0,
              opacity: 1
            }}
            exit={{ 
              x: swipeDirection === "left" ? 300 : -300,
              opacity: 0
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="w-full max-w-md h-full"
          >
            {currentCard.type === "match" && (
              <MatchCard
                title={currentCard.title}
                options={currentCard.options as readonly [string, string]}
                value={picks[currentCard.id] || null}
                onChange={(value) => handlePickUpdate(currentCard.id, value)}
                disabled={false}
              />
            )}
            
            {currentCard.type === "rumble-winner" && (
              <RumbleWinnerCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                value={picks[currentCard.id] || null}
                onChange={(value) => handlePickUpdate(currentCard.id, value)}
                disabled={false}
                customEntrants={currentCard.gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS}
              />
            )}
            
            {currentCard.type === "chaos-props" && (
              <ChaosPropsCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                values={getChaosPropsValues(currentCard.gender as "mens" | "womens")}
                onChange={handleChaosPropsUpdate}
                disabled={false}
              />
            )}
            
            {currentCard.type === "rumble-props" && (
              <RumblePropsCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                values={getRumblePropsValues(currentCard.gender as "mens" | "womens")}
                onChange={handleRumblePropsUpdate}
                disabled={false}
                customEntrants={currentCard.gender === "mens" ? DEFAULT_MENS_ENTRANTS : DEFAULT_WOMENS_ENTRANTS}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Hint */}
      {currentCardIndex === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-muted-foreground pb-2"
        >
          ← Swipe to navigate →
        </motion.div>
      )}

        {/* Navigation Controls */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-card">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe("left")}
            disabled={currentCardIndex === 0}
            className="flex items-center gap-1 min-w-[80px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Save Button - always visible */}
          <Button
            onClick={handleSaveClick}
            disabled={isSubmitting}
            variant={allPicksComplete ? "default" : "outline"}
            size="sm"
            className={allPicksComplete ? "gold-shimmer" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>

          {/* Page Indicator */}
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {currentCardIndex + 1}/{TOTAL_CARDS}
          </span>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe("right")}
            disabled={currentCardIndex === TOTAL_CARDS - 1}
            className="flex items-center gap-1 min-w-[80px]"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Incomplete Picks Warning Dialog */}
      <AlertDialog open={showIncompleteWarning} onOpenChange={setShowIncompleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not all picks completed</AlertDialogTitle>
            <AlertDialogDescription>
              You've completed {pickCounts.completed} of {pickCounts.total} picks. 
              Saving now means you'll miss out on potential points for incomplete picks.
              <br /><br />
              Are you sure you want to save?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
