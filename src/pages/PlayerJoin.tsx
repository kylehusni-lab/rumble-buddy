import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { toast } from "sonner";

export default function PlayerJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partyCode = searchParams.get("code") || "";
  const isHostJoining = searchParams.get("host") === "true";

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
        .from("parties")
        .select("status")
        .eq("code", partyCode)
        .maybeSingle();

      if (!data) {
        toast.error("Party not found");
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
      const sessionId = getSessionId();

      // Check if player already exists with this email
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id, display_name, session_id")
        .eq("party_code", partyCode)
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      let playerId: string;

      if (existingPlayer) {
        // Update session and display name for returning player
        await supabase
          .from("players")
          .update({ 
            session_id: sessionId,
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
          })
          .select("id")
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.error("This email is already in use for this party");
            return;
          }
          throw error;
        }

        playerId = newPlayer.id;
        toast.success("Joined the party!");
      }

      setPlayerSession({
        sessionId,
        playerId,
        partyCode,
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        isHost: isHostJoining,
      });

      // Redirect based on host status and party status
      if (isHostJoining) {
        navigate(`/host/setup/${partyCode}`);
      } else if (partyStatus === "live") {
        navigate(`/player/dashboard/${partyCode}`);
      } else {
        navigate(`/player/picks/${partyCode}`);
      }
    } catch (err) {
      console.error("Error joining party:", err);
      toast.error("Failed to join party. Please try again.");
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
            Party {partyCode}
          </div>
        </div>

        <Logo size="md" />

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6 bg-card border border-border rounded-2xl p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-center">
            {isHostJoining ? "Join Your Party" : "Join Party"}
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
