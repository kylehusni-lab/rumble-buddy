import { useState } from "react";
import { X, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEventAdmin } from "@/hooks/useEventAdmin";

interface CreateEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  standard_ple: "Standard single-night premium live event",
  mania: "Multi-night event like WrestleMania",
  rumble: "Enables entry tracking and elimination mechanics",
};

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

  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();

  const isTwoNight = formData.type === "mania";

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

  const buildNights = () => {
    if (isTwoNight) {
      const nights = [];
      if (date1) nights.push({ id: "night_1", label: "Night 1 - Saturday", date: date1.toISOString() });
      if (date2) nights.push({ id: "night_2", label: "Night 2 - Sunday", date: date2.toISOString() });
      return nights;
    }
    if (date1) {
      return [{ id: "night_1", label: "Night 1", date: date1.toISOString() }];
    }
    return [];
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
      nights: buildNights(),
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
      <div className="bg-background border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              placeholder="e.g., WrestleMania 42"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">Event ID</Label>
            <Input
              id="id"
              placeholder="e.g., mania_42"
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
              onValueChange={(v) => {
                setFormData(prev => ({ ...prev, type: v as any }));
                if (v !== "mania") setDate2(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard_ple">1 Night PLE</SelectItem>
                <SelectItem value="mania">2 Night PLE</SelectItem>
                <SelectItem value="rumble">Royal Rumble</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TYPE_DESCRIPTIONS[formData.type]}
            </p>
          </div>

          {/* Date picker(s) */}
          <div className={cn("grid gap-3", isTwoNight ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-2">
              <Label>{isTwoNight ? "Night 1" : "Event Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date1 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date1 ? format(date1, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date1}
                    onSelect={setDate1}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isTwoNight && (
              <div className="space-y-2">
                <Label>Night 2</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date2 && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date2 ? format(date2, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date2}
                      onSelect={setDate2}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
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
