import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowRight, Sparkles, Mail, Lock, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { toast } from "sonner";

export default function SoloSetup() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, player, error, register, login } = useSoloCloud();
  
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && player) {
      navigate("/solo/picks");
    }
  }, [isLoading, isAuthenticated, player, navigate]);

  const handleRegister = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsSubmitting(true);
    const success = await register(email, pin, displayName);
    setIsSubmitting(false);

    if (success) {
      toast.success("Account created! Let's make some picks! 🎉");
      navigate("/solo/picks");
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, pin);
    setIsSubmitting(false);

    if (success) {
      toast.success("Welcome back! 🎉");
      navigate("/solo/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        <Logo size="md" />

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
                      Email (for account recovery)
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
                    <Label htmlFor="pin-new" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      4-Digit PIN
                    </Label>
                    <Input
                      id="pin-new"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-[0.5em] font-mono"
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
                    <Label htmlFor="pin-login" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      4-Digit PIN
                    </Label>
                    <Input
                      id="pin-login"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>

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
                <p>Email + PIN keeps it simple!</p>
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
            ← Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
