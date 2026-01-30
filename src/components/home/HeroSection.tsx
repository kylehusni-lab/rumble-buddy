import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OttLogoHero, OttWordmark } from "@/components/OttLogo";
import { EVENT_CONFIG } from "@/lib/constants";

interface HeroSectionProps {
  onRequestAccess: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg sm:text-2xl lg:text-3xl font-black tabular-nums text-ott-accent">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

export function HeroSection({ onRequestAccess }: HeroSectionProps) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = EVENT_CONFIG.DATE.getTime() - now;

      if (diff <= 0) {
        setIsLive(true);
        return;
      }

      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-20 items-center">
          {/* Content Left */}
          <motion.div 
            className="space-y-8 order-2 lg:order-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Event Banner - stacks on mobile */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 bg-ott-surface-elevated border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ott-accent">
                  Next Event
                </span>
                <span className="font-semibold">Royal Rumble</span>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-1 sm:gap-2 sm:ml-2 sm:pl-3 sm:border-l border-border">
                  <CountdownUnit value={timeRemaining.days} label="d" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.hours} label="h" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.minutes} label="m" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.seconds} label="s" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
              <OttWordmark />
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-md">
              Your tag team partner for watch party night. Make your picks, track entries, 
              and compete with friends in real-time.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row">
              {isLive ? (
                <Button 
                  onClick={() => navigate("/join")}
                  size="lg"
                  className="w-full sm:w-auto bg-ott-accent text-background hover:bg-ott-accent/90 font-bold animate-pulse"
                >
                  Join Live Party
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={onRequestAccess}
                    size="lg"
                    className="w-full sm:w-auto bg-ott-accent text-background hover:bg-ott-accent/90 font-bold"
                  >
                    Request Access
                  </Button>
                  <Button 
                    onClick={() => navigate("/join")}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-border"
                  >
                    Join with Code
                  </Button>
                </>
              )}
            </div>

            {/* Demo Link */}
            <button 
              onClick={() => navigate("/demo")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Try the demo
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>

          {/* Logo Right */}
          <motion.div 
            className="flex justify-center order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-ott-accent/10 rounded-full blur-3xl scale-150" />
              <OttLogoHero size={180} className="relative z-10 sm:w-[240px] sm:h-[240px] lg:w-[300px] lg:h-[300px]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
