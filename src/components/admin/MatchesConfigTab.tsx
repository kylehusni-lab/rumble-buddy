import { useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useEventAdmin, type EventWithRelations, type DbEventMatch } from "@/hooks/useEventAdmin";
import { MatchFormModal } from "./MatchFormModal";
import { GenericDeleteConfirmModal } from "./GenericDeleteConfirmModal";

interface MatchesConfigTabProps {
  event: EventWithRelations;
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  singles: "Singles",
  tag: "Tag Team",
  triple_threat: "Triple Threat",
  fatal_four: "Fatal Four Way",
  ladder: "Ladder",
  rumble: "Royal Rumble",
  battle_royal: "Battle Royal",
  other: "Other",
};

export function MatchesConfigTab({ event }: MatchesConfigTabProps) {
  const { updateMatch, deleteMatch } = useEventAdmin();
  const [editingMatch, setEditingMatch] = useState<DbEventMatch | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<DbEventMatch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNight, setSelectedNight] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group matches by night
  const matchesByNight = event.event_matches?.reduce((acc, match) => {
    const night = match.night || "no_night";
    if (!acc[night]) acc[night] = [];
    acc[night].push(match);
    return acc;
  }, {} as Record<string, DbEventMatch[]>) || {};

  // Sort matches within each night by sort_order
  Object.keys(matchesByNight).forEach(night => {
    matchesByNight[night].sort((a, b) => a.sort_order - b.sort_order);
  });

  const handleToggleActive = async (match: DbEventMatch) => {
    await updateMatch(match.id, { is_active: !match.is_active });
  };

  const handleDelete = async () => {
    if (!deletingMatch) return;
    setIsDeleting(true);
    await deleteMatch(deletingMatch.id);
    setIsDeleting(false);
    setDeletingMatch(null);
  };

  const renderMatchList = (matches: DbEventMatch[], nightId: string | null) => (
    <div className="space-y-2">
      {matches.map((match, index) => (
        <div
          key={match.id}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            match.is_active 
              ? "bg-ott-surface border-border" 
              : "bg-muted/30 border-border/50 opacity-60"
          }`}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{match.title}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {MATCH_TYPE_LABELS[match.match_type] || match.match_type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {match.options?.join(" vs ") || "No participants set"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={match.is_active}
              onCheckedChange={() => handleToggleActive(match)}
              aria-label="Toggle active"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingMatch(match)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingMatch(match)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => {
          setSelectedNight(nightId);
          setShowAddModal(true);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Match
      </Button>
    </div>
  );

  const nights = event.nights || [];
  const hasNights = nights.length > 0;

  return (
    <div className="space-y-6">
      {hasNights ? (
        // Multi-night layout
        nights.map(night => (
          <div key={night.id} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {night.label}
            </h3>
            {renderMatchList(matchesByNight[night.id] || [], night.id)}
          </div>
        ))
      ) : (
        // Single event layout
        renderMatchList(matchesByNight["no_night"] || [], null)
      )}

      {/* Modals */}
      {(showAddModal || editingMatch) && (
        <MatchFormModal
          event={event}
          match={editingMatch}
          defaultNight={selectedNight}
          onClose={() => {
            setShowAddModal(false);
            setEditingMatch(null);
            setSelectedNight(null);
          }}
        />
      )}

      {deletingMatch && (
        <GenericDeleteConfirmModal
          title="Delete Match"
          message={`Are you sure you want to delete "${deletingMatch.title}"?`}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingMatch(null)}
        />
      )}
    </div>
  );
}
