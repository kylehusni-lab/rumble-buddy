import { useState, useEffect } from "react";
import { RefreshCw, Maximize, Minimize, Users, Skull, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TvHeaderStatsProps {
  currentViewTitle: string;
  activeWrestlerCount: number;
  totalEliminations: number;
  lastActivityTime: Date | null;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showRumbleStats?: boolean;
}

export function TvHeaderStats({
  currentViewTitle,
  activeWrestlerCount,
  totalEliminations,
  lastActivityTime,
  autoRotate,
  onToggleAutoRotate,
  showRumbleStats = false,
}: TvHeaderStatsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeSinceActivity, setTimeSinceActivity] = useState<string>("");

  // Update time since last activity
  useEffect(() => {
    if (!lastActivityTime) {
      setTimeSinceActivity("");
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastActivityTime.getTime()) / 1000);
      
      if (diff < 60) {
        setTimeSinceActivity(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeSinceActivity(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeSinceActivity(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastActivityTime]);

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

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Current View Title - Large and readable */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
        {currentViewTitle}
      </h1>

      {/* Stats + Controls */}
      <div className="flex items-center gap-3">
        {/* Live Stats Pill - only show for Rumble views */}
        {showRumbleStats && (
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
            {/* Active Wrestlers */}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">{activeWrestlerCount}</span>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-border" />

            {/* Eliminations */}
            <div className="flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{totalEliminations}</span>
            </div>

            {/* Last Activity */}
            {timeSinceActivity && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{timeSinceActivity}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Auto-Rotate Toggle */}
        <Button
          variant={autoRotate ? "default" : "outline"}
          size="sm"
          onClick={onToggleAutoRotate}
          className={cn(
            "gap-2",
            autoRotate && "bg-primary text-primary-foreground"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", autoRotate && "animate-spin")} style={{ animationDuration: "3s" }} />
          <span className="hidden sm:inline">Auto</span>
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="gap-2"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Full"}</span>
        </Button>
      </div>
    </div>
  );
}
