import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OttLogoMark } from "@/components/OttLogo";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PlayerJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partyCode = searchParams.get("code") || "";
  const isHostJoining = searchParams.get("host") === "true";
  const { ensureAuth } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [partyStatus, setPartyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!partyCode) {
      navigate("/");
      return;
    }

    const checkParty = async () => {
      const { data } = await supabase
        .from("parties_public")
        .select("status")
        .eq("code", partyCode)
        .maybeSingle();

      if (!data) {
        toast.error("Group not found");
        navigate("/");
        return;
      }

      setPartyStatus(data.status);
    };

    checkParty();
  }, [partyCode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) return;

    setIsLoading(true);

    try {
      // Ensure user is authenticated (anonymous if needed)
      const authUser = await ensureAuth();
      if (!authUser) {
        toast.error("Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }

      const sessionId = getSessionId();

      // Check if player already exists with this email using secure RPC function
      // This prevents direct SELECT access to the players table which would expose emails
      const { data: existingPlayers } = await supabase
        .rpc("lookup_player_by_email", { 
          p_party_code: partyCode, 
          p_email: email.toLowerCase().trim() 
        });

      const existingPlayer = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

      let playerId: string;

      if (existingPlayer) {
        // Update session and display name for returning player
        await supabase
          .from("players")
          .update({ 
            session_id: sessionId,
            user_id: authUser.id, // Link to auth user
            display_name: displayName.trim()
          })
          .eq("id", existingPlayer.id);

        playerId = existingPlayer.id;
        toast.success("Welcome back! Your picks have been restored.");
      } else {
        // Create new player
        const { data: newPlayer, error } = await supabase
          .from("players")
          .insert({
            party_code: partyCode,
            email: email.toLowerCase().trim(),
            display_name: displayName.trim(),
            session_id: sessionId,
            user_id: authUser.id, // Link to auth user
          })
          .select("id")
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.error("This email is already in use for this group");
            return;
          }
          throw error;
        }

        playerId = newPlayer.id;
        toast.success("Joined the group!");
      }

      setPlayerSession({
        sessionId,
        authUserId: authUser.id,
        playerId,
        partyCode,
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        isHost: isHostJoining,
      });

      // Redirect based on host status and player type
      if (isHostJoining) {
        navigate(`/host/setup/${partyCode}`);
      } else if (existingPlayer) {
        // Returning players go to dashboard (more natural hub)
        navigate(`/player/dashboard/${partyCode}`);
      } else {
        // New players go to picks to complete initial submission
        navigate(`/player/picks/${partyCode}`);
      }
    } catch (err) {
      console.error("Error joining group:", err);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />

      <motion.div
        className="relative z-10 w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-primary/20 text-primary px-4 py-2 rounded-full font-bold">
            Group {partyCode}
          </div>
        </div>

        <OttLogoMark size={48} className="mx-auto" />

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6 bg-card border border-border rounded-2xl p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-center">
            {isHostJoining ? "Join Your Group" : "Join Group"}
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User size={16} className="text-primary" />
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Email <span className="text-muted-foreground text-xs">(for device recovery)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={isLoading || !displayName.trim() || !email.trim()}
          >
            {isLoading ? "Joining..." : "Continue →"}
          </Button>

          {partyStatus === "live" && (
            <p className="text-center text-muted-foreground text-sm">
              ⚠️ Event is in progress. Your picks may be locked.
            </p>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
}
