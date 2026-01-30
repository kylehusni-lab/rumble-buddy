import { useState, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Calculator, Hash, Swords, Zap, LogOut, Loader2, Cloud, Check, X, Users, Plus, Pencil, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SoloScoringModal } from "@/components/solo/SoloScoringModal";
import { SinglePickEditModal } from "@/components/dashboard/SinglePickEditModal";
import { useSoloCloud } from "@/hooks/useSoloCloud";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useIsMobile } from "@/hooks/use-mobile";
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
  SCORING,
} from "@/lib/constants";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { getEntrantDisplayName } from "@/lib/entrant-utils";
import { toast } from "sonner";

type TabType = "matches" | "mens" | "womens" | "chaos";

export default function SoloDashboard() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, player, logout, savePicksToCloud, saveResultsToCloud } = useSoloCloud();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();
  
  const [activeTab, setActiveTab] = useState<TabType>("matches");
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});
  
  // Single pick edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [editingCurrentPick, setEditingCurrentPick] = useState("");

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
      matches: { complete: matchesComplete + winnersComplete, total: 4 }, // 2 undercard + 2 rumble winners
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading || configLoading) {
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
              </div>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const completion = tabCompletion[tab.id];
            const isComplete = completion.complete === completion.total;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-2 transition-colors relative ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{tab.label}</span>
                <span className={`text-[10px] font-medium ${
                  isComplete 
                    ? "text-success" 
                    : "text-muted-foreground"
                }`}>
                  {isComplete ? (
                    <span className="flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      {completion.complete}/{completion.total}
                    </span>
                  ) : (
                    `${completion.complete}/${completion.total}`
                  )}
                </span>
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200",
                  activeTab === tab.id ? "bg-primary" : "bg-transparent"
                )} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-32">
        {activeTab === "matches" && (
          <MatchesTab 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "mens" && (
          <RumbleTab 
            gender="mens" 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "womens" && (
          <RumbleTab 
            gender="womens" 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
        {activeTab === "chaos" && (
          <ChaosTab 
            picks={picks} 
            results={results} 
            onEditPick={handleEditPick}
            canEdit={canEditPicks}
          />
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            variant="hero"
            className="w-full"
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
      />
    </div>
  );
}


// Matches Tab Component with Wrestler Photos
const MatchesTab = memo(function MatchesTab({ 
  picks, 
  results,
  onEditPick,
  canEdit = false,
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
}) {
  const matchCards = CARD_CONFIG.filter(c => c.type === "match");

  const MatchRow = ({ id, label, pick, result, points }: {
    id: string;
    label: string;
    pick: string | undefined;
    result: string | undefined;
    points: number;
  }) => {
    const isCorrect = pick && result && pick === result;
    const isWrong = pick && result && pick !== result;

    return (
      <button
        onClick={() => {
          if (canEdit && !result) {
            onEditPick?.(id, pick || "");
          }
        }}
        className={cn(
          "w-full min-h-[64px] p-3 rounded-xl border flex items-center gap-4",
          "transition-all active:scale-[0.98]",
          isCorrect ? "bg-success/10 border-success" :
          isWrong ? "bg-destructive/10 border-destructive" :
          "bg-card border-border",
          canEdit && !result && "hover:border-primary/50 cursor-pointer"
        )}
      >
        {/* Wrestler Avatar */}
        <div className="relative flex-shrink-0">
          {pick ? (
            <>
              <img
                src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                alt={getEntrantDisplayName(pick)}
                className={cn(
                  "w-16 h-16 rounded-full object-cover border-2",
                  isCorrect ? "border-success" :
                  isWrong ? "border-destructive" : 
                  "border-primary"
                )}
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                }}
              />
              {isCorrect && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-3 h-3 text-success-foreground" />
                </div>
              )}
              {isWrong && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                  <X className="w-3 h-3 text-destructive-foreground" />
                </div>
              )}
            </>
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center animate-pulse">
              <Plus className="w-5 h-5 text-muted-foreground/50" />
            </div>
          )}
        </div>
        
        {/* Title and name stacked */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className={cn(
            "font-semibold text-foreground truncate",
            isWrong && "line-through text-destructive/80"
          )}>
            {pick ? getEntrantDisplayName(pick) : `+${points} pts`}
          </div>
          {result && !isCorrect && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Winner: {result}
            </div>
          )}
        </div>
        
        {/* Right side - edit indicator or points */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isCorrect && (
            <span className="text-xs font-bold text-success bg-success/20 px-2 py-1 rounded">
              +{points}
            </span>
          )}
          {canEdit && !result && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Pencil size={14} />
              <ChevronRight size={16} />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {matchCards.map((card) => (
        <MatchRow
          key={card.id}
          id={card.id}
          label={card.title}
          pick={picks[card.id]}
          result={results[card.id]}
          points={SCORING.UNDERCARD_WINNER}
        />
      ))}
      {["mens_rumble_winner", "womens_rumble_winner"].map((id) => (
        <MatchRow
          key={id}
          id={id}
          label={id.includes("mens") ? "Men's Rumble Winner" : "Women's Rumble Winner"}
          pick={picks[id]}
          result={results[id]}
          points={SCORING.RUMBLE_WINNER_PICK}
        />
      ))}
    </div>
  );
});

// Rumble Props Tab Component
const RumbleTab = memo(function RumbleTab({ 
  gender,
  picks, 
  results,
  onEditPick,
  canEdit = false,
}: { 
  gender: "mens" | "womens"; 
  picks: Record<string, string>; 
  results: Record<string, string>;
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
}) {
  const isMobile = useIsMobile();
  const title = gender === "mens" ? "Men's Rumble Props" : "Women's Rumble Props";

  // Map prop IDs to display info
  const propPoints: Record<string, number> = {
    entrant_1: SCORING.ENTRANT_GUESS,
    entrant_30: SCORING.ENTRANT_GUESS,
    first_elimination: SCORING.FIRST_ELIMINATION,
    most_eliminations: SCORING.MOST_ELIMINATIONS,
    longest_time: SCORING.LONGEST_TIME,
  };

  return (
    <div className="space-y-3">
      
      {isMobile ? (
        // MOBILE: Single-column list with large avatars
        <div className="space-y-2">
          {RUMBLE_PROPS.map((prop) => {
            const matchId = `${gender}_${prop.id}`;
            const pick = picks[matchId];
            const result = results[matchId];
            const isCorrect = pick && result && pick === result;
            const isWrong = pick && result && pick !== result;
            const points = propPoints[prop.id] || SCORING.PROP_BET;

            return (
              <button
                key={matchId}
                onClick={() => {
                  if (canEdit && !result) {
                    onEditPick?.(matchId, pick || "");
                  }
                }}
                className={cn(
                  "w-full min-h-[64px] p-3 rounded-xl border flex items-center gap-4",
                  "transition-all active:scale-[0.98]",
                  isCorrect ? "bg-success/10 border-success" :
                  isWrong ? "bg-destructive/10 border-destructive" :
                  "bg-card border-border",
                  canEdit && !result && "hover:border-primary/50 cursor-pointer"
                )}
              >
                {/* Large avatar on left */}
                <div className="relative flex-shrink-0">
                  {pick ? (
                    <>
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                        className={cn(
                          "w-16 h-16 rounded-full object-cover border-2",
                          isCorrect ? "border-success" :
                          isWrong ? "border-destructive" : 
                          "border-primary"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                      {isCorrect && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center animate-pulse">
                      <Plus className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                
                {/* Title and name stacked on right */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {prop.title}
                  </div>
                  <div className={cn(
                    "font-semibold truncate",
                    pick ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {pick ? getEntrantDisplayName(pick) : `+${points} pts`}
                  </div>
                </div>
                
                {/* Right side - edit indicator or points */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {isCorrect && (
                    <span className="text-xs font-bold text-success bg-success/20 px-2 py-1 rounded">
                      +{points}
                    </span>
                  )}
                  {canEdit && !result && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Pencil size={14} />
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // DESKTOP: 2-column grid with photos
        <div className="grid grid-cols-2 gap-2">
          {RUMBLE_PROPS.map((prop) => {
            const matchId = `${gender}_${prop.id}`;
            const pick = picks[matchId];
            const result = results[matchId];
            const isCorrect = pick && result && pick === result;
            const isWrong = pick && result && pick !== result;
            const points = propPoints[prop.id] || SCORING.PROP_BET;

            return (
              <div
                key={matchId}
                className={cn(
                  "p-3 rounded-xl border transition-all relative group",
                  isCorrect
                    ? "bg-success/10 border-success"
                    : isWrong
                    ? "bg-destructive/10 border-destructive"
                    : "bg-card border-border",
                  canEdit && !result && "hover:border-primary/50 cursor-pointer"
                )}
                onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
              >
                <div className="text-xs text-muted-foreground mb-2">{prop.title}</div>
                {pick ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                        className={cn(
                          "w-10 h-10 rounded-full object-cover border-2",
                          isCorrect 
                            ? "border-success" 
                            : isWrong 
                              ? "border-destructive" 
                              : "border-primary"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                      {isCorrect && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-success-foreground" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-destructive-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {getEntrantDisplayName(pick)}
                    </span>
                    {canEdit && !result && (
                      <Pencil size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No pick - +{points} pts
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Final Four - bigger photos on mobile */}
      <div className="mt-6 p-4 rounded-xl border border-primary/50 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Final Four</span>
          </div>
          <span className="text-xs text-primary">+{SCORING.FINAL_FOUR_PICK} pts each</span>
        </div>
        
        {/* 4-column grid for photos */}
        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, i) => {
            const matchId = `${gender}_final_four_${i + 1}`;
            const pick = picks[matchId];
            
            // Check if this pick is correct (any of the Final Four results)
            const finalFourResults = Array.from({ length: 4 }).map((_, j) => 
              results[`${gender}_final_four_${j + 1}`]
            ).filter(Boolean);
            const isCorrect = pick && finalFourResults.includes(pick);
            const isWrong = pick && finalFourResults.length > 0 && !finalFourResults.includes(pick);

            return (
              <div key={matchId} className="flex flex-col items-center">
                <button
                  onClick={() => canEdit && !finalFourResults.length && onEditPick?.(matchId, pick || "")}
                  disabled={!canEdit || !!finalFourResults.length}
                  className="relative"
                >
                  {pick ? (
                    <>
                      <img
                        src={getWrestlerImageUrl(getEntrantDisplayName(pick))}
                        alt={getEntrantDisplayName(pick)}
                        className={cn(
                          isMobile ? "w-[72px] h-[72px]" : "w-16 h-16",
                          "rounded-full object-cover border-2",
                          isCorrect 
                            ? "border-success" 
                            : isWrong 
                              ? "border-destructive" 
                              : "border-primary"
                        )}
                        onError={(e) => {
                          e.currentTarget.src = getPlaceholderImageUrl(getEntrantDisplayName(pick));
                        }}
                      />
                      {isCorrect && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      )}
                      {canEdit && !finalFourResults.length && (
                        <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/30 flex items-center justify-center transition-colors">
                          <Pencil size={16} className="text-white opacity-0 hover:opacity-100" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={cn(
                      isMobile ? "w-[72px] h-[72px]" : "w-16 h-16",
                      "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center",
                      canEdit && "hover:border-primary/50"
                    )}>
                      <Plus className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-muted-foreground">
            {Array.from({ length: FINAL_FOUR_SLOTS }).filter((_, i) => picks[`${gender}_final_four_${i + 1}`]).length}/4 picked
          </span>
        </div>
      </div>
    </div>
  );
});

// Chaos Props Tab Component
const ChaosTab = memo(function ChaosTab({
  picks, 
  results,
  onEditPick,
  canEdit = false,
}: { 
  picks: Record<string, string>; 
  results: Record<string, string>;
  onEditPick?: (matchId: string, currentPick: string) => void;
  canEdit?: boolean;
}) {
  const getPickResult = (matchId: string): boolean | null => {
    const pick = picks[matchId];
    const result = results[matchId];
    if (!pick || !result) return null;
    return pick === result;
  };

  const renderCell = (matchId: string) => {
    const pick = picks[matchId];
    const result = results[matchId];
    const isCorrect = getPickResult(matchId);
    
    return (
      <button
        onClick={() => canEdit && !result && onEditPick?.(matchId, pick || "")}
        disabled={!canEdit || !!result}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded min-h-[44px]",
          canEdit && !result && "hover:bg-muted/50 transition-colors",
          isCorrect === true
            ? "bg-success/10"
            : isCorrect === false
            ? "bg-destructive/10"
            : ""
        )}
      >
        <span className={cn(
          "text-sm font-bold",
          pick === "YES" ? "text-success" : pick === "NO" ? "text-destructive" : "text-muted-foreground"
        )}>
          {pick || "—"}
        </span>
        {isCorrect === true && <Check size={14} className="text-success" />}
        {isCorrect === false && <X size={14} className="text-destructive" />}
        {canEdit && !result && pick && (
          <Pencil size={12} className="text-muted-foreground ml-1" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Chaos Prop
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Men's
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Women's
            </th>
          </tr>
        </thead>
        <tbody>
          {CHAOS_PROPS.map((prop, index) => {
            const mensMatchId = `mens_chaos_prop_${index + 1}`;
            const womensMatchId = `womens_chaos_prop_${index + 1}`;
            
            return (
              <tr key={prop.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2.5">
                  <div className="text-sm font-medium text-foreground">
                    {prop.shortName}
                  </div>
                </td>
                <td className="px-2 py-2">
                  {renderCell(mensMatchId)}
                </td>
                <td className="px-2 py-2">
                  {renderCell(womensMatchId)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
