import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";

interface PlayerNumbers {
  playerName: string;
  mensNumbers: number[];
  womensNumbers: number[];
}

interface NumberRevealAnimationProps {
  players: PlayerNumbers[];
  onComplete: () => void;
}

export function NumberRevealAnimation({ players, onComplete }: NumberRevealAnimationProps) {
  const [phase, setPhase] = useState<"intro" | "mens" | "womens" | "complete">("intro");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealedNumbers, setRevealedNumbers] = useState<number[]>([]);

  useEffect(() => {
    // Intro phase - show title for 2 seconds
    const introTimer = setTimeout(() => {
      setPhase("mens");
    }, 2000);

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (phase === "mens" || phase === "womens") {
      // Reveal each player's numbers with staggered animation
      if (currentPlayerIndex < players.length) {
        const player = players[currentPlayerIndex];
        const numbers = phase === "mens" ? player.mensNumbers : player.womensNumbers;
        
        // Reset revealed numbers for this player
        setRevealedNumbers([]);
        
        // Reveal each number with a stagger
        numbers.forEach((num, idx) => {
          setTimeout(() => {
            setRevealedNumbers(prev => [...prev, num]);
          }, idx * 400);
        });

        // Move to next player after all numbers revealed + pause
        const totalRevealTime = numbers.length * 400 + 1500;
        const nextTimer = setTimeout(() => {
          if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(prev => prev + 1);
          } else {
            // All players done for this phase
            if (phase === "mens") {
              setCurrentPlayerIndex(0);
              setRevealedNumbers([]);
              setPhase("womens");
            } else {
              setPhase("complete");
              setTimeout(onComplete, 1000);
            }
          }
        }, totalRevealTime);

        return () => clearTimeout(nextTimer);
      }
    }
  }, [phase, currentPlayerIndex, players, onComplete]);

  const currentPlayer = players[currentPlayerIndex];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 50 
            }}
            animate={{ 
              y: -50,
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Intro Phase */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Crown className="mx-auto text-primary mb-6" size={120} />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black mb-4">
              <span className="text-gradient-gold">NUMBER DRAW</span>
            </h1>
            <p className="text-2xl text-muted-foreground">
              Your fate is about to be revealed...
            </p>
          </motion.div>
        )}

        {/* Men's or Women's Phase */}
        {(phase === "mens" || phase === "womens") && currentPlayer && (
          <motion.div
            key={`${phase}-${currentPlayerIndex}`}
            className="text-center w-full max-w-2xl px-8"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Rumble Type Header */}
            <motion.div 
              className="mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-4xl md:text-5xl">
                {phase === "mens" ? "🧔" : "👩"}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                {phase === "mens" ? "Men's" : "Women's"} Royal Rumble
              </h2>
            </motion.div>

            {/* Player Name */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-block bg-card border-2 border-primary rounded-2xl px-8 py-4">
                <h3 className="text-2xl md:text-3xl font-bold text-primary">
                  {currentPlayer.playerName}
                </h3>
              </div>
            </motion.div>

            {/* Number Cards */}
            <div className="flex justify-center gap-4 flex-wrap">
              {(phase === "mens" ? currentPlayer.mensNumbers : currentPlayer.womensNumbers).map((num, idx) => (
                <AnimatePresence key={num}>
                  {revealedNumbers.includes(num) && (
                    <motion.div
                      initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring",
                        damping: 12,
                        stiffness: 200
                      }}
                      className="relative perspective-1000"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-primary/50 rounded-2xl blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.8, 0.4] }}
                        transition={{ duration: 0.6 }}
                      />
                      
                      {/* Card */}
                      <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-1">
                        <div className="bg-card rounded-xl px-6 py-4 md:px-8 md:py-6">
                          <motion.div
                            className="text-4xl md:text-6xl font-black text-primary"
                            initial={{ scale: 1.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring" }}
                          >
                            #{num}
                          </motion.div>
                        </div>
                      </div>

                      {/* Sparkle effect */}
                      <motion.div
                        className="absolute -top-2 -right-2"
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: [0, 1.2, 1], rotate: 360 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Sparkles className="text-primary" size={24} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Progress indicator */}
            <motion.div 
              className="mt-12 flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {players.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === currentPlayerIndex 
                      ? "bg-primary" 
                      : idx < currentPlayerIndex 
                      ? "bg-primary/50" 
                      : "bg-muted"
                  }`}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Complete Phase */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Crown className="mx-auto text-primary mb-6" size={100} />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-gradient-gold mb-4">
              LET'S RUMBLE!
            </h2>
            <p className="text-xl text-muted-foreground">
              Good luck to all players!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
