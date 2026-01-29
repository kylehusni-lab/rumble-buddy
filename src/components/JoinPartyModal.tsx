import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface JoinPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinPartyModal({ isOpen, onClose }: JoinPartyModalProps) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setCode(["", "", "", ""]);
      setError("");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && code.every(d => d)) {
      handleJoin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newCode = pasted.split("");
    while (newCode.length < 4) newCode.push("");
    setCode(newCode);
    if (newCode[3]) {
      inputRefs.current[3]?.focus();
    }
  };

  const handleJoin = async () => {
    const partyCode = code.join("");
    if (partyCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("parties_public")
        .select("code, status")
        .eq("code", partyCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("No group found with this code");
        return;
      }

      if (data.status === "completed") {
        setError("This group has already ended");
        return;
      }

      navigate(`/player/join?code=${partyCode}`);
      onClose();
    } catch (err) {
      console.error("Error joining party:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-0 top-0 z-50 flex items-start justify-center pt-16 px-4 pb-8 overflow-y-auto max-h-screen"
          >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Enter Group Code</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-16 h-20 text-center text-3xl font-bold bg-muted border-2 border-border rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="gold"
                  onClick={handleJoin}
                  className="flex-1"
                  disabled={isLoading || code.some(d => !d)}
                >
                  {isLoading ? "Joining..." : "Join →"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
