import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourContext";
import { cn } from "@/lib/utils";

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { isActive, currentStep, currentStepIndex, steps, nextStep, prevStep, endTour } = useTour();
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setHighlightRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target);
      if (!element) {
        // Element not found - try again after a short delay (for dynamic content)
        const timer = setTimeout(updatePosition, 200);
        return () => clearTimeout(timer);
      }

      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      setHighlightRect({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on placement
      const placement = currentStep.placement || "bottom";
      const tooltipWidth = 320;
      const tooltipHeight = 160;
      const gap = 12;

      let tooltipTop = 0;
      let tooltipLeft = 0;

      switch (placement) {
        case "top":
          tooltipTop = rect.top + window.scrollY - tooltipHeight - gap;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "bottom":
          tooltipTop = rect.bottom + window.scrollY + gap;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "left":
          tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.left - tooltipWidth - gap;
          break;
        case "right":
          tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.right + gap;
          break;
      }

      // Keep tooltip within viewport
      tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
      tooltipTop = Math.max(16, tooltipTop);

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Dark overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full" style={{ height: document.body.scrollHeight }}>
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left}
                  y={highlightRect.top}
                  width={highlightRect.width}
                  height={highlightRect.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Highlight border */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-primary rounded-xl pointer-events-none"
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              boxShadow: "0 0 0 4px rgba(253, 184, 30, 0.3)",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute w-80 bg-card border border-primary/50 rounded-xl shadow-2xl pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <h3 className="font-bold text-foreground">{currentStep.title}</h3>
            </div>
            <button
              onClick={endTour}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={isFirstStep}
              className={cn(isFirstStep && "invisible")}
            >
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Button>
            
            <Button
              variant="gold"
              size="sm"
              onClick={nextStep}
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight size={16} className="ml-1" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
