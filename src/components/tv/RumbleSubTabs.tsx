import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, List, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type RumbleSubView = "grid" | "props" | "chaos";

interface RumbleSubTabsProps {
  value: RumbleSubView;
  onChange: (value: RumbleSubView) => void;
}

export function RumbleSubTabs({ value, onChange }: RumbleSubTabsProps) {
  const tabs = [
    { id: "grid" as const, label: "Entry Grid", icon: Users },
    { id: "props" as const, label: "Rumble Props", icon: List },
    { id: "chaos" as const, label: "Chaos Props", icon: Zap },
  ];

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex items-center gap-2 bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-sm rounded-xl p-2 border border-primary/30 shadow-lg shadow-primary/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = value === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-6 py-3 rounded-lg text-base font-bold transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              style={isActive ? {
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(212,175,55,0.4)'
              } : undefined}
            >
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-lg" />
              )}
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} />
              <span className="tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
