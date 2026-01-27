import { LucideIcon, Hash, Trophy, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "numbers" | "matches" | "mens" | "womens";

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
];

export interface TabBadge {
  correct: number;
  pending: number;
}

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showNumbers?: boolean;
  badges?: Partial<Record<TabId, TabBadge>>;
}

export function BottomNavBar({ activeTab, onTabChange, showNumbers = false, badges }: BottomNavBarProps) {
  const visibleTabs = showNumbers ? TABS : TABS.filter(t => t.id !== "numbers");

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur border-t border-border/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const badge = badges?.[tab.id];
          
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
                "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                isActive && "bg-primary/15 nav-active-glow"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Badge indicator */}
                {badge && badge.correct > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full point-badge text-white text-[10px] font-bold">
                    <Check size={10} className="mr-0.5" />
                    {badge.correct}
                  </span>
                )}
                {badge && badge.correct === 0 && badge.pending > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                    {badge.pending}
                  </span>
                )}
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
