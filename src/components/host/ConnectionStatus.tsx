import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Wifi } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 bg-destructive/90 border-b border-destructive p-3 z-50"
        >
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-white animate-pulse" />
            <span className="text-white text-sm font-medium">
              Connection Lost - Reconnecting...
            </span>
            <Wifi className="w-4 h-4 text-white/50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
