import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, Sparkles } from "lucide-react";

interface RumbleEntryControlProps {
  nextNumber: number;
  ownerName: string | null;
  entrants: string[];
  enteredCount: number;
  onConfirmEntry: (wrestlerName: string) => Promise<void>;
  disabled?: boolean;
  // New props for match start and surprise entrants
  matchStarted: boolean;
  onStartMatch: () => void;
  onAddSurprise: (name: string) => void;
}

export function RumbleEntryControl({
  nextNumber,
  ownerName,
  entrants,
  enteredCount,
  onConfirmEntry,
  disabled = false,
  matchStarted,
  onStartMatch,
  onAddSurprise,
}: RumbleEntryControlProps) {
  const [selectedWrestler, setSelectedWrestler] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const progress = (enteredCount / 30) * 100;
  const isComplete = enteredCount >= 30;

  // Show match start UI until match is started (button enabled only when 2+ entrants)
  const showMatchStartUI = !matchStarted;

  // Alphabetize and filter entrants
  const filteredEntrants = useMemo(() => {
    return [...entrants]
      .sort((a, b) => a.localeCompare(b))
      .filter((name) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [entrants, searchQuery]);

  const handleConfirm = async () => {
    if (!selectedWrestler) return;

    setIsSubmitting(true);
    try {
      await onConfirmEntry(selectedWrestler);
      setSelectedWrestler("");
      setSearchQuery("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWrestlerSelect = (wrestler: string) => {
    setSelectedWrestler(wrestler);
  };

  const handleAddSurprise = (name: string) => {
    onAddSurprise(name);
    setSelectedWrestler(name);
    setSearchQuery("");
  };

  if (isComplete) {
    return (
      <div className="bg-success/10 border border-success rounded-xl p-4 text-center">
        <p className="text-success font-semibold">All 30 entrants have entered!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{enteredCount}/30 entered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Entry control */}
      <div className="bg-primary/10 border border-primary rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Next Entrant</span>
          <span className="text-3xl font-black text-primary">#{nextNumber}</span>
        </div>

        <div className="text-sm">
          Owner:{" "}
          <span className="font-semibold">
            {ownerName || <span className="text-muted-foreground">Vacant</span>}
          </span>
        </div>

        {/* Match Start UI for #1 and #2 */}
        {showMatchStartUI && (
          <div className="bg-accent/20 border border-accent rounded-lg p-3 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Match hasn't started yet. Timer begins when you start the match.
            </p>
            <Button
              variant="secondary"
              className="w-full min-h-[48px]"
              onClick={onStartMatch}
              disabled={disabled || enteredCount < 2}
            >
              <Bell size={18} className="mr-2" />
              Start Match
            </Button>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wrestlers..."
            className="pl-10 min-h-[48px]"
            disabled={disabled || isSubmitting}
          />
        </div>

        {/* Wrestler list */}
        <ScrollArea className="h-48 border border-border rounded-lg">
          <div className="p-2 space-y-1">
            {filteredEntrants.length > 0 ? (
              filteredEntrants.map((wrestler) => (
                <button
                  key={wrestler}
                  onClick={() => handleWrestlerSelect(wrestler)}
                  disabled={disabled || isSubmitting}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors min-h-[44px] ${
                    selectedWrestler === wrestler
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {wrestler}
                </button>
              ))
            ) : searchQuery.length > 0 ? (
              <div className="p-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No wrestlers match "{searchQuery}"
                </p>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px] border-primary text-primary"
                  onClick={() => {
                    onAddSurprise(searchQuery.trim());
                    setSelectedWrestler(searchQuery.trim());
                    setSearchQuery("");
                  }}
                  disabled={!searchQuery.trim()}
                >
                  <Sparkles size={16} className="mr-2" />
                  Add "{searchQuery}" as Entry
                </Button>
              </div>
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Start typing to search...
              </p>
            )}

          </div>
        </ScrollArea>

        {/* Selected wrestler display */}
        {selectedWrestler && (
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between">
            <span className="font-medium">{selectedWrestler}</span>
            <button
              onClick={() => setSelectedWrestler("")}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Clear
            </button>
          </div>
        )}

        <Button
          variant="gold"
          className="w-full min-h-[48px]"
          onClick={handleConfirm}
          disabled={!selectedWrestler || isSubmitting || disabled}
        >
          {isSubmitting ? "Entering..." : `Confirm #${nextNumber} Entry`}
        </Button>
      </div>
    </div>
  );
}
