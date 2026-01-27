import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Edit3, Calculator, Hash, Swords, Zap, LogOut, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SoloScoringModal } from "@/components/solo/SoloScoringModal";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { 
  getSoloPicks, 
  getSoloResults, 
  calculateSoloScore 
} from "@/lib/solo-storage";
import { 
  CARD_CONFIG, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS 
} from "@/lib/constants";

type TabType = "matches" | "mens" | "womens" | "chaos";

export default function SoloDashboard() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, player, logout, saveResultsToCloud } = useSoloCloud();
  
  const [activeTab, setActiveTab] = useState<TabType>("matches");
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/solo/setup");
      return;
    }
    
    // Load local data
    setPicks(getSoloPicks());
    setResults(getSoloResults());
  }, [isLoading, isAuthenticated, navigate]);

  const score = useMemo(() => calculateSoloScore(picks, results), [picks, results]);

  const handleResultsUpdated = async () => {
    const newResults = getSoloResults();
    setResults(newResults);
    // Sync to cloud
    await saveResultsToCloud(newResults);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !player) return null;

  const tabs = [
    { id: "matches" as const, icon: Swords, label: "Matches" },
    { id: "mens" as const, icon: Hash, label: "Men's" },
    { id: "womens" as const, icon: Hash, label: "Women's" },
    { id: "chaos" as const, icon: Zap, label: "Chaos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cloud className="w-3 h-3 text-success" />
                Synced
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-gradient rounded-xl p-4 border border-border shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Hey {player.display_name}!
                </div>
                <div className="text-3xl font-black text-primary tabular-nums">
                  {score} pts
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {player.email}
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-32">
        {activeTab === "matches" && (
          <MatchesTab picks={picks} results={results} />
        )}
        {activeTab === "mens" && (
          <RumbleTab gender="mens" picks={picks} results={results} />
        )}
        {activeTab === "womens" && (
          <RumbleTab gender="womens" picks={picks} results={results} />
        )}
        {activeTab === "chaos" && (
          <ChaosTab picks={picks} results={results} />
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/solo/picks")}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Picks
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={() => setIsScoringOpen(true)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Score Results
          </Button>
        </div>
      </div>

      <SoloScoringModal
        isOpen={isScoringOpen}
        onClose={() => setIsScoringOpen(false)}
        onResultsUpdated={handleResultsUpdated}
      />
    </div>
  );
}

// Matches Tab Component
function MatchesTab({ 
  picks, 
  results 
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  const matchCards = CARD_CONFIG.filter(c => c.type === "match");

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground mb-4">Undercard Matches</h3>
      {matchCards.map((card) => {
        const pick = picks[card.id];
        const result = results[card.id];
        const isCorrect = pick && result && pick === result;
        const isWrong = pick && result && pick !== result;

        return (
          <div
            key={card.id}
            className={`p-4 rounded-xl border ${
              isCorrect
                ? "bg-success/10 border-success"
                : isWrong
                ? "bg-destructive/10 border-destructive"
                : "bg-card border-border"
            }`}
          >
            <div className="text-sm text-muted-foreground mb-1">{card.title}</div>
            <div className="font-semibold text-foreground">
              Your Pick: {pick || "—"}
              {isCorrect && <span className="ml-2 text-success">✓ +25</span>}
              {isWrong && <span className="ml-2 text-destructive">✗</span>}
            </div>
            {result && !isCorrect && (
              <div className="text-sm text-muted-foreground mt-1">
                Winner: {result}
              </div>
            )}
          </div>
        );
      })}

      {/* Rumble Winners */}
      <h3 className="text-lg font-bold text-foreground mt-6 mb-4">Rumble Winners</h3>
      {["mens_rumble_winner", "womens_rumble_winner"].map((id) => {
        const pick = picks[id];
        const result = results[id];
        const isCorrect = pick && result && pick === result;
        const isWrong = pick && result && pick !== result;
        const label = id.includes("mens") ? "Men's Rumble Winner" : "Women's Rumble Winner";

        return (
          <div
            key={id}
            className={`p-4 rounded-xl border ${
              isCorrect
                ? "bg-success/10 border-success"
                : isWrong
                ? "bg-destructive/10 border-destructive"
                : "bg-card border-border"
            }`}
          >
            <div className="text-sm text-muted-foreground mb-1">{label}</div>
            <div className="font-semibold text-foreground">
              Your Pick: {pick || "—"}
              {isCorrect && <span className="ml-2 text-success">✓ +50</span>}
              {isWrong && <span className="ml-2 text-destructive">✗</span>}
            </div>
            {result && !isCorrect && (
              <div className="text-sm text-muted-foreground mt-1">
                Winner: {result}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Rumble Props Tab Component
function RumbleTab({ 
  gender, 
  picks, 
  results 
}: { 
  gender: "mens" | "womens"; 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  const title = gender === "mens" ? "Men's Rumble Props" : "Women's Rumble Props";

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
      
      {/* Wrestler Props */}
      {RUMBLE_PROPS.map((prop) => {
        const matchId = `${gender}_${prop.id}`;
        const pick = picks[matchId];
        const result = results[matchId];
        const isCorrect = pick && result && pick === result;
        const isWrong = pick && result && pick !== result;

        return (
          <div
            key={matchId}
            className={`p-4 rounded-xl border ${
              isCorrect
                ? "bg-success/10 border-success"
                : isWrong
                ? "bg-destructive/10 border-destructive"
                : "bg-card border-border"
            }`}
          >
            <div className="text-sm text-muted-foreground mb-1">{prop.title}</div>
            <div className="font-semibold text-foreground">
              Your Pick: {pick || "—"}
              {isCorrect && <span className="ml-2 text-success">✓</span>}
              {isWrong && <span className="ml-2 text-destructive">✗</span>}
            </div>
            {result && !isCorrect && (
              <div className="text-sm text-muted-foreground mt-1">
                Result: {result}
              </div>
            )}
          </div>
        );
      })}

      {/* Final Four */}
      <h4 className="text-md font-bold text-foreground mt-6 mb-3">Final Four</h4>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, i) => {
          const matchId = `${gender}_final_four_${i + 1}`;
          const pick = picks[matchId];

          return (
            <div
              key={matchId}
              className="p-3 rounded-lg bg-card border border-border"
            >
              <div className="text-xs text-muted-foreground">#{i + 1}</div>
              <div className="font-medium text-sm text-foreground truncate">
                {pick || "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Chaos Props Tab Component
function ChaosTab({ 
  picks, 
  results 
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      {["mens", "womens"].map((gender) => (
        <div key={gender}>
          <h3 className="text-lg font-bold text-foreground mb-4">
            {gender === "mens" ? "Men's" : "Women's"} Chaos Props
          </h3>
          <div className="space-y-2">
            {CHAOS_PROPS.map((prop, index) => {
              const matchId = `${gender}_chaos_prop_${index + 1}`;
              const pick = picks[matchId];
              const result = results[matchId];
              const isCorrect = pick && result && pick === result;
              const isWrong = pick && result && pick !== result;

              return (
                <div
                  key={matchId}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    isCorrect
                      ? "bg-success/10 border-success"
                      : isWrong
                      ? "bg-destructive/10 border-destructive"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {prop.shortName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      pick === "YES" ? "text-success" : pick === "NO" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {pick || "—"}
                    </span>
                    {isCorrect && <span className="text-success">✓</span>}
                    {isWrong && <span className="text-destructive">✗</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
