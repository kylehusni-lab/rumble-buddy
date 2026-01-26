import { motion } from "framer-motion";
import royalRumbleLogo from "@/assets/royal-rumble-logo.jpeg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { width: 120, title: "text-sm" },
    md: { width: 180, title: "text-sm" },
    lg: { width: 280, title: "text-lg" },
  };

  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={royalRumbleLogo}
        alt="Royal Rumble 2026"
        style={{ width: sizes[size].width }}
        className="object-contain"
        animate={{ 
          scale: [1, 1.02, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 2 
        }}
      />

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
