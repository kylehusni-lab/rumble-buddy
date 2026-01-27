import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Crown, Tv, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { JoinPartyModal } from "@/components/JoinPartyModal";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { EVENT_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 min-w-[65px] text-center">
      <div className="text-2xl md:text-3xl font-black tabular-nums text-primary">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

export default function Index() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function calculateTimeRemaining(): TimeRemaining {
      const now = new Date().getTime();
      const distance = EVENT_CONFIG.DATE.getTime() - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    }

    setTimeRemaining(calculateTimeRemaining());
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const generatePartyCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      const { data } = await supabase
        .from("parties")
        .select("code")
        .eq("code", code)
        .maybeSingle();
      
      if (!data) return code;
      attempts++;
    }

    throw new Error("Could not generate unique party code");
  };

  const handleCreateParty = async () => {
    setIsCreating(true);

    try {
      const sessionId = getSessionId();
      const partyCode = await generatePartyCode();

      const { error } = await supabase.from("parties").insert({
        code: partyCode,
        host_session_id: sessionId,
        status: "pre_event",
      });

      if (error) throw error;

      setPlayerSession({
        sessionId,
        partyCode,
        isHost: true,
      });

      toast.success(`Party ${partyCode} created!`);
      navigate(`/host/setup/${partyCode}`);
    } catch (err) {
      console.error("Error creating party:", err);
      toast.error("Failed to create party. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <Logo size="lg" showTagline />

        {/* Event Badge */}
        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar size={16} className="text-primary" />
          <span>{EVENT_CONFIG.DATE.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {EVENT_CONFIG.VENUE}, {EVENT_CONFIG.LOCATION.split(',')[0]}</span>
        </motion.div>

        {/* Countdown Timer */}
        {timeRemaining && (
          <motion.div
            className="flex justify-center gap-2 md:gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CountdownUnit value={timeRemaining.days} label="Days" />
            <CountdownUnit value={timeRemaining.hours} label="Hours" />
            <CountdownUnit value={timeRemaining.minutes} label="Min" />
            <CountdownUnit value={timeRemaining.seconds} label="Sec" />
          </motion.div>
        )}

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleCreateParty}
            disabled={isCreating}
          >
            <Crown className="mr-2" size={24} />
            {isCreating ? "Creating..." : "Create Party"}
          </Button>

          <Button
            variant="purple"
            size="xl"
            className="w-full"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <Users className="mr-2" size={24} />
            Join Party
          </Button>
        </motion.div>

        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground text-sm">
            Track picks, prop bets & Rumble numbers in real-time
          </p>

          <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <Tv size={16} className="text-primary" />
              <span>TV display mode</span>
            </div>
          </div>
        </motion.div>
      </div>

      <JoinPartyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
