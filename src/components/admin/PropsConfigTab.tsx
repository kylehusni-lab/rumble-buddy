import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventAdmin, type EventWithRelations, type DbEventProp } from "@/hooks/useEventAdmin";
import { PropFormModal } from "./PropFormModal";
import { GenericDeleteConfirmModal } from "./GenericDeleteConfirmModal";

interface PropsConfigTabProps {
  event: EventWithRelations;
}

const CATEGORY_LABELS: Record<string, string> = {
  chaos: "Chaos Props",
  rumble: "Rumble Props",
  general: "General Props",
};

export function PropsConfigTab({ event }: PropsConfigTabProps) {
  const { updateProp, deleteProp } = useEventAdmin();
  const [editingProp, setEditingProp] = useState<DbEventProp | null>(null);
  const [deletingProp, setDeletingProp] = useState<DbEventProp | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [isDeleting, setIsDeleting] = useState(false);

  // Group props by category
  const propsByCategory = event.event_props?.reduce((acc, prop) => {
    const cat = prop.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prop);
    return acc;
  }, {} as Record<string, DbEventProp[]>) || {};

  // Sort by sort_order within each category
  Object.keys(propsByCategory).forEach(cat => {
    propsByCategory[cat].sort((a, b) => a.sort_order - b.sort_order);
  });

  const handleToggleActive = async (prop: DbEventProp) => {
    await updateProp(prop.id, { is_active: !prop.is_active });
  };

  const handleDelete = async () => {
    if (!deletingProp) return;
    setIsDeleting(true);
    await deleteProp(deletingProp.id);
    setIsDeleting(false);
    setDeletingProp(null);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "yesno":
        return <Badge variant="outline" className="text-xs">Yes/No</Badge>;
      case "wrestler":
        return <Badge variant="outline" className="text-xs border-warning text-warning">Wrestler</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Custom</Badge>;
    }
  };

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return null;
    return (
      <Badge variant="secondary" className="text-xs">
        {gender === "mens" ? "Men's" : "Women's"}
      </Badge>
    );
  };

  const renderPropList = (props: DbEventProp[], category: string) => (
    <div className="space-y-2">
      {props.map((prop) => (
        <div
          key={prop.id}
          className={`p-3 rounded-lg border transition-colors ${
            prop.is_active 
              ? "bg-ott-surface border-border" 
              : "bg-muted/30 border-border/50 opacity-60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{prop.title}</span>
                {getTypeBadge(prop.prop_type)}
                {getGenderBadge(prop.gender)}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {prop.question}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={prop.is_active}
                onCheckedChange={() => handleToggleActive(prop)}
                aria-label="Toggle active"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingProp(prop)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingProp(prop)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => {
          setSelectedCategory(category);
          setShowAddModal(true);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Prop
      </Button>
    </div>
  );

  // Determine which tabs to show based on event type
  const showRumbleTab = event.type === "rumble";
  const categories = showRumbleTab 
    ? ["chaos", "rumble", "general"]
    : ["general"];

  return (
    <div className="space-y-4">
      {showRumbleTab ? (
        <Tabs defaultValue="chaos">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="chaos">Chaos</TabsTrigger>
            <TabsTrigger value="rumble">Rumble</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-4">
              {renderPropList(propsByCategory[cat] || [], cat)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Props
          </h3>
          {renderPropList(propsByCategory["general"] || [], "general")}
        </div>
      )}

      {/* Modals */}
      {(showAddModal || editingProp) && (
        <PropFormModal
          event={event}
          prop={editingProp}
          defaultCategory={selectedCategory as any}
          onClose={() => {
            setShowAddModal(false);
            setEditingProp(null);
          }}
        />
      )}

      {deletingProp && (
        <GenericDeleteConfirmModal
          title="Delete Prop"
          message={`Are you sure you want to delete "${deletingProp.title}"?`}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProp(null)}
        />
      )}
    </div>
  );
}
