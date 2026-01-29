import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, Sparkles } from "lucide-react";
import { isUnconfirmedEntrant, getEntrantDisplayName, sortEntrants } from "@/lib/entrant-utils";
import { cn } from "@/lib/utils";
import { AddSurpriseEntrantModal } from "./AddSurpriseEntrantModal";

interface RumbleEntryControlProps {
  nextNumber: number;
  ownerName: string | null;
  entrants: string[];
  enteredCount: number;
  onConfirmEntry: (wrestlerName: string) => Promise<void>;
  disabled?: boolean;
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
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);

  const progress = (enteredCount / 30) * 100;
  const isComplete = enteredCount >= 30;

  const showMatchStartUI = !matchStarted;

  // Filter entrants based on search - only show when there's input
  const filteredEntrants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return [...entrants]
      .sort(sortEntrants)
      .filter((name) =>
        getEntrantDisplayName(name).toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [entrants, searchQuery]);

  const handleConfirm = async () => {
    if (!selectedWrestler) return;

    // If "Surprise/Other Entrant" is selected, show the modal to get actual name
    if (selectedWrestler.includes("Surprise")) {
      setShowSurpriseModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmEntry(selectedWrestler);
      setSelectedWrestler("");
      setSearchQuery("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSurpriseConfirm = async (name: string) => {
    setIsSubmitting(true);
    try {
      onAddSurprise(name);
      await onConfirmEntry(name);
      setSelectedWrestler("");
      setSearchQuery("");
    } finally {
      setIsSubmitting(false);
      setShowSurpriseModal(false);
    }
  };

  const handleWrestlerSelect = (wrestler: string) => {
    setSelectedWrestler(wrestler);
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
            placeholder="Type to search wrestlers..."
            className="pl-10 min-h-[48px]"
            disabled={disabled || isSubmitting}
          />
        </div>

        {/* Wrestler list - only show when searching */}
        {searchQuery.trim() && (
          <ScrollArea className="h-48 border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredEntrants.length > 0 ? (
                <>
                  {filteredEntrants.map((wrestler) => (
                    <button
                      key={wrestler}
                      onClick={() => handleWrestlerSelect(wrestler)}
                      disabled={disabled || isSubmitting}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-md transition-colors min-h-[44px]",
                        selectedWrestler === wrestler
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent",
                        isUnconfirmedEntrant(wrestler) && "italic opacity-80"
                      )}
                    >
                      {getEntrantDisplayName(wrestler)}
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No wrestlers match "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Always show Surprise option at bottom when searching */}
              <button
                onClick={() => handleWrestlerSelect("Surprise/Other Entrant")}
                disabled={disabled || isSubmitting}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md transition-colors min-h-[44px] border border-dashed border-primary/50 mt-2",
                  selectedWrestler === "Surprise/Other Entrant"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} />
                  Surprise/Other Entrant
                </span>
              </button>
            </div>
          </ScrollArea>
        )}

        {/* Prompt to search when empty */}
        {!searchQuery.trim() && (
          <div className="border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Start typing to search for a wrestler
            </p>
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

      {/* Surprise Entrant Name Modal */}
      <AddSurpriseEntrantModal
        open={showSurpriseModal}
        onOpenChange={setShowSurpriseModal}
        existingEntrants={entrants}
        onAdd={handleSurpriseConfirm}
      />
    </div>
  );
}