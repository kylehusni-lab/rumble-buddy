import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Tv, Calendar, FlaskConical, User, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { JoinPartyModal } from "@/components/JoinPartyModal";
import { LegalFooter } from "@/components/LegalFooter";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { EVENT_CONFIG } from "@/lib/constants";
import { seedDemoParty } from "@/lib/demo-seeder";
import { toast } from "sonner";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type Step = "initial" | "group-choice" | "solo";

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-2 sm:p-3 min-w-[55px] sm:min-w-[65px] text-center">
      <div className="text-xl sm:text-2xl md:text-3xl font-black tabular-nums text-primary">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

export default function Index() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [step, setStep] = useState<Step>("initial");
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

  const generateGroupCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      const { data } = await supabase
        .from("parties_public")
        .select("code")
        .eq("code", code)
        .maybeSingle();
      
      if (!data) return code;
      attempts++;
    }

    throw new Error("Could not generate unique group code");
  };

  const handleCreateGroup = async () => {
    setIsCreating(true);

    try {
      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User needs to authenticate first - redirect to auth with a special flow
        // We'll generate the code first, then redirect to auth
        const sessionId = getSessionId();
        const groupCode = await generateGroupCode();

        // Create party with pending host (will be claimed after auth)
        const { error } = await supabase.from("parties").insert({
          code: groupCode,
          host_session_id: sessionId,
          status: "pre_event",
        });

        if (error) throw error;

        // Store pending party info
        localStorage.setItem("pending_host_party", groupCode);
        
        toast.success(`Group ${groupCode} created! Now sign up to claim it.`);
        navigate(`/player/auth?code=${groupCode}&host=true`);
        return;
      }

      const sessionId = getSessionId();
      const groupCode = await generateGroupCode();

      const { error } = await supabase.from("parties").insert({
        code: groupCode,
        host_session_id: sessionId,
        host_user_id: user.id,
        status: "pre_event",
      });

      if (error) throw error;

      setPlayerSession({
        sessionId,
        authUserId: user.id,
        partyCode: groupCode,
        isHost: true,
      });

      toast.success(`Group ${groupCode} created!`);
      navigate(`/player/auth?code=${groupCode}&host=true`);
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDemoMode = async () => {
    setIsCreatingDemo(true);

    try {
      // Check if user is already logged in
      let userId: string;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo mode, create a temporary demo account
        const demoEmail = `demo-${Date.now()}@rumble-buddy.demo`;
        const demoPassword = `demo-${Date.now()}-${Math.random().toString(36)}`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });
        
        if (signUpError || !signUpData.user) {
          toast.error("Failed to create demo session");
          setIsCreatingDemo(false);
          return;
        }
        userId = signUpData.user.id;
      } else {
        userId = user.id;
      }

      const sessionId = getSessionId();
      const demoCode = await generateGroupCode();

      const { error: partyError } = await supabase.from("parties").insert({
        code: demoCode,
        host_session_id: sessionId,
        host_user_id: userId,
        status: "pre_event",
        host_pin: "0000",
      });

      if (partyError) throw partyError;

      const { hostPlayerId } = await seedDemoParty(demoCode, sessionId, userId);

      setPlayerSession({
        sessionId,
        authUserId: userId,
        playerId: hostPlayerId,
        partyCode: demoCode,
        displayName: "Kyle",
        email: "kyle.husni@gmail.com",
        isHost: true,
      });

      localStorage.setItem(`party_${demoCode}_pin`, "0000");

      toast.success(`Demo group ${demoCode} created with 6 players!`);
      navigate(`/host/setup/${demoCode}`);
    } catch (err) {
      console.error("Error creating demo:", err);
      toast.error("Failed to create demo group");
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "initial":
        return (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <p className="text-center text-muted-foreground mb-6">
              How do you want to play?
            </p>

            <div className="space-y-2">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => setStep("group-choice")}
              >
                <Users className="mr-2" size={24} />
                Watch with Friends
                <ArrowRight className="ml-auto" size={20} />
              </Button>
              <p className="text-xs text-muted-foreground text-center px-2">
                Host or join a group to compete with friends at your watch party
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="xl"
                className="w-full"
                onClick={() => navigate("/solo/setup")}
              >
                <User className="mr-2" size={24} />
                Play Solo
                <ArrowRight className="ml-auto" size={20} />
              </Button>
              <p className="text-xs text-muted-foreground text-center px-2">
                Make picks and track your score on your own
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="default"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleDemoMode}
                disabled={isCreatingDemo}
              >
                <FlaskConical className="mr-2" size={18} />
                {isCreatingDemo ? "Creating Demo..." : "Try Demo Mode"}
              </Button>
            </div>
          </motion.div>
        );

      case "group-choice":
        return (
          <motion.div
            key="group-choice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("initial")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <p className="text-center text-muted-foreground mb-6">
              Are you hosting or joining a group?
            </p>

            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleCreateGroup}
              disabled={isCreating}
            >
              <Crown className="mr-2" size={24} />
              {isCreating ? "Creating..." : "I'm Hosting"}
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-2 mb-2">
              Start a new group and invite friends
            </p>

            <Button
              variant="purple"
              size="xl"
              className="w-full"
              onClick={() => setIsJoinModalOpen(true)}
            >
              <Users className="mr-2" size={24} />
              Join a Group
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Enter a 4-digit code from your host
            </p>
          </motion.div>
        );

      default:
        return null;
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
          className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar size={16} className="text-primary flex-shrink-0" />
          <span className="text-center">{EVENT_CONFIG.DATE.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {EVENT_CONFIG.VENUE}</span>
        </motion.div>

        {/* Countdown Timer */}
        {timeRemaining && (
          <motion.div
            className="flex justify-center gap-1.5 sm:gap-2 md:gap-3"
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

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-muted-foreground text-xs">
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

      <LegalFooter />
    </div>
  );
}
