import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventAdmin } from "@/hooks/useEventAdmin";

interface CreateEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateEventModal({ onClose, onCreated }: CreateEventModalProps) {
  const { createEvent } = useEventAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    type: "standard_ple" as "rumble" | "mania" | "standard_ple",
    venue: "",
    location: "",
  });

  const generateId = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      id: prev.id || generateId(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) return;

    setIsSubmitting(true);
    const success = await createEvent({
      id: formData.id,
      title: formData.title,
      type: formData.type,
      venue: formData.venue || null,
      location: formData.location || null,
      status: "draft",
      nights: [],
      scoring: formData.type === "rumble" 
        ? { UNDERCARD_WINNER: 10, PROP_BET: 5, RUMBLE_WINNER_PICK: 25, ELIMINATION: 5 }
        : { UNDERCARD_WINNER: 25, PROP_BET: 10 },
      is_active: false,
    });

    setIsSubmitting(false);
    if (success) {
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Create New Event</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="e.g., WrestleMania 41"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">Event ID</Label>
            <Input
              id="id"
              placeholder="e.g., mania_41"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier used in URLs and database
            </p>
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
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
            <p className="text-xs text-muted-foreground">
              Rumble type enables entry tracking and elimination mechanics
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="Stadium name"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.id || !formData.title}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
