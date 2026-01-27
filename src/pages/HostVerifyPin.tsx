import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export default function HostVerifyPin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }
    
    // Check if already verified
    const storedPin = localStorage.getItem(`party_${code}_pin`);
    if (storedPin) {
      navigate(`/host/setup/${code}`);
    }
    
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [code, navigate]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3 && newDigits.every(d => d)) {
      verifyPin(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (pin: string) => {
    if (!code) return;
    
    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("parties")
        .select("host_pin")
        .eq("code", code)
        .maybeSingle();

      if (fetchError) {
        setError("Failed to verify PIN. Please try again.");
        clearInputs();
        return;
      }

      if (!data) {
        setError("Party not found.");
        clearInputs();
        return;
      }

      // If no PIN set, allow access and set this as the PIN
      if (!data.host_pin) {
        await supabase
          .from("parties")
          .update({ host_pin: pin })
          .eq("code", code);
        
        localStorage.setItem(`party_${code}_pin`, pin);
        navigate(`/host/setup/${code}`);
        return;
      }

      // Verify against stored PIN
      if (data.host_pin === pin) {
        localStorage.setItem(`party_${code}_pin`, pin);
        navigate(`/host/setup/${code}`);
      } else {
        setError("Incorrect PIN. Please try again.");
        clearInputs();
      }
    } catch (err) {
      console.error("PIN verification error:", err);
      setError("An error occurred. Please try again.");
      clearInputs();
    } finally {
      setIsVerifying(false);
    }
  };

  const clearInputs = () => {
    setDigits(["", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <Logo size="sm" className="mx-auto mb-8" />
        
        <div className="bg-primary/10 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Lock className="text-primary" size={40} />
        </div>
        
        <h1 className="text-2xl font-black mb-2">Host Access</h1>
        <p className="text-muted-foreground mb-8">
          Enter your 4-digit PIN to continue
        </p>

        <div className="flex gap-3 justify-center mb-6">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[index]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                handleDigitChange(index, e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              className="aspect-square w-16 h-16 text-4xl font-bold text-center 
                         bg-card border-2 border-border rounded-xl 
                         focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                         disabled:opacity-50 transition-colors"
              aria-label={`PIN digit ${index + 1}`}
            />
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-destructive mb-4"
          >
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {isVerifying && (
          <p className="text-muted-foreground text-sm animate-pulse">
            Verifying...
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-8">
          Party Code: <span className="font-bold text-primary">{code}</span>
        </p>
      </motion.div>
    </div>
  );
}
