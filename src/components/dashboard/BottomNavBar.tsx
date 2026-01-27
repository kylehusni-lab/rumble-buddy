import { LucideIcon, Hash, Trophy, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "numbers" | "matches" | "mens" | "womens" | "chaos";

interface NavTab {
  id: TabId;
  icon: LucideIcon;
  label: string;
}

const TABS: NavTab[] = [
  { id: "numbers", icon: Hash, label: "Numbers" },
  { id: "matches", icon: Trophy, label: "Matches" },
  { id: "mens", icon: User, label: "Men's" },
  { id: "womens", icon: User, label: "Women's" },
  { id: "chaos", icon: Zap, label: "Chaos" },
];

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showNumbers?: boolean;
}

export function BottomNavBar({ activeTab, onTabChange, showNumbers = false }: BottomNavBarProps) {
  const visibleTabs = showNumbers ? TABS : TABS.filter(t => t.id !== "numbers");

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 font-medium",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
