import { AnimatePresence, motion } from "framer-motion";
import { ScoreEvent } from "@/hooks/useTvScoreQueue";

interface TvScorePopupProps {
  event: ScoreEvent | null;
}

export function TvScorePopup({ event }: TvScorePopupProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
        >
          <div 
            className="px-8 py-4 rounded-xl font-extrabold text-3xl text-black"
            style={{
              background: "linear-gradient(135deg, #f5c518 0%, #e6b800 100%)",
              boxShadow: "0 10px 40px rgba(245, 197, 24, 0.5)",
            }}
          >
            {event.points > 0 ? "+" : ""}{event.points} {event.playerName}!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
