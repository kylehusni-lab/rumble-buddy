import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trophy, Users, ArrowLeft } from "lucide-react";

interface SignupChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "choose" | "solo" | "group";

function generatePartyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function SignupChoiceModal({ isOpen, onClose }: SignupChoiceModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode("choose");
    setName("");
    setEmail("");
    setPassword("");
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const ensureSignedIn = async () => {
    // Try sign up; if user exists, fall back to sign in
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name.trim() },
      },
    });

    if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
      throw signUpError;
    }

    if (!signUpData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
    }
  };

  const handleSoloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast.error("Please fill all fields (password 6+ characters)");
      return;
    }
    setSubmitting(true);
    try {
      await ensureSignedIn();
      const { error: rpcError } = await supabase.rpc("get_or_create_solo_player", {
        p_display_name: name.trim(),
      });
      if (rpcError) throw rpcError;
      toast.success("Welcome! Let's make your picks.");
      handleClose();
      navigate("/solo/picks");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Signup failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast.error("Please fill all fields (password 6+ characters)");
      return;
    }
    setSubmitting(true);
    try {
      await ensureSignedIn();

      // Try a few codes in case of collision
      let code = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const tryCode = generatePartyCode();
        const { error } = await supabase.rpc("create_party_as_host", { p_code: tryCode });
        if (!error) {
          code = tryCode;
          break;
        }
        if (!error?.message?.includes("already exists")) {
          throw error;
        }
      }
      if (!code) throw new Error("Could not generate a unique party code");

      toast.success(`Party created! Code: ${code}`);
      handleClose();
      navigate(`/host/setup/${code}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Signup failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-ott-surface border-border">
        {mode === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Get Started</DialogTitle>
              <DialogDescription>Choose how you want to play.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <button
                onClick={() => {
                  handleClose();
                  navigate("/sign-in?redirect=/solo/picks&mode=solo");
                }}
                className="w-full text-left p-4 rounded-lg border border-border bg-ott-surface-elevated hover:border-ott-accent transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Trophy className="w-6 h-6 text-ott-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Join Global Leaderboard</div>
                    <div className="text-sm text-muted-foreground">
                      Play solo and compete against everyone for the active event.
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode("group")}
                className="w-full text-left p-4 rounded-lg border border-border bg-ott-surface-elevated hover:border-ott-accent transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-ott-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Host a Group</div>
                    <div className="text-sm text-muted-foreground">
                      Create a party with a code and invite up to 9 friends.
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {(mode === "solo" || mode === "group") && (
          <>
            <DialogHeader>
              <button
                onClick={() => setMode("choose")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 self-start"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <DialogTitle>
                {mode === "solo" ? "Create Your Account" : "Create Host Account"}
              </DialogTitle>
              <DialogDescription>
                {mode === "solo"
                  ? "Sign up to start making picks for the global leaderboard."
                  : "Sign up and we'll generate your party code instantly."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={mode === "solo" ? handleSoloSubmit : handleGroupSubmit}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-ott-surface-elevated border-border"
                  required
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-ott-surface-elevated border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-ott-surface-elevated border-border"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : mode === "solo" ? (
                  "Start Playing"
                ) : (
                  "Create Party"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate("/sign-in");
                  }}
                  className="text-ott-accent hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
