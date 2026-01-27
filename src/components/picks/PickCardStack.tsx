import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "./cards/MatchCard";
import { RumbleWinnerCard } from "./cards/RumbleWinnerCard";
import { ChaosPropsCard } from "./cards/ChaosPropsCard";
import { RumblePropsCard } from "./cards/RumblePropsCard";
import { ProgressBar } from "./ProgressBar";
import { CARD_CONFIG, TOTAL_CARDS, CHAOS_PROPS, RUMBLE_PROPS, FINAL_FOUR_SLOTS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PickCardStackProps {
  partyCode: string;
  playerId: string;
  displayName: string;
  isLocked: boolean;
  existingPicks: Record<string, string>;
  mensEntrants: string[];
  womensEntrants: string[];
}

export function PickCardStack({
  partyCode,
  playerId,
  displayName,
  isLocked,
  existingPicks,
  mensEntrants,
  womensEntrants,
}: PickCardStackProps) {
  const navigate = useNavigate();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, any>>(existingPicks);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(Object.keys(existingPicks).length > 0);
  
  // Touch swipe detection state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentCard = CARD_CONFIG[currentCardIndex];
  const isLastCard = currentCardIndex === TOTAL_CARDS - 1;

  // Calculate completion status for each card
  const cardCompletionStatus = useMemo(() => {
    return CARD_CONFIG.map((card) => {
      if (card.type === "chaos-props") {
        // Check if all 6 props are answered for this gender
        const gender = card.gender;
        const propCount = CHAOS_PROPS.filter((_, index) => {
          const matchId = `${gender}_chaos_prop_${index + 1}`;
          return picks[matchId] !== null && picks[matchId] !== undefined;
        }).length;
        return propCount === 6;
      }
      if (card.type === "rumble-props") {
        // Check wrestler props + final four + yes/no props
        const gender = card.gender;
        const wrestlerProps = RUMBLE_PROPS.filter(p => p.type === "wrestler");
        const yesNoProps = RUMBLE_PROPS.filter(p => p.type === "yesno");
        
        const wrestlerPropsComplete = wrestlerProps.every(p => 
          picks[`${gender}_${p.id}`] !== null && picks[`${gender}_${p.id}`] !== undefined
        );
        const finalFourComplete = Array.from({ length: FINAL_FOUR_SLOTS }).every((_, i) =>
          picks[`${gender}_final_four_${i + 1}`] !== null && picks[`${gender}_final_four_${i + 1}`] !== undefined
        );
        const yesNoComplete = yesNoProps.every(p =>
          picks[`${gender}_${p.id}`] !== null && picks[`${gender}_${p.id}`] !== undefined
        );
        
        return wrestlerPropsComplete && finalFourComplete && yesNoComplete;
      }
      const pick = picks[card.id];
      return pick !== null && pick !== undefined;
    });
  }, [picks]);

  const completedCount = cardCompletionStatus.filter(Boolean).length;
  const allPicksComplete = completedCount === TOTAL_CARDS;

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

  const handlePickUpdate = (cardId: string, value: any) => {
    if (isLocked) return;
    
    setPicks(prev => ({ ...prev, [cardId]: value }));
    
    // Auto-advance after selection (except for chaos props and rumble props which need multiple selections)
    const card = CARD_CONFIG.find(c => c.id === cardId);
    if (card?.type !== "chaos-props" && card?.type !== "rumble-props" && currentCardIndex < TOTAL_CARDS - 1) {
      setTimeout(() => handleSwipe("right"), 300);
    }
  };

  const handleChaosPropsUpdate = (values: Record<string, "YES" | "NO" | null>) => {
    if (isLocked) return;
    setPicks(prev => ({ ...prev, ...values }));
  };

  const handleRumblePropsUpdate = (values: Record<string, string | null>) => {
    if (isLocked) return;
    setPicks(prev => ({ ...prev, ...values }));
  };

  // Touch event handlers for swipe detection (without visual dragging)
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
      handleSwipe("right"); // Swipe left = go forward
    } else if (isRightSwipe && currentCardIndex > 0) {
      handleSwipe("left"); // Swipe right = go back
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleSubmit = async () => {
    if (!playerId || !allPicksComplete || isLocked) return;

    setIsSubmitting(true);

    try {
      // Convert picks to database format
      const pickRecords: { player_id: string; match_id: string; prediction: string }[] = [];

      // Add match winners and rumble winners
      CARD_CONFIG.forEach((card) => {
        if (card.type === "match" || card.type === "rumble-winner") {
          if (picks[card.id]) {
            pickRecords.push({
              player_id: playerId,
              match_id: card.id,
              prediction: picks[card.id],
            });
          }
        } else if (card.type === "chaos-props") {
          // Add chaos props
          CHAOS_PROPS.forEach((prop, index) => {
            const matchId = `${card.gender}_chaos_prop_${index + 1}`;
            if (picks[matchId]) {
              pickRecords.push({
                player_id: playerId,
                match_id: matchId,
                prediction: picks[matchId],
              });
            }
          });
        } else if (card.type === "rumble-props") {
          // Add rumble props (wrestler select + final four + yes/no)
          RUMBLE_PROPS.forEach((prop) => {
            const matchId = `${card.gender}_${prop.id}`;
            if (picks[matchId]) {
              pickRecords.push({
                player_id: playerId,
                match_id: matchId,
                prediction: picks[matchId],
              });
            }
          });
          
          // Add final four picks
          for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
            const matchId = `${card.gender}_final_four_${i}`;
            if (picks[matchId]) {
              pickRecords.push({
                player_id: playerId,
                match_id: matchId,
                prediction: picks[matchId],
              });
            }
          }
        }
      });

      const { error } = await supabase
        .from("picks")
        .upsert(pickRecords, { onConflict: "player_id,match_id" });

      if (error) throw error;

      setHasSubmitted(true);
      toast.success("Picks saved! Good luck! 🎉");
      navigate(`/player/dashboard/${partyCode}`);
    } catch (err) {
      console.error("Error submitting picks:", err);
      toast.error("Failed to save picks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get chaos props values for the current card
  const getChaosPropsValues = (gender: "mens" | "womens") => {
    const values: Record<string, "YES" | "NO" | null> = {};
    CHAOS_PROPS.forEach((prop, index) => {
      const matchId = `${gender}_chaos_prop_${index + 1}`;
      values[matchId] = picks[matchId] || null;
    });
    return values;
  };

  // Get rumble props values for the current card
  const getRumblePropsValues = (gender: "mens" | "womens") => {
    const values: Record<string, string | null> = {};
    
    // Wrestler select props
    RUMBLE_PROPS.forEach((prop) => {
      const matchId = `${gender}_${prop.id}`;
      values[matchId] = picks[matchId] || null;
    });
    
    // Final four slots
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      const matchId = `${gender}_final_four_${i}`;
      values[matchId] = picks[matchId] || null;
    }
    
    return values;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Progress Bar */}
      <ProgressBar
        currentIndex={currentCardIndex}
        completionStatus={cardCompletionStatus}
        onJumpToCard={setCurrentCardIndex}
      />

      {/* Party Code & Name */}
      <div className="text-center py-2 border-b border-border">
        <div className="text-sm text-muted-foreground">Party {partyCode}</div>
        <div className="font-bold text-primary">Hey {displayName}!</div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-start justify-center p-4 pt-2 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" custom={swipeDirection}>
          <motion.div
            key={currentCardIndex}
            custom={swipeDirection}
            initial={{ 
              x: swipeDirection === "left" ? -300 : 300,
              opacity: 0,
              scale: 0.8
            }}
            animate={{ 
              x: 0,
              opacity: 1,
              scale: 1
            }}
            exit={{ 
              x: swipeDirection === "left" ? 300 : -300,
              opacity: 0,
              scale: 0.8
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                disabled={isLocked}
              />
            )}
            
            {currentCard.type === "rumble-winner" && (
              <RumbleWinnerCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                value={picks[currentCard.id] || null}
                onChange={(value) => handlePickUpdate(currentCard.id, value)}
                disabled={isLocked}
                customEntrants={currentCard.gender === "mens" ? mensEntrants : womensEntrants}
              />
            )}
            
            {currentCard.type === "chaos-props" && (
              <ChaosPropsCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                values={getChaosPropsValues(currentCard.gender as "mens" | "womens")}
                onChange={handleChaosPropsUpdate}
                disabled={isLocked}
              />
            )}
            
            {currentCard.type === "rumble-props" && (
              <RumblePropsCard
                title={currentCard.title}
                gender={currentCard.gender as "mens" | "womens"}
                values={getRumblePropsValues(currentCard.gender as "mens" | "womens")}
                onChange={handleRumblePropsUpdate}
                disabled={isLocked}
                customEntrants={currentCard.gender === "mens" ? mensEntrants : womensEntrants}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Hint (only show on first card) */}
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
      <div className="p-4 border-t border-border flex items-center justify-between bg-card">
        <Button
          variant="ghost"
          onClick={() => handleSwipe("left")}
          disabled={currentCardIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentCardIndex + 1} / {TOTAL_CARDS}
        </div>

        {!isLastCard ? (
          <Button
            variant="ghost"
            onClick={() => handleSwipe("right")}
            className="flex items-center gap-2"
          >
            Skip
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allPicksComplete || isSubmitting || isLocked}
            className={allPicksComplete && !isLocked ? "gold-shimmer" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isLocked ? (
              "Locked 🔒"
            ) : hasSubmitted ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Update
              </>
            ) : (
              "Submit All"
            )}
          </Button>
        )}
      </div>

      {/* Back to Dashboard */}
      <div className="p-2 text-center border-t border-border">
        <Button 
          variant="link" 
          onClick={() => navigate(`/player/dashboard/${partyCode}`)}
          className="text-muted-foreground"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
