import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, List, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type RumbleSubView = "grid" | "props" | "chaos";

interface RumbleSubTabsProps {
  value: RumbleSubView;
  onChange: (value: RumbleSubView) => void;
}

export function RumbleSubTabs({ value, onChange }: RumbleSubTabsProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-1 bg-card/60 backdrop-blur-sm rounded-lg p-1 border border-border/50">
        <button
          onClick={() => onChange("grid")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            value === "grid" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Users className="w-4 h-4" />
          Grid
        </button>
        <button
          onClick={() => onChange("props")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            value === "props" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <List className="w-4 h-4" />
          Props
        </button>
        <button
          onClick={() => onChange("chaos")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            value === "chaos" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Zap className="w-4 h-4" />
          Chaos
        </button>
      </div>
    </div>
  );
}
