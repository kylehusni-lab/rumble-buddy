import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useAuth } from "@/hooks/useAuth";
import { getSoloPicks, getSoloResults } from "@/lib/solo-storage";

type TabId = "mens" | "womens";

export default function SoloTvDisplay() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: soloLoading, isAuthenticated, player } = useSoloCloud();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();
  
  const [activeTab, setActiveTab] = useState<TabId>("mens");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }
    
    if (!soloLoading && user && !isAuthenticated) {
      navigate("/solo/setup");
      return;
    }
    
    // Load local data
    setPicks(getSoloPicks());
    setResults(getSoloResults());
  }, [authLoading, soloLoading, user, isAuthenticated, navigate]);

  if (authLoading || soloLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthenticated || !player) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/solo/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl font-bold text-primary">Solo TV Mode</h1>
        <div className="w-24" />
      </div>

      {/* Tab Buttons */}
      <div className="p-4 flex gap-2 justify-center">
        <Button
          variant={activeTab === "mens" ? "default" : "outline"}
          onClick={() => setActiveTab("mens")}
        >
          Men's Rumble
        </Button>
        <Button
          variant={activeTab === "womens" ? "default" : "outline"}
          onClick={() => setActiveTab("womens")}
        >
          Women's Rumble
        </Button>
      </div>

      {/* Content - Simple picks display */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            {activeTab === "mens" ? "Men's" : "Women's"} Rumble Picks
          </h2>
          <div className="grid gap-3">
            {Object.entries(picks)
              .filter(([key]) => key.startsWith(activeTab))
              .map(([matchId, prediction]) => (
                <div key={matchId} className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                  <span className="text-muted-foreground capitalize">
                    {matchId.replace(`${activeTab}_`, "").replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-foreground">{prediction}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
