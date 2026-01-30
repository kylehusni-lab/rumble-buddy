import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Check, Save, Swords, Trophy, Zap, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getSoloResults, 
  saveSoloResults, 
  getSoloPicks,
  getSoloRumbleNumbers,
  saveSoloRumbleNumbers,
  initSoloRumbleNumbers,
  SoloRumbleNumber,
} from "@/lib/solo-storage";
import { 
  CARD_CONFIG, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS 
} from "@/lib/constants";
import { toast } from "sonner";
import { RumbleEntryControl } from "@/components/host/RumbleEntryControl";
import { ActiveWrestlerCard } from "@/components/host/ActiveWrestlerCard";
import { EliminationModal } from "@/components/host/EliminationModal";
import { WinnerDeclarationModal } from "@/components/host/WinnerDeclarationModal";
import { AddSurpriseEntrantModal } from "@/components/host/AddSurpriseEntrantModal";
import { sortEntrants, getEntrantDisplayName } from "@/lib/entrant-utils";

interface SoloScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultsUpdated: () => void;
  mensEntrants: string[];
  womensEntrants: string[];
}

type ScoringTab = "matches" | "mens" | "womens" | "chaos";

export function SoloScoringModal({ 
  isOpen, 
  onClose, 
  onResultsUpdated,
  mensEntrants,
  womensEntrants 
}: SoloScoringModalProps) {
  const [activeTab, setActiveTab] = useState<ScoringTab>("matches");
  const [results, setResults] = useState<Record<string, string>>({});
  const picks = getSoloPicks();

  // Rumble tracking state
  const [mensNumbers, setMensNumbers] = useState<SoloRumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<SoloRumbleNumber[]>([]);
  const [mensMatchStarted, setMensMatchStarted] = useState(false);
  const [womensMatchStarted, setWomensMatchStarted] = useState(false);
  const [mensSurpriseEntrants, setMensSurpriseEntrants] = useState<string[]>([]);
  const [womensSurpriseEntrants, setWomensSurpriseEntrants] = useState<string[]>([]);
  
  // Timer
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Elimination modal state
  const [eliminationTarget, setEliminationTarget] = useState<SoloRumbleNumber | null>(null);
  const [eliminationType, setEliminationType] = useState<"mens" | "womens">("mens");
  
  // Winner modal state
  const [winnerData, setWinnerData] = useState<{
    type: "mens" | "womens";
    number: SoloRumbleNumber;
    ironPerson: SoloRumbleNumber | null;
    correctPredictionCount: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResults(getSoloResults());
      setMensNumbers(getSoloRumbleNumbers('mens'));
      setWomensNumbers(getSoloRumbleNumbers('womens'));
      
      // Check if match has entries with timestamps (started)
      const mensNums = getSoloRumbleNumbers('mens');
      const womensNums = getSoloRumbleNumbers('womens');
      setMensMatchStarted(mensNums.some(n => n.entry_timestamp));
      setWomensMatchStarted(womensNums.some(n => n.entry_timestamp));
    }
  }, [isOpen]);

  // Timer update
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSave = () => {
    saveSoloResults(results);
    saveSoloRumbleNumbers('mens', mensNumbers);
    saveSoloRumbleNumbers('womens', womensNumbers);
    onResultsUpdated();
    toast.success("Results saved!");
    onClose();
  };

  const handleResultChange = (matchId: string, value: string) => {
    setResults(prev => ({ ...prev, [matchId]: value }));
  };

  const handleClearResult = (matchId: string) => {
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[matchId];
      return newResults;
    });
  };

  // Rumble entry handler
  const handleConfirmEntry = async (type: "mens" | "womens", wrestlerName: string) => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const matchStarted = type === "mens" ? mensMatchStarted : womensMatchStarted;
    const enteredCount = numbers.filter(n => n.wrestler_name).length;
    const nextNumber = enteredCount + 1;
    
    if (nextNumber > 30) return;

    const shouldSetTimestamp = matchStarted || nextNumber > 2;
    
    const updatedNumbers = numbers.map(n => 
      n.number === nextNumber 
        ? { 
            ...n, 
            wrestler_name: wrestlerName,
            entry_timestamp: shouldSetTimestamp ? new Date().toISOString() : null,
          }
        : n
    );
    
    if (type === "mens") {
      setMensNumbers(updatedNumbers);
      saveSoloRumbleNumbers('mens', updatedNumbers);
    } else {
      setWomensNumbers(updatedNumbers);
      saveSoloRumbleNumbers('womens', updatedNumbers);
    }
    
    // Auto-populate #1 and #30 entrant results
    if (nextNumber === 1) {
      handleResultChange(`${type}_entrant_1`, wrestlerName);
    } else if (nextNumber === 30) {
      handleResultChange(`${type}_entrant_30`, wrestlerName);
    }
    
    toast.success(`#${nextNumber} ${wrestlerName} has entered!`);
  };

  // Start match handler
  const handleStartMatch = (type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const now = new Date().toISOString();
    
    const updatedNumbers = numbers.map(n => 
      n.wrestler_name && !n.entry_timestamp 
        ? { ...n, entry_timestamp: now }
        : n
    );
    
    if (type === "mens") {
      setMensNumbers(updatedNumbers);
      setMensMatchStarted(true);
      saveSoloRumbleNumbers('mens', updatedNumbers);
    } else {
      setWomensNumbers(updatedNumbers);
      setWomensMatchStarted(true);
      saveSoloRumbleNumbers('womens', updatedNumbers);
    }
    
    toast.success(`${type === "mens" ? "Men's" : "Women's"} Rumble has begun!`);
  };

  // Add surprise entrant
  const handleAddSurprise = (type: "mens" | "womens", name: string) => {
    if (type === "mens") {
      setMensSurpriseEntrants(prev => [...prev, name]);
    } else {
      setWomensSurpriseEntrants(prev => [...prev, name]);
    }
  };

  // Handle elimination
  const handleElimination = (eliminatedByNumber: number) => {
    if (!eliminationTarget) return;

    const type = eliminationType;
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const now = new Date();
    
    const updatedNumbers = numbers.map(n => 
      n.number === eliminationTarget.number 
        ? { 
            ...n, 
            elimination_timestamp: now.toISOString(),
            eliminated_by_number: eliminatedByNumber,
          }
        : n
    );
    
    if (type === "mens") {
      setMensNumbers(updatedNumbers);
      saveSoloRumbleNumbers('mens', updatedNumbers);
    } else {
      setWomensNumbers(updatedNumbers);
      saveSoloRumbleNumbers('womens', updatedNumbers);
    }
    
    // Check for first elimination
    const previouslyEliminated = numbers.filter(n => n.elimination_timestamp);
    if (previouslyEliminated.length === 0 && eliminationTarget.wrestler_name) {
      handleResultChange(`${type}_first_elimination`, eliminationTarget.wrestler_name);
    }
    
    // Check for Final Four
    const activeAfterElimination = updatedNumbers.filter(n => 
      n.entry_timestamp && !n.elimination_timestamp
    );
    
    if (activeAfterElimination.length === 4) {
      activeAfterElimination.forEach((wrestler, idx) => {
        if (wrestler.wrestler_name) {
          handleResultChange(`${type}_final_four_${idx + 1}`, wrestler.wrestler_name);
        }
      });
      toast.success("Final Four reached!");
    }
    
    // Check for winner
    if (activeAfterElimination.length === 1) {
      const winner = activeAfterElimination[0];
      
      // Calculate Iron Man/Woman
      const withDurations = updatedNumbers
        .filter(n => n.entry_timestamp)
        .map(n => ({
          ...n,
          duration: n.elimination_timestamp
            ? new Date(n.elimination_timestamp).getTime() - new Date(n.entry_timestamp!).getTime()
            : now.getTime() - new Date(n.entry_timestamp!).getTime(),
        }));
      
      const ironPerson = withDurations.reduce((max, n) => 
        n.duration > (max?.duration || 0) ? n : max
      , null as (SoloRumbleNumber & { duration: number }) | null);
      
      // Calculate most eliminations
      const eliminationCounts = new Map<number, number>();
      updatedNumbers.forEach(n => {
        if (n.eliminated_by_number) {
          eliminationCounts.set(n.eliminated_by_number, (eliminationCounts.get(n.eliminated_by_number) || 0) + 1);
        }
      });
      
      let mostElimsNumber: number | null = null;
      let maxElims = 0;
      eliminationCounts.forEach((count, num) => {
        if (count > maxElims) {
          maxElims = count;
          mostElimsNumber = num;
        }
      });
      
      if (mostElimsNumber) {
        const mostElimsWrestler = updatedNumbers.find(n => n.number === mostElimsNumber)?.wrestler_name;
        if (mostElimsWrestler) {
          handleResultChange(`${type}_most_eliminations`, mostElimsWrestler);
        }
      }
      
      // Set Iron Man/Woman
      if (ironPerson?.wrestler_name) {
        handleResultChange(`${type}_longest_time`, ironPerson.wrestler_name);
      }
      
      setWinnerData({
        type,
        number: winner,
        ironPerson: ironPerson as SoloRumbleNumber | null,
        correctPredictionCount: 0, // Not applicable for solo
      });
    }
    
    setEliminationTarget(null);
  };

  // Confirm winner
  const handleConfirmWinner = () => {
    if (!winnerData) return;
    
    const { type, number: winner } = winnerData;
    
    if (winner.wrestler_name) {
      handleResultChange(`${type}_rumble_winner`, winner.wrestler_name);
      toast.success(`${winner.wrestler_name} wins the ${type === "mens" ? "Men's" : "Women's"} Royal Rumble!`);
    }
    
    setWinnerData(null);
  };

  // Computed values
  const getDuration = useCallback((entryTimestamp: string | null) => {
    if (!entryTimestamp) return 0;
    return Math.floor((currentTime - new Date(entryTimestamp).getTime()) / 1000);
  }, [currentTime]);

  const getEliminationCount = useCallback((number: number, type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    return numbers.filter(n => n.eliminated_by_number === number).length;
  }, [mensNumbers, womensNumbers]);

  const mensActiveWrestlers = useMemo(() => {
    return mensNumbers
      .filter(n => n.wrestler_name && !n.elimination_timestamp)
      .sort((a, b) => b.number - a.number);
  }, [mensNumbers]);

  const womensActiveWrestlers = useMemo(() => {
    return womensNumbers
      .filter(n => n.wrestler_name && !n.elimination_timestamp)
      .sort((a, b) => b.number - a.number);
  }, [womensNumbers]);

  const mensEnteredCount = mensNumbers.filter(n => n.wrestler_name).length;
  const womensEnteredCount = womensNumbers.filter(n => n.wrestler_name).length;

  const allMensEntrants = useMemo(() => {
    const enteredNames = new Set(
      mensNumbers.filter(n => n.wrestler_name).map(n => n.wrestler_name!.toLowerCase())
    );
    return [...mensEntrants, ...mensSurpriseEntrants]
      .filter(name => !enteredNames.has(getEntrantDisplayName(name).toLowerCase()));
  }, [mensEntrants, mensSurpriseEntrants, mensNumbers]);

  const allWomensEntrants = useMemo(() => {
    const enteredNames = new Set(
      womensNumbers.filter(n => n.wrestler_name).map(n => n.wrestler_name!.toLowerCase())
    );
    return [...womensEntrants, ...womensSurpriseEntrants]
      .filter(name => !enteredNames.has(getEntrantDisplayName(name).toLowerCase()));
  }, [womensEntrants, womensSurpriseEntrants, womensNumbers]);

  if (!isOpen) return null;

  const tabs = [
    { id: "matches" as const, icon: Swords, label: "Matches" },
    { id: "mens" as const, icon: Hash, label: "Men's" },
    { id: "womens" as const, icon: Hash, label: "Women's" },
    { id: "chaos" as const, icon: Zap, label: "Chaos" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Full screen modal - no blur behind */}
      <div className="flex-1 w-full max-w-lg mx-auto bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">Score Results</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {activeTab === "matches" && (
            <MatchesScoring 
              results={results} 
              picks={picks}
              onChange={handleResultChange}
              onClear={handleClearResult}
            />
          )}
          {activeTab === "mens" && (
            <RumbleTracking
              type="mens"
              numbers={mensNumbers}
              activeWrestlers={mensActiveWrestlers}
              enteredCount={mensEnteredCount}
              matchStarted={mensMatchStarted}
              allEntrants={allMensEntrants}
              results={results}
              getDuration={getDuration}
              getEliminationCount={getEliminationCount}
              onConfirmEntry={(wrestler) => handleConfirmEntry("mens", wrestler)}
              onStartMatch={() => handleStartMatch("mens")}
              onAddSurprise={(name) => handleAddSurprise("mens", name)}
              onEliminate={(wrestler) => {
                setEliminationTarget(wrestler);
                setEliminationType("mens");
              }}
            />
          )}
          {activeTab === "womens" && (
            <RumbleTracking
              type="womens"
              numbers={womensNumbers}
              activeWrestlers={womensActiveWrestlers}
              enteredCount={womensEnteredCount}
              matchStarted={womensMatchStarted}
              allEntrants={allWomensEntrants}
              results={results}
              getDuration={getDuration}
              getEliminationCount={getEliminationCount}
              onConfirmEntry={(wrestler) => handleConfirmEntry("womens", wrestler)}
              onStartMatch={() => handleStartMatch("womens")}
              onAddSurprise={(name) => handleAddSurprise("womens", name)}
              onEliminate={(wrestler) => {
                setEliminationTarget(wrestler);
                setEliminationType("womens");
              }}
            />
          )}
          {activeTab === "chaos" && (
            <ChaosScoring 
              results={results} 
              picks={picks}
              onChange={handleResultChange}
              onClear={handleClearResult}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <Button variant="hero" className="w-full" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Results
          </Button>
        </div>
      </div>
    

      {/* Elimination Modal */}
      <EliminationModal
        open={!!eliminationTarget}
        onOpenChange={(open) => !open && setEliminationTarget(null)}
        targetNumber={eliminationTarget?.number || 0}
        targetWrestler={eliminationTarget?.wrestler_name || ""}
        activeWrestlers={(eliminationType === "mens" ? mensActiveWrestlers : womensActiveWrestlers).map(w => ({
          number: w.number,
          wrestler_name: w.wrestler_name || "",
          ownerName: null,
        }))}
        onConfirm={async (eliminatedByNumber) => {
          handleElimination(eliminatedByNumber);
        }}
      />

      {/* Winner Modal */}
      <WinnerDeclarationModal
        open={!!winnerData}
        onOpenChange={(open) => !open && setWinnerData(null)}
        type={winnerData?.type || "mens"}
        winnerName={winnerData?.number.wrestler_name || ""}
        winnerNumber={winnerData?.number.number || 0}
        ownerName={null}
        ironPersonName={winnerData?.ironPerson?.wrestler_name || null}
        correctPredictionCount={0}
        onConfirm={async () => {
          handleConfirmWinner();
        }}
      />
    </div>
  );
}

// Rumble Tracking Component (Solo Mode)
function RumbleTracking({ 
  type,
  numbers,
  activeWrestlers,
  enteredCount,
  matchStarted,
  allEntrants,
  results,
  getDuration,
  getEliminationCount,
  onConfirmEntry,
  onStartMatch,
  onAddSurprise,
  onEliminate,
}: { 
  type: "mens" | "womens";
  numbers: SoloRumbleNumber[];
  activeWrestlers: SoloRumbleNumber[];
  enteredCount: number;
  matchStarted: boolean;
  allEntrants: string[];
  results: Record<string, string>;
  getDuration: (timestamp: string | null) => number;
  getEliminationCount: (number: number, type: "mens" | "womens") => number;
  onConfirmEntry: (wrestler: string) => Promise<void>;
  onStartMatch: () => void;
  onAddSurprise: (name: string) => void;
  onEliminate: (wrestler: SoloRumbleNumber) => void;
}) {
  const title = type === "mens" ? "Men's Rumble" : "Women's Rumble";
  const nextNumber = enteredCount + 1;
  const isComplete = enteredCount >= 30;
  const winnerName = results[`${type}_rumble_winner`];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track {title.toLowerCase()} entries and eliminations in real-time.
      </p>

      {/* Winner Banner */}
      {winnerName && (
        <div className="bg-primary/20 border border-primary rounded-xl p-4 text-center">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-primary">{winnerName}</p>
          <p className="text-sm text-muted-foreground">Winner</p>
        </div>
      )}

      {/* Entry Control */}
      {!winnerName && (
        <RumbleEntryControl
          nextNumber={nextNumber}
          ownerName={null}
          entrants={allEntrants}
          enteredCount={enteredCount}
          onConfirmEntry={onConfirmEntry}
          matchStarted={matchStarted}
          onStartMatch={onStartMatch}
          onAddSurprise={onAddSurprise}
          showOwner={false}
        />
      )}

      {/* Active Wrestlers */}
      {!winnerName && activeWrestlers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold flex items-center justify-between">
            Active Wrestlers
            <span className="text-sm font-normal text-muted-foreground">
              ({activeWrestlers.length})
            </span>
          </h3>
          {activeWrestlers.map((wrestler) => (
            <ActiveWrestlerCard
              key={wrestler.number}
              number={wrestler.number}
              wrestlerName={wrestler.wrestler_name || "Unknown"}
              ownerName={null}
              duration={getDuration(wrestler.entry_timestamp)}
              eliminationCount={getEliminationCount(wrestler.number, type)}
              onEliminate={() => onEliminate(wrestler)}
              showOwner={false}
            />
          ))}
        </div>
      )}

      {/* Derived Results Summary */}
      {(results[`${type}_first_elimination`] || results[`${type}_longest_time`]) && (
        <div className="border-t border-border pt-4 mt-4 space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Auto-Recorded Results</h4>
          {results[`${type}_first_elimination`] && (
            <div className="text-sm">
              <span className="text-muted-foreground">First Elimination:</span>{" "}
              <span className="font-medium">{results[`${type}_first_elimination`]}</span>
            </div>
          )}
          {results[`${type}_most_eliminations`] && (
            <div className="text-sm">
              <span className="text-muted-foreground">Most Eliminations:</span>{" "}
              <span className="font-medium">{results[`${type}_most_eliminations`]}</span>
            </div>
          )}
          {results[`${type}_longest_time`] && (
            <div className="text-sm">
              <span className="text-muted-foreground">Iron {type === "mens" ? "Man" : "Woman"}:</span>{" "}
              <span className="font-medium">{results[`${type}_longest_time`]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Matches Scoring Component
function MatchesScoring({ 
  results, 
  picks,
  onChange,
  onClear 
}: { 
  results: Record<string, string>;
  picks: Record<string, string>;
  onChange: (matchId: string, value: string) => void;
  onClear: (matchId: string) => void;
}) {
  const matchCards = CARD_CONFIG.filter(c => c.type === "match");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select the winner for each match to calculate your score.
      </p>

      {matchCards.map((card) => (
        <div key={card.id} className="space-y-2">
          <div className="text-sm font-medium text-foreground">{card.title}</div>
          <div className="flex gap-2">
            {(card.options as readonly string[]).map((option) => {
              const isSelected = results[card.id] === option;
              const isPicked = picks[card.id] === option;
              
              return (
                <button
                  key={option}
                  onClick={() => isSelected ? onClear(card.id) : onChange(card.id, option)}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  {option}
                  {isPicked && <span className="ml-1 opacity-60">(you)</span>}
                  {isSelected && <Check className="w-4 h-4 inline ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}

// Chaos Props Scoring Component
function ChaosScoring({ 
  results, 
  picks,
  onChange,
  onClear 
}: { 
  results: Record<string, string>;
  picks: Record<string, string>;
  onChange: (matchId: string, value: string) => void;
  onClear: (matchId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {["mens", "womens"].map((gender) => (
        <div key={gender}>
          <h4 className="text-md font-bold text-foreground mb-3">
            {gender === "mens" ? "Men's" : "Women's"} Chaos Props
          </h4>
          <div className="space-y-3">
            {CHAOS_PROPS.map((prop, index) => {
              const matchId = `${gender}_chaos_prop_${index + 1}`;
              
              return (
                <div key={matchId} className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{prop.shortName}</div>
                  <div className="flex gap-2">
                    {["YES", "NO"].map((option) => {
                      const isSelected = results[matchId] === option;
                      const isPicked = picks[matchId] === option;
                      
                      return (
                        <button
                          key={option}
                          onClick={() => isSelected ? onClear(matchId) : onChange(matchId, option)}
                          className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? option === "YES"
                                ? "bg-success text-success-foreground border-success"
                                : "bg-destructive text-destructive-foreground border-destructive"
                              : "bg-card border-border hover:border-primary/50"
                          }`}
                        >
                          {option}
                          {isPicked && <span className="ml-1 opacity-60">(you)</span>}
                        </button>
                      );
                    })}
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
