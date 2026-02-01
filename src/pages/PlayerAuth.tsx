import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OttLogoImage } from "@/components/logo";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, setPlayerSession } from "@/lib/session";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

export default function PlayerAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partyCode = searchParams.get("code") || "";
  const isHostJoining = searchParams.get("host") === "true";

  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [partyStatus, setPartyStatus] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please log in instead.");
          setMode("login");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account. Please try again.");
        return;
      }

      // Create player record
      await createPlayerAndNavigate(authData.user.id);
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error("Login failed. Please try again.");
        return;
      }

      // Check if player already exists in this party
      const { data: existingPlayers } = await supabase.rpc("lookup_player_by_email", {
        p_party_code: partyCode,
        p_email: email.toLowerCase().trim(),
      });

      const existingPlayer = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

      if (existingPlayer) {
        // Update session for returning player
        const sessionId = getSessionId();
        await supabase
          .from("players")
          .update({
            session_id: sessionId,
            user_id: authData.user.id,
          })
          .eq("id", existingPlayer.id);

        setPlayerSession({
          sessionId,
          authUserId: authData.user.id,
          playerId: existingPlayer.id,
          partyCode,
          displayName: existingPlayer.display_name,
          email: email.toLowerCase().trim(),
          isHost: isHostJoining,
        });

        toast.success("Welcome back!");
        
        if (isHostJoining) {
          navigate(`/host/setup/${partyCode}`);
        } else {
          navigate(`/player/dashboard/${partyCode}`);
        }
      } else {
        // User exists but not in this party - need display name
        if (!displayName.trim()) {
          toast.error("Please enter a display name to join this party");
          setMode("signup"); // Switch to signup to show display name field
          return;
        }
        await createPlayerAndNavigate(authData.user.id);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createPlayerAndNavigate = async (userId: string) => {
    const sessionId = getSessionId();

    try {
      // If host is joining, try to claim the party first
      if (isHostJoining) {
        const claimSuccess = await claimPartyAsHost(userId);
        if (claimSuccess) {
          // Create player record after successfully claiming
          const { data: newPlayer, error } = await supabase
            .from("players")
            .insert({
              party_code: partyCode,
              email: email.toLowerCase().trim(),
              display_name: displayName.trim(),
              session_id: sessionId,
              user_id: userId,
            })
            .select("id")
            .single();

          if (error && error.code !== "23505") {
            throw error;
          }

          const playerId = newPlayer?.id || userId;

          setPlayerSession({
            sessionId,
            authUserId: userId,
            playerId,
            partyCode,
            displayName: displayName.trim(),
            email: email.toLowerCase().trim(),
            isHost: true,
          });

          toast.success("You're now the host of this party!");
          navigate(`/host/setup/${partyCode}`);
          return;
        }
      }

      // Regular player flow
      const { data: newPlayer, error } = await supabase
        .from("players")
        .insert({
          party_code: partyCode,
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          session_id: sessionId,
          user_id: userId,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("You're already in this party. Try logging in.");
          setMode("login");
          return;
        }
        throw error;
      }

      setPlayerSession({
        sessionId,
        authUserId: userId,
        playerId: newPlayer.id,
        partyCode,
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        isHost: false,
      });

      toast.success("Account created! Welcome to the party!");
      navigate(`/player/picks/${partyCode}`);
    } catch (err) {
      console.error("Error creating player:", err);
      toast.error("Failed to join party. Please try again.");
    }
  };

  const claimPartyAsHost = async (userId: string): Promise<boolean> => {
    try {
      // Check if party has no host (unclaimed)
      const { data: party } = await supabase
        .from("parties")
        .select("host_user_id")
        .eq("code", partyCode)
        .single();

      if (!party) return false;

      // If party already has a host, don't claim
      if (party.host_user_id) {
        console.log("Party already has a host");
        return false;
      }

      // Claim the party as host
      const { error } = await supabase
        .from("parties")
        .update({ host_user_id: userId })
        .eq("code", partyCode)
        .is("host_user_id", null);

      if (error) {
        console.error("Failed to claim party:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error claiming party:", err);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      handleSignUp();
    } else {
      handleLogin();
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

        <div className="flex flex-col items-center gap-3">
          <OttLogoImage size="sm" showTagline />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6 bg-card border border-border rounded-2xl p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log In
            </button>
          </div>

          <h2 className="text-2xl font-bold text-center">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </h2>

          <div className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name for the leaderboard"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 text-lg"
                  required={mode === "signup"}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Email
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock size={16} className="text-primary" />
                  Password
                </Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder={mode === "signup" ? "Create a password (6+ chars)" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "signup" ? "Creating Account..." : "Logging In..."}
              </>
            ) : (
              <>{mode === "signup" ? "Create Account & Join" : "Log In & Join"}</>
            )}
          </Button>

          {partyStatus === "live" && (
            <p className="text-center text-muted-foreground text-sm">
              Event is in progress. Your picks may be locked.
            </p>
          )}

          <p className="text-center text-muted-foreground text-xs">
            {mode === "signup"
              ? "Already have an account? Click Log In above."
              : "New here? Click Sign Up above to create an account."}
          </p>
        </motion.form>
      </motion.div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        defaultEmail={email}
      />
    </div>
  );
}
