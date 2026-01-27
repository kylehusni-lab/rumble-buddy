import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FixedTabNavigationProps {
  tabs: string[];
  currentIndex: number;
  onNavigate: (direction: -1 | 1) => void;
}

export function FixedTabNavigation({
  tabs,
  currentIndex,
  onNavigate,
}: FixedTabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-10">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate(-1)}
          disabled={currentIndex === 0}
          className="h-12 w-12"
        >
          <ChevronLeft size={24} />
        </Button>

        {/* Tab indicators */}
        <div className="flex gap-2">
          {tabs.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                i === currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate(1)}
          disabled={currentIndex === tabs.length - 1}
          className="h-12 w-12"
        >
          <ChevronRight size={24} />
        </Button>
      </div>
    </div>
  );
}
