// DemoMode launcher - Creates demo party and redirects
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OttLogoImage } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { seedDemoParty } from "@/lib/demo-seeder";
import { toast } from "sonner";

export default function DemoMode() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing demo...");

  useEffect(() => {
    createDemoParty();
  }, []);

  const generateGroupCode = async (): Promise<string> => {
    // Use same character set as AdminDashboard - excludes confusing chars (0,O,I,1,L)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
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
      setStatus("Checking authentication...");
      
      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo mode, we'll create a temporary demo account
        const demoEmail = `demo-${Date.now()}@therumbleapp.demo`;
        const demoPassword = `demo-${Date.now()}-${Math.random().toString(36)}`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });
        
        if (signUpError || !signUpData.user) {
          toast.error("Failed to create demo session");
          navigate("/");
          return;
        }
      }
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
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
        host_user_id: currentUser.id,
        status: "pre_event",
        is_demo: true,
        event_id: "rumble_2026",
      });

      if (partyError) throw partyError;

      setStatus("Seeding players and picks...");
      const { hostPlayerId } = await seedDemoParty(demoCode, sessionId, currentUser.id);

      setPlayerSession({
        sessionId,
        authUserId: currentUser.id,
        playerId: hostPlayerId,
        partyCode: demoCode,
        displayName: "Kyle",
        email: "demo@example.com",
        isHost: true,
      });

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
        <OttLogoImage size="sm" className="mx-auto animate-pulse" />
        <div className="space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-ott-accent" />
          <p className="text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
}
