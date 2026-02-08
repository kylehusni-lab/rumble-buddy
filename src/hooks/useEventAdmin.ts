import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DbEvent {
  id: string;
  title: string;
  type: "rumble" | "mania" | "standard_ple";
  venue: string | null;
  location: string | null;
  status: "draft" | "active" | "completed";
  nights: { id: string; label: string; date: string }[];
  scoring: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbEventMatch {
  id: string;
  event_id: string;
  match_id: string;
  title: string;
  match_type: string;
  options: string[];
  night: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DbEventProp {
  id: string;
  event_id: string;
  prop_id: string;
  title: string;
  question: string;
  category: "chaos" | "rumble" | "general";
  prop_type: "yesno" | "wrestler" | "custom";
  options: string[] | null;
  gender: "mens" | "womens" | null;
  night: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface EventWithRelations extends DbEvent {
  event_matches: DbEventMatch[];
  event_props: DbEventProp[];
}

export function useEventAdmin() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*, event_matches(*), event_props(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform jsonb fields
      const transformed = (data || []).map((e: any) => ({
        ...e,
        nights: Array.isArray(e.nights) ? e.nights : [],
        scoring: typeof e.scoring === "object" ? e.scoring : {},
        event_matches: (e.event_matches || []).map((m: any) => ({
          ...m,
          options: Array.isArray(m.options) ? m.options : [],
        })),
        event_props: (e.event_props || []).map((p: any) => ({
          ...p,
          options: Array.isArray(p.options) ? p.options : null,
        })),
      }));
      
      setEvents(transformed);
    } catch (err) {
      console.error("Fetch events error:", err);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = async (event: Omit<DbEvent, "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase.from("events").insert({
        id: event.id,
        title: event.title,
        type: event.type,
        venue: event.venue,
        location: event.location,
        status: event.status,
        nights: event.nights,
        scoring: event.scoring,
        is_active: event.is_active,
      });

      if (error) throw error;
      toast.success("Event created");
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Create event error:", err);
      toast.error(err.message || "Failed to create event");
      return false;
    }
  };

  const updateEvent = async (id: string, updates: Partial<DbEvent>) => {
    try {
      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Event updated");
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Update event error:", err);
      toast.error(err.message || "Failed to update event");
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      toast.success("Event deleted");
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Delete event error:", err);
      toast.error(err.message || "Failed to delete event");
      return false;
    }
  };

  // Match CRUD
  const createMatch = async (match: Omit<DbEventMatch, "id">) => {
    try {
      const { error } = await supabase.from("event_matches").insert({
        event_id: match.event_id,
        match_id: match.match_id,
        title: match.title,
        match_type: match.match_type,
        options: match.options,
        night: match.night,
        sort_order: match.sort_order,
        is_active: match.is_active,
      });

      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Create match error:", err);
      toast.error(err.message || "Failed to create match");
      return false;
    }
  };

  const updateMatch = async (id: string, updates: Partial<DbEventMatch>) => {
    try {
      const { error } = await supabase
        .from("event_matches")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Update match error:", err);
      toast.error(err.message || "Failed to update match");
      return false;
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      const { error } = await supabase.from("event_matches").delete().eq("id", id);
      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Delete match error:", err);
      toast.error(err.message || "Failed to delete match");
      return false;
    }
  };

  // Prop CRUD
  const createProp = async (prop: Omit<DbEventProp, "id">) => {
    try {
      const { error } = await supabase.from("event_props").insert({
        event_id: prop.event_id,
        prop_id: prop.prop_id,
        title: prop.title,
        question: prop.question,
        category: prop.category,
        prop_type: prop.prop_type,
        options: prop.options,
        gender: prop.gender,
        night: prop.night,
        sort_order: prop.sort_order,
        is_active: prop.is_active,
      });

      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Create prop error:", err);
      toast.error(err.message || "Failed to create prop");
      return false;
    }
  };

  const updateProp = async (id: string, updates: Partial<DbEventProp>) => {
    try {
      const { error } = await supabase
        .from("event_props")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Update prop error:", err);
      toast.error(err.message || "Failed to update prop");
      return false;
    }
  };

  const deleteProp = async (id: string) => {
    try {
      const { error } = await supabase.from("event_props").delete().eq("id", id);
      if (error) throw error;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error("Delete prop error:", err);
      toast.error(err.message || "Failed to delete prop");
      return false;
    }
  };

  return {
    events,
    isLoading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createMatch,
    updateMatch,
    deleteMatch,
    createProp,
    updateProp,
    deleteProp,
  };
}
