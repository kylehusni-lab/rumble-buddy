import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventAdmin, type EventWithRelations } from "@/hooks/useEventAdmin";
import { GenericDeleteConfirmModal } from "./GenericDeleteConfirmModal";
import { toast } from "sonner";

interface EventSettingsTabProps {
  event: EventWithRelations;
  onClose: () => void;
}

export function EventSettingsTab({ event, onClose }: EventSettingsTabProps) {
  const { updateEvent, deleteEvent } = useEventAdmin();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: event.title,
    type: event.type,
    venue: event.venue || "",
    location: event.location || "",
    status: event.status,
    is_active: event.is_active,
    nights: event.nights || [],
    scoring: event.scoring || {},
  });

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateEvent(event.id, {
      title: formData.title,
      type: formData.type,
      venue: formData.venue || null,
      location: formData.location || null,
      status: formData.status,
      is_active: formData.is_active,
      nights: formData.nights,
      scoring: formData.scoring,
    });
    setIsSaving(false);
    if (success) {
      toast.success("Settings saved");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteEvent(event.id);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  const addNight = () => {
    const nextNum = formData.nights.length + 1;
    const newNight = {
      id: `night_${nextNum}`,
      label: `Night ${nextNum}`,
      date: new Date().toISOString(),
    };
    setFormData(prev => ({
      ...prev,
      nights: [...prev.nights, newNight],
    }));
  };

  const updateNight = (index: number, field: string, value: string) => {
    const newNights = [...formData.nights];
    newNights[index] = { ...newNights[index], [field]: value };
    setFormData(prev => ({ ...prev, nights: newNights }));
  };

  const removeNight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nights: prev.nights.filter((_, i) => i !== index),
    }));
  };

  const updateScoring = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      scoring: { ...prev.scoring, [key]: numValue },
    }));
  };

  const isRumble = formData.type === "rumble";

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">Event Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard_ple">Standard PLE</SelectItem>
                <SelectItem value="rumble">Royal Rumble</SelectItem>
                <SelectItem value="mania">WrestleMania</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Stadium name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State"
            />
          </div>
        </div>
      </div>

      {/* Nights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nights</h3>
          <Button variant="outline" size="sm" onClick={addNight}>
            <Plus className="w-4 h-4 mr-1" />
            Add Night
          </Button>
        </div>

        {formData.nights.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
            No nights configured. Add a night to set event dates.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.nights.map((night, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Input
                  value={night.label}
                  onChange={(e) => updateNight(index, "label", e.target.value)}
                  placeholder="Night label"
                  className="w-32"
                />
                <Input
                  type="datetime-local"
                  value={night.date ? format(new Date(night.date), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => updateNight(index, "date", new Date(e.target.value).toISOString())}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNight(index)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scoring */}
      <div className="space-y-4">
        <h3 className="font-semibold">Scoring</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Match Winner</Label>
            <Input
              type="number"
              value={formData.scoring.UNDERCARD_WINNER || 0}
              onChange={(e) => updateScoring("UNDERCARD_WINNER", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Prop Bet</Label>
            <Input
              type="number"
              value={formData.scoring.PROP_BET || 0}
              onChange={(e) => updateScoring("PROP_BET", e.target.value)}
            />
          </div>
        </div>

        {isRumble && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rumble Winner Pick</Label>
              <Input
                type="number"
                value={formData.scoring.RUMBLE_WINNER_PICK || 0}
                onChange={(e) => updateScoring("RUMBLE_WINNER_PICK", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Elimination</Label>
              <Input
                type="number"
                value={formData.scoring.ELIMINATION || 0}
                onChange={(e) => updateScoring("ELIMINATION", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Iron Man</Label>
              <Input
                type="number"
                value={formData.scoring.IRON_MAN || 0}
                onChange={(e) => updateScoring("IRON_MAN", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Final Four</Label>
              <Input
                type="number"
                value={formData.scoring.FINAL_FOUR || 0}
                onChange={(e) => updateScoring("FINAL_FOUR", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="font-semibold">Status</h3>
        
        <div className="flex items-center gap-4">
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
            />
            <Label htmlFor="is_active">Set as current active event</Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Event
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <GenericDeleteConfirmModal
          title="Delete Event"
          message={
            <div className="space-y-2">
              <p>Are you sure you want to delete "{event.title}"?</p>
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This will also delete all {event.event_matches?.length || 0} matches and {event.event_props?.length || 0} props.</span>
              </div>
            </div>
          }
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
