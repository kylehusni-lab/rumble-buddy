import { useState, useRef, useEffect } from "react";
import { RefreshCw, Maximize, Minimize, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TvTabId } from "./TvTabBar";

export type RumbleSubView = "grid" | "props" | "chaos";

interface TvUnifiedHeaderProps {
  partyCode: string;
  activeTab: TvTabId;
  onSelectTab: (tab: TvTabId) => void;
  mensSubView: RumbleSubView;
  womensSubView: RumbleSubView;
  onMensSubViewChange: (view: RumbleSubView) => void;
  onWomensSubViewChange: (view: RumbleSubView) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  isVisible: boolean;
  onShowHeader: () => void;
}

const MAIN_TABS = [
  { id: "leaderboard" as const, label: "Leaderboard", shortcut: "1" },
  { id: "undercard" as const, label: "Undercard", shortcut: "2" },
  { id: "mens" as const, label: "Men's", shortcut: "3", hasDropdown: true },
  { id: "womens" as const, label: "Women's", shortcut: "4", hasDropdown: true },
];

const SUB_VIEWS: { id: RumbleSubView; label: string }[] = [
  { id: "grid", label: "Entry Grid" },
  { id: "props", label: "Rumble Props" },
  { id: "chaos", label: "Chaos Props" },
];

export function TvUnifiedHeader({
  partyCode,
  activeTab,
  onSelectTab,
  mensSubView,
  womensSubView,
  onMensSubViewChange,
  onWomensSubViewChange,
  autoRotate,
  onToggleAutoRotate,
  isVisible,
  onShowHeader,
}: TvUnifiedHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"mens" | "womens" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTabClick = (tabId: TvTabId) => {
    if (tabId === activeTab && (tabId === "mens" || tabId === "womens")) {
      // Toggle dropdown if clicking active rumble tab
      setOpenDropdown(openDropdown === tabId ? null : tabId);
    } else {
      onSelectTab(tabId);
      setOpenDropdown(null);
    }
  };

  const handleSubViewSelect = (view: RumbleSubView) => {
    if (openDropdown === "mens") {
      onMensSubViewChange(view);
    } else if (openDropdown === "womens") {
      onWomensSubViewChange(view);
    }
    setOpenDropdown(null);
  };

  const getCurrentSubView = () => {
    if (activeTab === "mens") return mensSubView;
    if (activeTab === "womens") return womensSubView;
    return null;
  };

  const getSubViewLabel = (subView: RumbleSubView) => {
    return SUB_VIEWS.find(s => s.id === subView)?.label || "";
  };

  return (
    <>
      {/* Hover zone when header is hidden */}
      {!isVisible && (
        <div
          className="fixed top-0 left-0 right-0 h-5 z-50"
          onMouseEnter={onShowHeader}
        />
      )}

      {/* View indicator when header is hidden */}
      {!isVisible && (
        <div className="fixed top-4 right-6 z-40 text-sm text-white/40 transition-opacity duration-400">
          {activeTab === "mens" && `Men's: ${getSubViewLabel(mensSubView)}`}
          {activeTab === "womens" && `Women's: ${getSubViewLabel(womensSubView)}`}
          {activeTab === "leaderboard" && "Leaderboard"}
          {activeTab === "undercard" && "Undercard"}
        </div>
      )}

      {/* Main Header Bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-400",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5 pointer-events-none"
        )}
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          {/* Left: Party Code */}
          <span className="text-sm font-mono" style={{ color: "#666" }}>
            #{partyCode}
          </span>

          {/* Center: Navigation */}
          <div className="flex items-center gap-1" ref={dropdownRef}>
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const showDropdownArrow = tab.hasDropdown && isActive;
              
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-base transition-all duration-200",
                      isActive
                        ? "text-black"
                        : "text-[#888] hover:text-white hover:bg-white/10"
                    )}
                    style={isActive ? {
                      background: "#f5c518",
                      fontWeight: 600,
                    } : undefined}
                  >
                    {tab.label}
                    {showDropdownArrow && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        openDropdown === tab.id && "rotate-180"
                      )} />
                    )}
                  </button>

                  {/* Dropdown for Rumble tabs */}
                  {tab.hasDropdown && openDropdown === tab.id && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex items-center gap-1 px-2 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(30, 30, 40, 0.95)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {SUB_VIEWS.map((subView) => {
                        const currentSub = getCurrentSubView();
                        const isSubActive = currentSub === subView.id;
                        
                        return (
                          <button
                            key={subView.id}
                            onClick={() => handleSubViewSelect(subView.id)}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                              isSubActive
                                ? "text-black"
                                : "text-[#888] hover:text-white hover:bg-white/10"
                            )}
                            style={isSubActive ? { background: "#f5c518" } : undefined}
                          >
                            {subView.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Auto Rotate Toggle */}
            <button
              onClick={onToggleAutoRotate}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                autoRotate
                  ? "border"
                  : "border"
              )}
              style={{
                background: autoRotate ? "rgba(245, 197, 24, 0.2)" : "rgba(255,255,255,0.1)",
                borderColor: autoRotate ? "#f5c518" : "transparent",
                color: autoRotate ? "#f5c518" : "#aaa",
              }}
            >
              <RefreshCw className={cn("w-4 h-4", autoRotate && "animate-spin")} style={{ animationDuration: "3s" }} />
              Auto
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
              style={{
                background: isFullscreen ? "rgba(245, 197, 24, 0.2)" : "rgba(255,255,255,0.1)",
                borderColor: isFullscreen ? "#f5c518" : "transparent",
                color: isFullscreen ? "#f5c518" : "#aaa",
              }}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              Full
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
