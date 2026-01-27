import { motion } from "framer-motion";
import royalRumbleLogo from "@/assets/royal-rumble-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function Logo({ size = "md", showTagline = false, className }: LogoProps) {
  const sizes = {
    sm: { width: 120, title: "text-sm" },
    md: { width: 180, title: "text-sm" },
    lg: { width: 280, title: "text-lg" },
  };

  return (
    <motion.div 
      className={`flex flex-col items-center gap-2 ${className || ""}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo with glow effect */}
      <div className="relative">
        {/* Background glow */}
        <div 
          className="absolute inset-0 blur-3xl scale-150 opacity-40"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 40%, transparent 70%)'
          }}
        />
        
        <motion.img
          src={royalRumbleLogo}
          alt="Royal Rumble 2026"
          style={{ width: sizes[size].width }}
          className="object-contain relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          animate={{ 
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            repeatDelay: 2 
          }}
        />
      </div>

      {showTagline && (
        <motion.p 
          className={`text-muted-foreground ${sizes[size].title} mt-2`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Party Tracker
        </motion.p>
      )}
    </motion.div>
  );
}
