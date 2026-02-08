import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventAdmin, type EventWithRelations, type DbEventProp } from "@/hooks/useEventAdmin";

interface PropFormModalProps {
  event: EventWithRelations;
  prop: DbEventProp | null;
  defaultCategory: "chaos" | "rumble" | "general";
  onClose: () => void;
}

export function PropFormModal({ event, prop, defaultCategory, onClose }: PropFormModalProps) {
  const { createProp, updateProp } = useEventAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    prop_id: "",
    title: "",
    question: "",
    category: defaultCategory,
    prop_type: "yesno" as "yesno" | "wrestler" | "custom",
    gender: "" as "" | "mens" | "womens",
    night: "",
    is_active: true,
  });

  useEffect(() => {
    if (prop) {
      setFormData({
        prop_id: prop.prop_id,
        title: prop.title,
        question: prop.question,
        category: prop.category,
        prop_type: prop.prop_type,
        gender: prop.gender || "",
        night: prop.night || "",
        is_active: prop.is_active,
      });
    }
  }, [prop]);

  const generatePropId = (title: string, eventId: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return `${eventId}_prop_${base}`;
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      prop_id: prev.prop_id || generatePropId(title, event.id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nextSortOrder = prop
      ? prop.sort_order
      : (event.event_props?.filter(p => p.category === formData.category).length || 0);

    const payload = {
      event_id: event.id,
      prop_id: formData.prop_id,
      title: formData.title,
      question: formData.question,
      category: formData.category,
      prop_type: formData.prop_type,
      options: null,
      gender: formData.gender || null,
      night: formData.night || null,
      sort_order: nextSortOrder,
      is_active: formData.is_active,
    };

    let success = false;
    if (prop) {
      success = await updateProp(prop.id, payload);
    } else {
      success = await createProp(payload);
    }

    setIsSubmitting(false);
    if (success) onClose();
  };

  const showRumbleOptions = event.type === "rumble";

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">
            {prop ? "Edit Prop" : "Add Prop"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Short Title</Label>
            <Input
              id="title"
              placeholder="e.g., The Floor is Lava"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Full Question</Label>
            <Textarea
              id="question"
              placeholder="e.g., A wrestler uses a stunt to avoid touching the floor?"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              required
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prop_id">Prop ID</Label>
            <Input
              id="prop_id"
              placeholder="e.g., rumble_2026_floor_is_lava"
              value={formData.prop_id}
              onChange={(e) => setFormData(prev => ({ ...prev, prop_id: e.target.value }))}
              required
              className="font-mono text-sm"
              disabled={!!prop}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showRumbleOptions && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chaos">Chaos</SelectItem>
                    <SelectItem value="rumble">Rumble</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Answer Type</Label>
              <Select
                value={formData.prop_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, prop_type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yesno">Yes / No</SelectItem>
                  <SelectItem value="wrestler">Wrestler Pick</SelectItem>
                  <SelectItem value="custom">Custom Options</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showRumbleOptions && (
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Both" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Both</SelectItem>
                    <SelectItem value="mens">Men's</SelectItem>
                    <SelectItem value="womens">Women's</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {event.nights?.length > 0 && (
              <div className="space-y-2">
                <Label>Night</Label>
                <Select
                  value={formData.night}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, night: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All nights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All nights</SelectItem>
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
            <Button type="submit" disabled={isSubmitting || !formData.prop_id || !formData.title}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : prop ? (
                "Update Prop"
              ) : (
                "Add Prop"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
