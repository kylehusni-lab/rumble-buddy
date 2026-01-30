// DemoMode launcher - Creates demo party and redirects
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OttLogoMark } from "@/components/OttLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { seedDemoParty } from "@/lib/demo-seeder";
import { toast } from "sonner";

export default function DemoMode() {
  const navigate = useNavigate();
  const { ensureAuth } = useAuth();
  const [status, setStatus] = useState("Initializing demo...");

  useEffect(() => {
    createDemoParty();
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

  const createDemoParty = async () => {
    try {
      setStatus("Authenticating...");
      const authUser = await ensureAuth();
      if (!authUser) {
        toast.error("Authentication failed");
        navigate("/");
        return;
      }

      setStatus("Creating demo party...");
      const sessionId = getSessionId();
      const demoCode = await generateGroupCode();

      const { error: partyError } = await supabase.from("parties").insert({
        code: demoCode,
        host_session_id: sessionId,
        host_user_id: authUser.id,
        status: "pre_event",
        host_pin: "0000",
      });

      if (partyError) throw partyError;

      setStatus("Seeding players and picks...");
      const { hostPlayerId } = await seedDemoParty(demoCode, sessionId, authUser.id);

      setPlayerSession({
        sessionId,
        authUserId: authUser.id,
        playerId: hostPlayerId,
        partyCode: demoCode,
        displayName: "Kyle",
        email: "demo@example.com",
        isHost: true,
      });

      localStorage.setItem(`party_${demoCode}_pin`, "0000");

      toast.success(`Demo party ${demoCode} created!`);
      navigate(`/host/setup/${demoCode}`);
    } catch (err) {
      console.error("Demo creation error:", err);
      toast.error("Failed to create demo");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <OttLogoMark size={64} className="mx-auto animate-pulse" />
        <div className="space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-ott-accent" />
          <p className="text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
}
