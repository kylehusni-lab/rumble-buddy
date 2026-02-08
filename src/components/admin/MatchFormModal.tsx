import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventAdmin, type EventWithRelations, type DbEventMatch } from "@/hooks/useEventAdmin";

interface MatchFormModalProps {
  event: EventWithRelations;
  match: DbEventMatch | null;
  defaultNight: string | null;
  onClose: () => void;
}

const MATCH_TYPES = [
  { value: "singles", label: "Singles", minOptions: 2, maxOptions: 2 },
  { value: "tag", label: "Tag Team", minOptions: 2, maxOptions: 4 },
  { value: "triple_threat", label: "Triple Threat", minOptions: 3, maxOptions: 3 },
  { value: "fatal_four", label: "Fatal Four Way", minOptions: 4, maxOptions: 4 },
  { value: "ladder", label: "Ladder Match", minOptions: 2, maxOptions: 8 },
  { value: "rumble", label: "Royal Rumble", minOptions: 0, maxOptions: 0 },
  { value: "battle_royal", label: "Battle Royal", minOptions: 4, maxOptions: 30 },
  { value: "other", label: "Other", minOptions: 2, maxOptions: 10 },
];

export function MatchFormModal({ event, match, defaultNight, onClose }: MatchFormModalProps) {
  const { createMatch, updateMatch } = useEventAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    match_id: "",
    title: "",
    match_type: "singles",
    options: ["", ""],
    night: defaultNight || "",
    is_active: true,
  });

  useEffect(() => {
    if (match) {
      setFormData({
        match_id: match.match_id,
        title: match.title,
        match_type: match.match_type,
        options: match.options?.length > 0 ? match.options : ["", ""],
        night: match.night || "",
        is_active: match.is_active,
      });
    }
  }, [match]);

  const generateMatchId = (title: string, eventId: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return `${eventId}_${base}`;
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      match_id: prev.match_id || generateMatchId(title, event.id),
    }));
  };

  const handleTypeChange = (type: string) => {
    const config = MATCH_TYPES.find(t => t.value === type);
    let newOptions = [...formData.options];
    
    if (config && type !== "rumble") {
      // Adjust options array to match type requirements
      while (newOptions.length < config.minOptions) {
        newOptions.push("");
      }
      if (config.maxOptions > 0 && newOptions.length > config.maxOptions) {
        newOptions = newOptions.slice(0, config.maxOptions);
      }
    }

    setFormData(prev => ({
      ...prev,
      match_type: type,
      options: type === "rumble" ? [] : newOptions,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nextSortOrder = match
      ? match.sort_order
      : (event.event_matches?.filter(m => m.night === (formData.night || null)).length || 0);

    const payload = {
      event_id: event.id,
      match_id: formData.match_id,
      title: formData.title,
      match_type: formData.match_type,
      options: formData.options.filter(o => o.trim()),
      night: formData.night || null,
      sort_order: nextSortOrder,
      is_active: formData.is_active,
    };

    let success = false;
    if (match) {
      success = await updateMatch(match.id, payload);
    } else {
      success = await createMatch(payload);
    }

    setIsSubmitting(false);
    if (success) onClose();
  };

  const matchTypeConfig = MATCH_TYPES.find(t => t.value === formData.match_type);
  const showOptions = formData.match_type !== "rumble";
  const canAddOption = matchTypeConfig && formData.options.length < matchTypeConfig.maxOptions;
  const canRemoveOption = matchTypeConfig && formData.options.length > matchTypeConfig.minOptions;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">
            {match ? "Edit Match" : "Add Match"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Match Title</Label>
            <Input
              id="title"
              placeholder="e.g., WWE Championship Match"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match_id">Match ID</Label>
            <Input
              id="match_id"
              placeholder="e.g., mania_41_wwe_title"
              value={formData.match_id}
              onChange={(e) => setFormData(prev => ({ ...prev, match_id: e.target.value }))}
              required
              className="font-mono text-sm"
              disabled={!!match}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Match Type</Label>
              <Select
                value={formData.match_type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {event.nights?.length > 0 && (
              <div className="space-y-2">
                <Label>Night</Label>
                <Select
                  value={formData.night}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, night: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select night" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.nights.map(night => (
                      <SelectItem key={night.id} value={night.id}>
                        {night.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label>Participants / Options</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    {canRemoveOption && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {canAddOption && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_active" className="font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">Include in picks</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.match_id || !formData.title}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : match ? (
                "Update Match"
              ) : (
                "Add Match"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
