import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OttLogoImage } from "@/components/logo";
import { EVENT_CONFIG } from "@/lib/constants";

interface HeroSectionProps {
  onRequestAccess: () => void;
  onLearnMore?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="text-center">
    <div className="text-lg sm:text-2xl lg:text-3xl font-black tabular-nums text-ott-accent">
      {String(value).padStart(2, '0')}
    </div>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
      {label}
    </div>
  </div>
);

export function HeroSection({ onRequestAccess, onLearnMore }: HeroSectionProps) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [activeNightIndex, setActiveNightIndex] = useState(0);

  // Get the next upcoming night or the first night if all passed
  useEffect(() => {
    const now = Date.now();
    const nights = EVENT_CONFIG.NIGHTS;
    
    // Find the first night that hasn't ended (assuming 6-hour event window)
    const nextNightIdx = nights.findIndex(night => {
      const eventEnd = night.date.getTime() + (6 * 60 * 60 * 1000); // 6 hours after start
      return eventEnd > now;
    });
    
    setActiveNightIndex(nextNightIdx >= 0 ? nextNightIdx : 0);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const targetDate = EVENT_CONFIG.NIGHTS[activeNightIndex]?.date || EVENT_CONFIG.DATE;
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        // Check if there's another night coming up
        if (EVENT_CONFIG.IS_MULTI_NIGHT && activeNightIndex < EVENT_CONFIG.NIGHTS.length - 1) {
          const nextNightDiff = EVENT_CONFIG.NIGHTS[activeNightIndex + 1].date.getTime() - now;
          if (nextNightDiff > 0) {
            setActiveNightIndex(activeNightIndex + 1);
            return;
          }
        }
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
  }, [activeNightIndex]);

  // Format the event date display
  const getEventDateDisplay = () => {
    if (EVENT_CONFIG.IS_MULTI_NIGHT) {
      const night1 = EVENT_CONFIG.NIGHTS[0].date;
      const night2 = EVENT_CONFIG.NIGHTS[1].date;
      const month = night1.toLocaleDateString('en-US', { month: 'short' });
      return `${month} ${night1.getDate()}-${night2.getDate()}`;
    }
    return EVENT_CONFIG.DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get the current night label for multi-night events
  const getCurrentNightLabel = () => {
    if (!EVENT_CONFIG.IS_MULTI_NIGHT) return null;
    return EVENT_CONFIG.NIGHTS[activeNightIndex]?.label || 'Night 1';
  };

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-20 items-center">
          {/* Content */}
          <motion.div 
            className="space-y-6 lg:space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo + Title together on mobile, title only on desktop */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              {/* Ring icon - visible on mobile, hidden on desktop (shown in right column) */}
              <motion.div 
                className="lg:hidden relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <OttLogoImage size="lg" showTagline />
              </motion.div>
            </div>

            {/* Event Banner with Countdown */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 bg-ott-surface-elevated border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ott-accent">
                  Next Event
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold">{EVENT_CONFIG.TITLE}</span>
                  {EVENT_CONFIG.IS_MULTI_NIGHT && (
                    <span className="text-xs text-muted-foreground">
                      {getEventDateDisplay()} {getCurrentNightLabel() && !isLive && `- Countdown to ${getCurrentNightLabel()}`}
                    </span>
                  )}
                </div>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-1 sm:gap-2 sm:ml-2 sm:pl-3 sm:border-l border-border">
                  <CountdownUnit value={timeRemaining.days} label="days" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.hours} label="hrs" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.minutes} label="min" />
                  <span className="text-muted-foreground text-sm">:</span>
                  <CountdownUnit value={timeRemaining.seconds} label="sec" />
                </div>
              )}
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-center lg:text-left leading-tight">
              Every Kick-out. Every Count-out. Every Crown.
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-md text-center lg:text-left">
              The ultimate companion for every WWE Premium Live Event. Make your picks, track the drama, and turn every PLE into a competition with friends.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
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
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                    <Button 
                      onClick={onRequestAccess}
                      size="lg"
                      className="w-full sm:w-auto bg-ott-accent text-background hover:bg-ott-accent/90 font-bold"
                    >
                      Request Access
                    </Button>
                    {/* Join with Code hidden until WrestleMania is ready */}
                  </div>
                  
                  {/* Demo CTA - Prominent */}
                  <Button 
                    onClick={() => navigate("/demo")}
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-ott-accent hover:text-ott-accent hover:bg-ott-accent/10 font-semibold"
                  >
                    Try the Demo
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Logo Right - desktop only */}
          <motion.div 
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <OttLogoImage size="xl" showTagline />
          </motion.div>
        </div>

        {/* Learn More - below grid, not absolute */}
        <motion.button
          onClick={onLearnMore}
          className="mt-12 mx-auto flex flex-col items-center gap-1.5 
                     px-5 py-2.5 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm
                     text-muted-foreground hover:text-foreground hover:border-border transition-colors
                     cursor-pointer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <span className="text-xs font-medium uppercase tracking-wider">Learn More</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
