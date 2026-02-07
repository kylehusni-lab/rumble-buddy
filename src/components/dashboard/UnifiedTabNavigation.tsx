import { memo } from "react";
import { Swords, Hash, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type UnifiedTabId = "matches" | "mens" | "womens" | "chaos" | "numbers";

interface TabCompletion {
  complete: number;
  total: number;
}

interface UnifiedTabNavigationProps {
  activeTab: UnifiedTabId;
  onTabChange: (tab: UnifiedTabId) => void;
  tabCompletion: Record<Exclude<UnifiedTabId, "numbers">, TabCompletion>;
  showNumbers?: boolean;
  numbersCompletion?: TabCompletion;
  // New: conditionally show Rumble-specific tabs
  isRumble?: boolean;
}

// All tabs including Rumble-specific ones
const ALL_TABS: Array<{ id: Exclude<UnifiedTabId, "numbers">; icon: typeof Swords; label: string; rumbleOnly?: boolean }> = [
  { id: "matches", icon: Swords, label: "Matches" },
  { id: "mens", icon: Hash, label: "Men's", rumbleOnly: true },
  { id: "womens", icon: Hash, label: "Women's", rumbleOnly: true },
  { id: "chaos", icon: Zap, label: "Chaos", rumbleOnly: true },
];

export const UnifiedTabNavigation = memo(function UnifiedTabNavigation({
  activeTab,
  onTabChange,
  tabCompletion,
  showNumbers = false,
  numbersCompletion,
  isRumble = true,
}: UnifiedTabNavigationProps) {
  // Filter tabs based on event type
  const baseTabs = ALL_TABS.filter(tab => !tab.rumbleOnly || isRumble);
  
  const tabs = showNumbers && isRumble
    ? [{ id: "numbers" as const, icon: Hash, label: "Numbers" }, ...baseTabs]
    : baseTabs;

  return (
    <div className="border-b border-border">
      <div className="max-w-2xl mx-auto flex">
      {tabs.map((tab) => {
        const completion = tab.id === "numbers" 
          ? numbersCompletion 
          : tabCompletion[tab.id as Exclude<UnifiedTabId, "numbers">];
        const isComplete = completion ? completion.complete === completion.total : false;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 px-2 transition-colors relative",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{tab.label}</span>
            {completion && (
              <span className={cn(
                "text-[10px] font-medium",
                isComplete ? "text-success" : "text-muted-foreground"
              )}>
                {isComplete ? (
                  <span className="flex items-center gap-0.5">
                    <Check className="w-3 h-3" />
                    {completion.complete}/{completion.total}
                  </span>
                ) : (
                  `${completion.complete}/${completion.total}`
                )}
              </span>
            )}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200",
              activeTab === tab.id ? "bg-primary" : "bg-transparent"
            )} />
          </button>
        );
      })}
      </div>
    </div>
  );
});
