import { useState, useEffect } from "react";
import { X, Check, Save, Swords, Trophy, Zap, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getSoloResults, 
  saveSoloResults, 
  getSoloPicks 
} from "@/lib/solo-storage";
import { 
  CARD_CONFIG, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS 
} from "@/lib/constants";
import { toast } from "sonner";

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

  useEffect(() => {
    if (isOpen) {
      setResults(getSoloResults());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSoloResults(results);
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

  if (!isOpen) return null;

  const tabs = [
    { id: "matches" as const, icon: Swords, label: "Matches" },
    { id: "mens" as const, icon: Hash, label: "Men's" },
    { id: "womens" as const, icon: Hash, label: "Women's" },
    { id: "chaos" as const, icon: Zap, label: "Chaos" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg max-h-[90vh] bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Score Results</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
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

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {activeTab === "matches" && (
            <MatchesScoring 
              results={results} 
              picks={picks}
              onChange={handleResultChange}
              onClear={handleClearResult}
            />
          )}
          {activeTab === "mens" && (
            <RumbleScoring 
              gender="mens" 
              results={results} 
              picks={picks}
              entrants={mensEntrants}
              onChange={handleResultChange}
              onClear={handleClearResult}
            />
          )}
          {activeTab === "womens" && (
            <RumbleScoring 
              gender="womens" 
              results={results} 
              picks={picks}
              entrants={womensEntrants}
              onChange={handleResultChange}
              onClear={handleClearResult}
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
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="hero" className="w-full" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Results
          </Button>
        </div>
      </div>
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

// Rumble Props Scoring Component
function RumbleScoring({ 
  gender,
  results, 
  picks,
  entrants,
  onChange,
  onClear 
}: { 
  gender: "mens" | "womens";
  results: Record<string, string>;
  picks: Record<string, string>;
  entrants: string[];
  onChange: (matchId: string, value: string) => void;
  onClear: (matchId: string) => void;
}) {
  const title = gender === "mens" ? "Men's Rumble Props" : "Women's Rumble Props";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Enter the actual results for {title.toLowerCase()}.
      </p>

      {/* Wrestler Props */}
      {RUMBLE_PROPS.filter(p => p.type === "wrestler").map((prop) => {
        const matchId = `${gender}_${prop.id}`;
        
        return (
          <div key={matchId} className="space-y-2">
            <div className="text-sm font-medium text-foreground">{prop.title}</div>
            <select
              value={results[matchId] || ""}
              onChange={(e) => e.target.value ? onChange(matchId, e.target.value) : onClear(matchId)}
              className="w-full p-3 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="">Select result...</option>
              {entrants.map((entrant) => (
                <option key={entrant} value={entrant.replace("*", "")}>
                  {entrant.replace("*", "")}
                  {picks[matchId] === entrant.replace("*", "") ? " (your pick)" : ""}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {/* Final Four */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-md font-bold text-foreground mb-3">Final Four</h4>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: FINAL_FOUR_SLOTS }).map((_, i) => {
            const matchId = `${gender}_final_four_${i + 1}`;
            
            return (
              <div key={matchId}>
                <div className="text-xs text-muted-foreground mb-1">#{i + 1}</div>
                <select
                  value={results[matchId] || ""}
                  onChange={(e) => e.target.value ? onChange(matchId, e.target.value) : onClear(matchId)}
                  className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-sm"
                >
                  <option value="">Select...</option>
                  {entrants.map((entrant) => (
                    <option key={entrant} value={entrant.replace("*", "")}>
                      {entrant.replace("*", "")}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
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
