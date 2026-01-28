import { Swords, Users, Trophy, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Consolidated 4-tab structure for TV-optimized navigation
const TAB_CONFIG = [
  { id: "leaderboard", icon: Trophy, label: "Leaderboard", shortcut: "1", isMainEvent: false },
  { id: "undercard", icon: Swords, label: "Undercard", shortcut: "2", isMainEvent: false },
  { id: "mens", icon: Users, label: "Men's Rumble", shortcut: "3", isMainEvent: true },
  { id: "womens", icon: Users, label: "Women's Rumble", shortcut: "4", isMainEvent: true },
];

export type TvTabId = "leaderboard" | "undercard" | "mens" | "womens";

interface TvTabBarProps {
  activeTab: TvTabId;
  onSelectTab: (tabId: TvTabId) => void;
  isTabComplete: (tabId: TvTabId) => boolean;
  isTabLive?: (tabId: TvTabId) => boolean;
}

export function TvTabBar({
  activeTab,
  onSelectTab,
  isTabComplete,
  isTabLive,
}: TvTabBarProps) {
  return (
    <div className="tv-tab-bar">
      {TAB_CONFIG.map((tab) => {
        const Icon = tab.icon;
        const isSelected = activeTab === tab.id;
        const isComplete = isTabComplete(tab.id as TvTabId);
        const isLive = isTabLive?.(tab.id as TvTabId) ?? false;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as TvTabId)}
            role="tab"
            aria-selected={isSelected}
            className={cn(
              "tv-tab",
              isSelected ? "tv-tab-active" : "tv-tab-inactive",
              tab.isMainEvent && "tv-tab-main-event"
            )}
          >
            {/* Status indicator */}
            {(isComplete || isLive) && !isSelected && (
              <div
                className={cn(
                  "tv-tab-status",
                  isComplete && "tv-tab-status-complete",
                  isLive && !isComplete && "tv-tab-status-live"
                )}
              >
                {isComplete ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Circle className="w-2 h-2 fill-current" />
                )}
              </div>
            )}

            {/* Icon */}
            <div className="tv-tab-icon">
              <Icon className={tab.isMainEvent ? "w-7 h-7" : "w-6 h-6"} />
            </div>

            {/* Label */}
            <span className="tv-tab-label">{tab.label}</span>

            {/* Keyboard shortcut */}
            <span className="tv-tab-shortcut">{tab.shortcut}</span>
          </button>
        );
      })}
    </div>
  );
}
