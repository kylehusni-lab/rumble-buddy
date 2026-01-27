import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface PlayerNumbers {
  playerName: string;
  mensNumbers: number[];
  womensNumbers: number[];
}

interface NumberRevealAnimationProps {
  players: PlayerNumbers[];
  onComplete: () => void;
}

type Phase = "choice" | "instant" | "dramatic" | "complete";

export function NumberRevealAnimation({ players, onComplete }: NumberRevealAnimationProps) {
  const [phase, setPhase] = useState<Phase>(players.length === 1 ? "instant" : "choice");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Skip button handler
  const handleSkip = () => {
    setPhase("complete");
  };

  // Mode selection handlers
  const handleInstantMode = () => {
    setPhase("instant");
  };

  const handleDramaticMode = () => {
    setPhase("dramatic");
  };

  // User-driven handlers (no auto-timers)
  const handleNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase("complete");
    }
  };

  const handleContinueFromInstant = () => {
    setPhase("complete");
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Skip button - always visible except on choice screen */}
      {phase !== "choice" && phase !== "complete" && (
        <motion.button
          className="absolute top-6 right-6 p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
          onClick={handleSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <X className="w-6 h-6 text-muted-foreground" />
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {/* Choice Screen */}
        {phase === "choice" && (
          <motion.div
            key="choice"
            className="text-center max-w-md px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Logo size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black mb-3">
              <span className="text-gradient-gold">NUMBER DRAW</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              How would you like to reveal your numbers?
            </p>

            <div className="space-y-4">
              <Button
                variant="gold"
                size="xl"
                className="w-full justify-start gap-4 h-auto py-5"
                onClick={handleInstantMode}
              >
                <Zap className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-lg font-bold">INSTANT REVEAL</div>
                  <div className="text-sm opacity-80 font-normal">See all numbers at once</div>
                </div>
              </Button>

              <Button
                variant="purple"
                size="xl"
                className="w-full justify-start gap-4 h-auto py-5"
                onClick={handleDramaticMode}
              >
                <Film className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-lg font-bold">DRAMATIC REVEAL</div>
                  <div className="text-sm opacity-80 font-normal">Player-by-player suspense</div>
                </div>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Instant Mode - All players at once */}
        {phase === "instant" && (
          <motion.div
            key="instant"
            className="text-center w-full max-w-4xl px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-black mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-gradient-gold">YOUR NUMBERS ARE IN!</span>
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto py-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.playerName}
                  className="bg-card border-2 border-primary/30 rounded-xl p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <h3 className="text-lg font-bold text-primary mb-3 truncate">
                    {player.playerName}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Men's</div>
                      <div className="flex flex-wrap gap-1">
                        {player.mensNumbers.map(num => (
                          <span
                            key={num}
                            className="bg-primary/20 text-primary font-bold px-2 py-1 rounded text-sm"
                          >
                            #{num}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Women's</div>
                      <div className="flex flex-wrap gap-1">
                        {player.womensNumbers.map(num => (
                          <span
                            key={num}
                            className="bg-secondary/20 text-secondary-foreground font-bold px-2 py-1 rounded text-sm"
                          >
                            #{num}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Continue button */}
            <Button
              variant="gold"
              size="lg"
              className="mt-6"
              onClick={handleContinueFromInstant}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Dramatic Mode - One player at a time */}
        {phase === "dramatic" && players[currentPlayerIndex] && (
          <motion.div
            key={`dramatic-${currentPlayerIndex}`}
            className="text-center w-full max-w-lg px-6 cursor-pointer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={handleNextPlayer}
          >
            <motion.div
              className="bg-card border-2 border-primary rounded-2xl p-8"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                {players[currentPlayerIndex].playerName}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Men's Rumble</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {players[currentPlayerIndex].mensNumbers.map((num, idx) => (
                      <motion.span
                        key={num}
                        className="bg-primary text-primary-foreground font-black text-2xl px-4 py-2 rounded-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.1 }}
                      >
                        #{num}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Women's Rumble</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {players[currentPlayerIndex].womensNumbers.map((num, idx) => (
                      <motion.span
                        key={num}
                        className="bg-secondary text-secondary-foreground font-black text-2xl px-4 py-2 rounded-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.1 + 0.2 }}
                      >
                        #{num}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress dots */}
            <div className="mt-6 flex justify-center gap-2">
              {players.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    idx === currentPlayerIndex
                      ? "bg-primary"
                      : idx < currentPlayerIndex
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Next/Finish button */}
            <Button
              variant="gold"
              size="lg"
              className="mt-6"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPlayer();
              }}
            >
              {currentPlayerIndex < players.length - 1 ? "Next Player" : "Finish"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Tap anywhere to continue</p>
          </motion.div>
        )}

        {/* Complete Phase - simplified, no scale animation */}
        {phase === "complete" && (
          <div
            key="complete"
            className="text-center animate-fade-in"
          >
            <Logo size="md" className="mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-black text-gradient-gold mb-2">
              LET'S RUMBLE!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Good luck to all players!
            </p>
            <Button
              variant="gold"
              size="xl"
              onClick={handleFinish}
            >
              Let's Go!
            </Button>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
