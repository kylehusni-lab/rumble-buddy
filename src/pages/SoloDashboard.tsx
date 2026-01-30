import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Calculator, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoloScoringModal } from "@/components/solo/SoloScoringModal";
import { SinglePickEditModal } from "@/components/dashboard/SinglePickEditModal";
import { UnifiedDashboardHeader } from "@/components/dashboard/UnifiedDashboardHeader";
import { UnifiedTabNavigation, UnifiedTabId } from "@/components/dashboard/UnifiedTabNavigation";
import { UnifiedMatchesTab } from "@/components/dashboard/UnifiedMatchesTab";
import { UnifiedRumblePropsTab } from "@/components/dashboard/UnifiedRumblePropsTab";
import { UnifiedChaosTab } from "@/components/dashboard/UnifiedChaosTab";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useAuth } from "@/hooks/useAuth";
import { 
  getSoloPicks, 
  getSoloResults, 
  calculateSoloScore,
  saveSoloPicks,
} from "@/lib/solo-storage";
import { 
  CARD_CONFIG, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS,
} from "@/lib/constants";
import { toast } from "sonner";

export default function SoloDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { isLoading: soloLoading, isAuthenticated, player, logout, savePicksToCloud, saveResultsToCloud } = useSoloCloud();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();
  
  const [activeTab, setActiveTab] = useState<Exclude<UnifiedTabId, "numbers">>("matches");
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});
  
  // Single pick edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [editingCurrentPick, setEditingCurrentPick] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }
    
    if (!soloLoading && user && !isAuthenticated) {
      // User is logged in but no solo player record - redirect to setup
      navigate("/solo/setup");
      return;
    }
    
    // Load local data
    setPicks(getSoloPicks());
    setResults(getSoloResults());
  }, [authLoading, soloLoading, user, isAuthenticated, navigate]);

  const score = useMemo(() => calculateSoloScore(picks, results), [picks, results]);

  const tabCompletion = useMemo(() => {
    const matchCards = CARD_CONFIG.filter(c => c.type === "match");
    const matchesComplete = matchCards.filter(c => picks[c.id]).length;
    const winnersComplete = (picks["mens_rumble_winner"] ? 1 : 0) + 
                            (picks["womens_rumble_winner"] ? 1 : 0);
    
    // Men's: 5 props + 4 final four
    let mensComplete = 0;
    RUMBLE_PROPS.forEach(prop => {
      if (picks[`mens_${prop.id}`]) mensComplete++;
    });
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      if (picks[`mens_final_four_${i}`]) mensComplete++;
    }
    
    // Women's: same structure
    let womensComplete = 0;
    RUMBLE_PROPS.forEach(prop => {
      if (picks[`womens_${prop.id}`]) womensComplete++;
    });
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      if (picks[`womens_final_four_${i}`]) womensComplete++;
    }
    
    // Chaos: dynamic props count x 2 genders
    let chaosComplete = 0;
    const chaosTotal = CHAOS_PROPS.length * 2;
    ["mens", "womens"].forEach(gender => {
      CHAOS_PROPS.forEach((_, i) => {
        if (picks[`${gender}_chaos_prop_${i + 1}`]) chaosComplete++;
      });
    });
    
    return {
      matches: { complete: matchesComplete + winnersComplete, total: 4 },
      mens: { complete: mensComplete, total: RUMBLE_PROPS.length + FINAL_FOUR_SLOTS },
      womens: { complete: womensComplete, total: RUMBLE_PROPS.length + FINAL_FOUR_SLOTS },
      chaos: { complete: chaosComplete, total: chaosTotal },
    };
  }, [picks]);

  // Determine if editing is allowed (before scoring starts)
  const hasResults = Object.keys(results).length > 0;
  const canEditPicks = !hasResults;

  const handleEditPick = (matchId: string, currentPick: string) => {
    setEditingMatchId(matchId);
    setEditingCurrentPick(currentPick);
    setEditModalOpen(true);
  };

  const handleSavePick = async (matchId: string, newValue: string) => {
    const newPicks = { ...picks, [matchId]: newValue };
    saveSoloPicks(newPicks);
    setPicks(newPicks);
    savePicksToCloud(newPicks);
    toast.success("Pick updated!");
  };

  const handleResultsUpdated = async () => {
    const newResults = getSoloResults();
    setResults(newResults);
    // Sync to cloud
    await saveResultsToCloud(newResults);
  };

  const handleLogout = async () => {
    logout();
    await signOut();
    navigate("/my-parties");
  };

  const handleBack = () => {
    navigate("/my-parties");
  };

  const handleOpenTv = () => {
    window.open("/solo/tv", "_blank");
  };

  if (authLoading || soloLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthenticated || !player) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Unified Header */}
      <UnifiedDashboardHeader
        mode="solo"
        displayName={player.display_name}
        score={score}
        isSynced={true}
        onLogout={handleLogout}
        onOpenTv={handleOpenTv}
        onBack={handleBack}
      />

      {/* Tab Navigation */}
      <UnifiedTabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Exclude<UnifiedTabId, "numbers">)}
        tabCompletion={tabCompletion}
        showNumbers={false}
      />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-32">
        {activeTab === "matches" && (
          <UnifiedMatchesTab 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "mens" && (
          <UnifiedRumblePropsTab 
            gender="mens" 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "womens" && (
          <UnifiedRumblePropsTab 
            gender="womens" 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "chaos" && (
          <UnifiedChaosTab 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleOpenTv}
          >
            <Tv className="w-4 h-4 mr-2" />
            TV Mode
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
        mensEntrants={mensEntrants}
        womensEntrants={womensEntrants}
      />

      <SinglePickEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        matchId={editingMatchId}
        currentPick={editingCurrentPick}
        onSave={handleSavePick}
        mensEntrants={mensEntrants}
        womensEntrants={womensEntrants}
        allPicks={picks}
      />
    </div>
  );
}
