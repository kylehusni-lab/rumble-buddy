import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import confetti from "canvas-confetti";

interface WrestlerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (wrestler: string) => void;
  title: string;
  wrestlers: string[];
  currentSelection?: string;
  triggerConfetti?: boolean;
}

export function WrestlerPickerModal({
  isOpen,
  onClose,
  onSelect,
  title,
  wrestlers,
  currentSelection,
  triggerConfetti = true,
}: WrestlerPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWrestlers = useMemo(() => {
    if (!searchQuery.trim()) return wrestlers;
    const query = searchQuery.toLowerCase();
    return wrestlers.filter((name) => name.toLowerCase().includes(query));
  }, [wrestlers, searchQuery]);

  const handleSelect = (wrestler: string) => {
    onSelect(wrestler);
    
    if (triggerConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#4B0082", "#FFFFFF"],
      });
    }
    
    // Small delay to show selection before closing
    setTimeout(() => {
      onClose();
      setSearchQuery("");
    }, 200);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-background border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={handleClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <h2 className="font-bold text-base flex-1 text-center truncate px-2">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-primary font-semibold"
            >
              Done
            </Button>
          </div>

          {/* Search Bar */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wrestlers..."
                className="pl-10 bg-muted border-border h-10"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        {/* Wrestler Grid - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}
        >
          <div className="p-3">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {filteredWrestlers.map((wrestler) => {
                const isSelected = currentSelection === wrestler;
                return (
                  <motion.button
                    key={wrestler}
                    onClick={() => handleSelect(wrestler)}
                    className="flex flex-col items-center p-1"
                    whileTap={{ scale: 0.95 }}
                    animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Photo Container */}
                    <div
                      className={`relative w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] transition-all duration-200 ${
                        isSelected
                          ? "border-primary shadow-[0_0_12px_hsla(43,75%,52%,0.5)]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={getWrestlerImageUrl(wrestler)}
                        alt={wrestler}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImageUrl(wrestler);
                        }}
                      />
                      
                      {/* Selected Checkmark Overlay */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Check className="text-primary-foreground" size={24} strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className={`mt-1.5 text-[10px] text-center leading-tight line-clamp-2 ${
                        isSelected ? "text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      {wrestler}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {filteredWrestlers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No wrestlers found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
