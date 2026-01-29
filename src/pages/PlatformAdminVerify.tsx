import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function PlatformAdminVerify() {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-pin", {
        body: { pin },
      });

      if (error || !data?.valid) {
        toast.error("Invalid PIN");
        setPin("");
        return;
      }

      // Store session token
      localStorage.setItem("platform_admin_session", data.token);
      localStorage.setItem("platform_admin_expires", data.expiresAt);

      toast.success("Access granted!");
      navigate("/admin/wrestlers");
    } catch (err) {
      console.error("Error verifying PIN:", err);
      toast.error("Failed to verify PIN");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <Logo size="md" />

        <motion.div
          className="bg-card border border-border rounded-2xl p-6 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Platform Admin</h1>
              <p className="text-sm text-muted-foreground">Enter admin PIN to continue</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-10 text-center text-xl tracking-widest"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isVerifying || pin.length < 4}
            >
              {isVerifying ? "Verifying..." : "Access Admin Panel"}
            </Button>
          </form>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
