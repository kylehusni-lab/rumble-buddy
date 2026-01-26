import { Crown } from "lucide-react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { icon: 24, title: "text-xl", subtitle: "text-xs" },
    md: { icon: 40, title: "text-3xl", subtitle: "text-sm" },
    lg: { icon: 64, title: "text-5xl", subtitle: "text-lg" },
  };

  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: [0, -5, 5, 0],
            scale: [1, 1.05, 1.05, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3 
          }}
        >
          <Crown 
            size={sizes[size].icon} 
            className="text-primary drop-shadow-[0_0_15px_hsla(43,75%,52%,0.5)]" 
          />
        </motion.div>
      </div>
      
      <div className="text-center">
        <h1 className={`${sizes[size].title} font-black tracking-tight`}>
          <span className="text-gradient-gold">ROYAL</span>
          <span className="text-foreground"> RUMBLE</span>
        </h1>
        <p className={`${sizes[size].subtitle} text-muted-foreground font-medium tracking-widest uppercase`}>
          2026 Party Tracker
        </p>
      </div>

      {showTagline && (
        <motion.p 
          className="text-muted-foreground text-sm mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Kingdom Arena • Riyadh • Feb 1, 2026
        </motion.p>
      )}
    </motion.div>
  );
}
