import { motion } from "framer-motion";
import { Crown, Clock, Trophy, Star } from "lucide-react";
import { useEffect } from "react";

export type CelebrationType = "final-four" | "iron-man" | "winner";

interface FinalFourData {
  wrestlers: Array<{
    number: number;
    wrestlerName: string;
    ownerName: string;
  }>;
  rumbleType: "mens" | "womens";
}

interface IronManData {
  number: number;
  wrestlerName: string;
  ownerName: string;
  duration: string;
  rumbleType: "mens" | "womens";
}

interface WinnerData {
  number: number;
  wrestlerName: string;
  ownerName: string;
  rumbleType: "mens" | "womens";
}

interface CelebrationOverlayProps {
  type: CelebrationType;
  data: FinalFourData | IronManData | WinnerData;
  onComplete: () => void;
}

export function CelebrationOverlay({ type, data, onComplete }: CelebrationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 6000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const rumbleLabel = (data as any).rumbleType === "mens" ? "🧔 Men's" : "👩 Women's";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden"
      onClick={onComplete}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.3] }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-transparent to-transparent" />
      </motion.div>

      {/* Main content */}
      {type === "final-four" && <FinalFourContent data={data as FinalFourData} rumbleLabel={rumbleLabel} />}
      {type === "iron-man" && <IronManContent data={data as IronManData} rumbleLabel={rumbleLabel} />}
      {type === "winner" && <WinnerContent data={data as WinnerData} rumbleLabel={rumbleLabel} />}

      {/* Click to dismiss hint */}
      <motion.div
        className="absolute bottom-8 text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Tap to dismiss
      </motion.div>
    </motion.div>
  );
}

function FinalFourContent({ data, rumbleLabel }: { data: FinalFourData; rumbleLabel: string }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.8 }}
      className="text-center px-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-muted-foreground mb-2"
      >
        {rumbleLabel} Rumble
      </motion.div>

      <motion.h1
        className="text-6xl md:text-8xl font-black gold-shimmer bg-clip-text text-transparent mb-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        FINAL FOUR!
      </motion.h1>

      <motion.div
        className="flex items-center justify-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Star className="text-primary" size={24} />
        <span className="text-primary text-xl font-bold">+10 pts each</span>
        <Star className="text-primary" size={24} />
      </motion.div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {data.wrestlers.map((wrestler, index) => (
          <motion.div
            key={wrestler.number}
            className="bg-card/80 backdrop-blur border-2 border-primary rounded-xl p-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.15, type: "spring" }}
          >
            <div className="text-3xl font-black text-primary mb-1">
              #{wrestler.number}
            </div>
            <div className="font-bold text-lg truncate">{wrestler.wrestlerName}</div>
            <div className="text-muted-foreground text-sm">{wrestler.ownerName}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function IronManContent({ data, rumbleLabel }: { data: IronManData; rumbleLabel: string }) {
  const label = data.rumbleType === "mens" ? "IRON MAN" : "IRON WOMAN";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.8 }}
      className="text-center px-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-muted-foreground mb-2"
      >
        {rumbleLabel} Rumble
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-4 mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <Clock className="text-primary" size={48} />
      </motion.div>

      <motion.h1
        className="text-5xl md:text-7xl font-black gold-shimmer bg-clip-text text-transparent mb-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        {label}!
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-lg mb-6"
      >
        Longest time in the ring
      </motion.div>

      <motion.div
        className="bg-card/80 backdrop-blur border-2 border-primary rounded-2xl p-6 max-w-md mx-auto"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      >
        <div className="text-5xl font-black text-primary mb-2">
          #{data.number}
        </div>
        <div className="text-3xl font-bold mb-2">{data.wrestlerName}</div>
        <div className="text-2xl text-primary font-bold mb-2">{data.duration}</div>
        <div className="text-muted-foreground">
          Owned by <span className="text-foreground font-semibold">{data.ownerName}</span>
        </div>
        <div className="mt-4 text-primary font-bold text-lg">+20 pts</div>
      </motion.div>
    </motion.div>
  );
}

function WinnerContent({ data, rumbleLabel }: { data: WinnerData; rumbleLabel: string }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.8 }}
      className="text-center px-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-muted-foreground mb-2"
      >
        {rumbleLabel} Rumble
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-4 mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <Trophy className="text-primary" size={64} />
      </motion.div>

      <motion.h1
        className="text-6xl md:text-8xl font-black gold-shimmer bg-clip-text text-transparent mb-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        WINNER!
      </motion.h1>

      <motion.div
        className="bg-card/80 backdrop-blur border-4 border-primary rounded-2xl p-8 max-w-lg mx-auto wrestler-glow"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      >
        <div className="text-6xl font-black text-primary mb-3">
          #{data.number}
        </div>
        <div className="text-4xl font-bold mb-4">{data.wrestlerName}</div>
        <div className="text-muted-foreground text-lg">
          Owned by <span className="text-foreground font-semibold">{data.ownerName}</span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Crown className="text-primary" size={28} />
          <span className="text-primary font-bold text-2xl">+50 pts</span>
          <Crown className="text-primary" size={28} />
        </div>
      </motion.div>
    </motion.div>
  );
}
