import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Settings, Calendar, Trophy, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEventAdmin, type EventWithRelations } from "@/hooks/useEventAdmin";
import { EventConfigModal } from "./EventConfigModal";
import { CreateEventModal } from "./CreateEventModal";

export function EventsTab() {
  const { events, isLoading, fetchEvents } = useEventAdmin();
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-ott-accent text-background">Current</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-success">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "rumble":
        return <Badge variant="outline" className="border-warning text-warning">Rumble</Badge>;
      case "mania":
        return <Badge variant="outline" className="border-primary text-primary">WrestleMania</Badge>;
      default:
        return <Badge variant="outline">PLE</Badge>;
    }
  };

  const formatNights = (nights: { date: string; label: string }[]) => {
    if (!nights || nights.length === 0) return "No dates set";
    if (nights.length === 1) {
      return format(new Date(nights[0].date), "MMM d, yyyy");
    }
    const first = new Date(nights[0].date);
    const last = new Date(nights[nights.length - 1].date);
    return `${format(first, "MMM d")}-${format(last, "d, yyyy")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Event Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage matches, props, and settings for each event
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No events configured</p>
          <p className="text-sm mb-4">Create your first event to get started</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-ott-surface border border-border rounded-lg p-4 hover:border-ott-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                    {getStatusBadge(event.status, event.is_active)}
                    {getEventTypeBadge(event.type)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatNights(event.nights)}
                    </span>
                    <span>
                      {event.event_matches?.length || 0} matches
                    </span>
                    <span>
                      {event.event_props?.length || 0} props
                    </span>
                    {event.nights?.length > 1 && (
                      <span>{event.nights.length} nights</span>
                    )}
                  </div>

                  {event.venue && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.venue}{event.location ? `, ${event.location}` : ""}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(event)}
                  className="shrink-0"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedEvent && (
        <EventConfigModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
