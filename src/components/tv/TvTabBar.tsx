import { Swords, Users, List, Check, Circle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface View {
  type: "leaderboard" | "undercard" | "rumble" | "rumble-props";
  id: string;
  title: string;
}

interface TvTabBarProps {
  views: View[];
  currentIndex: number;
  onSelectView: (index: number) => void;
  isViewComplete: (view: View) => boolean;
  isViewActive?: (view: View) => boolean;
}

const VIEW_CONFIG: { icon: React.ElementType; label: string; shortcut: string }[] = [
  { icon: Trophy, label: "Scores", shortcut: "1" },
  { icon: Swords, label: "Match 1", shortcut: "2" },
  { icon: Swords, label: "Match 2", shortcut: "3" },
  { icon: Swords, label: "Match 3", shortcut: "4" },
  { icon: Users, label: "Men's", shortcut: "5" },
  { icon: List, label: "M Props", shortcut: "6" },
  { icon: Users, label: "Women's", shortcut: "7" },
  { icon: List, label: "W Props", shortcut: "8" },
];

export function TvTabBar({
  views,
  currentIndex,
  onSelectView,
  isViewComplete,
  isViewActive,
}: TvTabBarProps) {
  return (
    <div className="flex items-center justify-center gap-1 bg-card/80 backdrop-blur-sm rounded-xl p-2 border border-border">
      {views.map((view, index) => {
        const config = VIEW_CONFIG[index];
        if (!config) return null;
        
        const Icon = config.icon;
        const isSelected = index === currentIndex;
        const isComplete = isViewComplete(view);
        const isActive = isViewActive?.(view) ?? false;

        return (
          <button
            key={view.id}
            onClick={() => onSelectView(index)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-muted/50",
              isSelected && "bg-primary text-primary-foreground shadow-lg",
              !isSelected && isComplete && "text-success",
              !isSelected && !isComplete && "text-muted-foreground"
            )}
          >
            {/* Icon with status indicator */}
            <div className="relative">
              <Icon className="w-5 h-5" />
              {isComplete && !isSelected && (
                <Check className="absolute -top-1 -right-1 w-3 h-3 text-success bg-background rounded-full" />
              )}
              {isActive && !isComplete && !isSelected && (
                <Circle className="absolute -top-1 -right-1 w-3 h-3 text-primary fill-primary animate-pulse" />
              )}
            </div>

            {/* Label */}
            <span className="text-sm font-semibold whitespace-nowrap">
              {config.label}
            </span>

            {/* Keyboard shortcut hint */}
            <span
              className={cn(
                "text-xs font-mono px-1.5 py-0.5 rounded",
                isSelected 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {config.shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
}
