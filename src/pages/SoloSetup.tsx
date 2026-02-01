import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowRight, Sparkles, Mail, Lock, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OttLogoImage } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SoloSetup() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signUp, signIn } = useAuth();
  
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      // User is authenticated, check for existing solo player
      checkAndSetupSoloPlayer();
    }
  }, [authLoading, user]);

  const checkAndSetupSoloPlayer = async () => {
    if (!user) return;

    try {
      // Check if solo player exists for this user
      const { data, error } = await supabase
        .from("solo_players")
        .select("id, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Already has solo player, redirect to dashboard
        navigate("/solo/dashboard");
      }
      // If no solo player, show the setup form (just display name since already authenticated)
    } catch (err) {
      console.error("Error checking solo player:", err);
    }
  };

  const handleRegister = async () => {
    setError(null);
    
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sign up with email/password
      const result = await signUp(email, password);
      
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Create solo player record
      const { data, error: rpcError } = await supabase.rpc("get_or_create_solo_player", {
        p_display_name: displayName || "Me",
      });

      if (rpcError) throw rpcError;

      toast.success("Account created! Let's make some picks!");
      navigate("/solo/picks");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Check/create solo player record
      const { data, error: rpcError } = await supabase.rpc("get_or_create_solo_player", {
        p_display_name: "Me",
      });

      if (rpcError) throw rpcError;

      toast.success("Welcome back!");
      navigate("/solo/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupSoloMode = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create solo player for authenticated user
      const { data, error: rpcError } = await supabase.rpc("get_or_create_solo_player", {
        p_display_name: displayName || "Me",
      });

      if (rpcError) throw rpcError;

      toast.success("Solo mode activated! Let's make some picks!");
      navigate("/solo/picks");
    } catch (err) {
      console.error("Setup error:", err);
      setError("Failed to set up solo mode. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated but hasn't set up solo mode yet
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md space-y-8">
          <OttLogoImage size="sm" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Set Up Solo Mode</CardTitle>
                <CardDescription className="text-muted-foreground">
                  You're signed in as {user.email}. Set up your solo profile to start making picks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-muted-foreground">
                    Display Name (optional)
                  </Label>
                  <Input
                    id="name"
                    placeholder="What should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-center"
                    maxLength={20}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleSetupSoloMode}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Making Picks
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              variant="link"
              onClick={() => navigate("/my-parties")}
              className="text-muted-foreground"
            >
              Back to My Parties
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <OttLogoImage size="sm" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Solo Mode</CardTitle>
              <CardDescription className="text-muted-foreground">
                Make your picks and track results on your own
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "returning")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    New Player
                  </TabsTrigger>
                  <TabsTrigger value="returning" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-muted-foreground">
                      Display Name (optional)
                    </Label>
                    <Input
                      id="name"
                      placeholder="What should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-center"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-new" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email-new"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-new" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password-new"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-center"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleRegister}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Making Picks
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="returning" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-login" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password-login"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-center"
                    />
                  </div>

                  <Link
                    to="/forgot-password"
                    className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center py-1"
                  >
                    Forgot password?
                  </Link>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleLogin}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In & Load Picks
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="text-center text-xs text-muted-foreground pt-2">
                <p>Your picks sync across all your devices.</p>
                <p>Same account works for parties and solo mode!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
