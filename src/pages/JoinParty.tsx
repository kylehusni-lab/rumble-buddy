// JoinParty page - Direct join with code
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OttLogoMark } from "@/components/OttLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function JoinParty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode || cleanCode.length < 4) {
      toast.error("Please enter a valid party code");
      return;
    }

    setIsLoading(true);

    try {
      // Check if party exists
      const { data: party, error } = await supabase
        .from("parties_public")
        .select("code, status")
        .eq("code", cleanCode)
        .maybeSingle();

      if (error) throw error;

      if (!party) {
        toast.error("Party not found. Check your code and try again.");
        return;
      }

      // Navigate to player join flow
      navigate(`/player/join?code=${cleanCode}`);
    } catch (err) {
      console.error("Join error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <OttLogoMark size={48} className="mx-auto" />
          <h1 className="text-2xl font-bold">Join a Party</h1>
          <p className="text-sm text-muted-foreground">
            Enter the code from your host
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Party Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 4-6 digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-2xl font-mono tracking-widest bg-ott-surface-elevated border-border uppercase"
              maxLength={6}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
            disabled={isLoading || code.length < 4}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Party
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Alternative actions */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Don't have a code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-ott-accent hover:text-ott-accent/80"
          >
            Request Access
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
