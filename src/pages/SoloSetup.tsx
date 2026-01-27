import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { setSoloSession } from "@/lib/solo-storage";
import { setPlayerSession, generateSessionId } from "@/lib/session";

export default function SoloSetup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    
    const name = displayName.trim() || "Me";
    const sessionId = generateSessionId();
    
    // Save solo session
    setSoloSession({
      displayName: name,
      createdAt: new Date().toISOString(),
    });
    
    // Update player session with solo flag
    setPlayerSession({
      sessionId,
      displayName: name,
      isSolo: true,
    });
    
    // Navigate to picks
    setTimeout(() => {
      navigate("/solo/picks");
    }, 300);
  };

  const handleSkip = () => {
    setDisplayName("");
    handleStart();
  };

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
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground">
                  What should we call you? (optional)
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-center text-lg"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleStart();
                  }}
                />
              </div>

              <div className="space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleStart}
                  disabled={isStarting}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isStarting ? "Let's Go!" : "Start Making Picks"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Button
                  variant="ghost"
                  size="default"
                  className="w-full text-muted-foreground"
                  onClick={handleSkip}
                  disabled={isStarting}
                >
                  Skip, just call me "Me"
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-2">
                <p>Your picks are saved locally on this device.</p>
                <p>No account required!</p>
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
