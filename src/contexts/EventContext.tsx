import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  getEventById, 
  getActiveEvent, 
  EVENT_REGISTRY,
  type EventConfig,
  type MatchConfig,
  type PropConfig,
  type RumblePropConfig,
  type ScoringConfig,
  type CardConfig,
} from "@/lib/events";

interface EventContextValue {
  eventConfig: EventConfig | null;
  eventId: string;
  isRumble: boolean;
  isMultiNight: boolean;
  matches: MatchConfig[];
  cardConfig: CardConfig[];
  chaosProps: readonly PropConfig[];
  rumbleProps: readonly RumblePropConfig[];
  scoring: ScoringConfig;
  isLoading: boolean;
  // Convenience exports matching constants.ts
  UNDERCARD_MATCHES: MatchConfig[];
  CARD_CONFIG: CardConfig[];
  CHAOS_PROPS: readonly PropConfig[];
  RUMBLE_PROPS: readonly RumblePropConfig[];
  SCORING: ScoringConfig;
  FINAL_FOUR_SLOTS: number;
}

const defaultScoring: ScoringConfig = {
  UNDERCARD_WINNER: 10,
  PROP_BET: 5,
  RUMBLE_WINNER_PICK: 25,
  RUMBLE_WINNER_NUMBER: 50,
  ELIMINATION: 5,
  IRON_MAN: 15,
  FINAL_FOUR: 15,
  JOBBER_PENALTY: -5,
  FIRST_ELIMINATION: 10,
  MOST_ELIMINATIONS: 10,
  LONGEST_TIME: 10,
  FINAL_FOUR_PICK: 15,
  ENTRANT_GUESS: 20,
  NO_SHOW_PROP: 10,
};

const EventContext = createContext<EventContextValue | null>(null);

interface EventProviderProps {
  children: ReactNode;
  // Optional: pass eventId directly instead of fetching from party
  eventId?: string;
  // Optional: pass party code directly (for nested routes)
  partyCode?: string;
}

export function EventProvider({ children, eventId: propEventId, partyCode: propCode }: EventProviderProps) {
  const params = useParams<{ code: string }>();
  const code = propCode || params.code;
  
  const [fetchedEventId, setFetchedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!propEventId);

  // Fetch event_id from party if not provided
  useEffect(() => {
    if (propEventId) {
      setFetchedEventId(propEventId);
      setIsLoading(false);
      return;
    }

    if (!code) {
      // No party code - use global active event
      setFetchedEventId(getActiveEvent().id);
      setIsLoading(false);
      return;
    }

    const fetchEventId = async () => {
      try {
        const { data, error } = await supabase
          .from("parties_public")
          .select("event_id")
          .eq("code", code)
          .maybeSingle();

        if (error) {
          console.error("Error fetching party event_id:", error);
          setFetchedEventId(getActiveEvent().id);
        } else if (data?.event_id) {
          setFetchedEventId(data.event_id);
        } else {
          // Fallback to active event
          setFetchedEventId(getActiveEvent().id);
        }
      } catch (err) {
        console.error("Error in fetchEventId:", err);
        setFetchedEventId(getActiveEvent().id);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventId();
  }, [code, propEventId]);

  // Resolve event config from registry
  const eventId = propEventId || fetchedEventId || getActiveEvent().id;
  const eventConfig = getEventById(eventId) || getActiveEvent();

  // Memoize the context value
  const value = useMemo<EventContextValue>(() => {
    const isRumble = eventConfig.type === "rumble";
    const isMultiNight = eventConfig.nights.length > 1;
    
    // Get Rumble-specific config or empty arrays
    const chaosProps = eventConfig.chaosProps || [];
    const rumbleProps = eventConfig.rumbleProps || [];
    const finalFourSlots = eventConfig.finalFourSlots || 4;

    return {
      eventConfig,
      eventId,
      isRumble,
      isMultiNight,
      matches: eventConfig.matches,
      cardConfig: eventConfig.cardConfig,
      chaosProps,
      rumbleProps,
      scoring: eventConfig.scoring,
      isLoading,
      // Legacy aliases for easier migration
      UNDERCARD_MATCHES: eventConfig.matches,
      CARD_CONFIG: eventConfig.cardConfig,
      CHAOS_PROPS: chaosProps,
      RUMBLE_PROPS: rumbleProps,
      SCORING: eventConfig.scoring,
      FINAL_FOUR_SLOTS: finalFourSlots,
    };
  }, [eventConfig, eventId, isLoading]);

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

/**
 * Hook to access event configuration within a party/event context.
 * Must be used within an EventProvider.
 */
export function useEventConfig(): EventContextValue {
  const context = useContext(EventContext);
  
  if (!context) {
    // Fallback for components not wrapped in EventProvider
    // This maintains backward compatibility
    const activeEvent = getActiveEvent();
    const isRumble = activeEvent.type === "rumble";
    
    return {
      eventConfig: activeEvent,
      eventId: activeEvent.id,
      isRumble,
      isMultiNight: activeEvent.nights.length > 1,
      matches: activeEvent.matches,
      cardConfig: activeEvent.cardConfig,
      chaosProps: activeEvent.chaosProps || [],
      rumbleProps: activeEvent.rumbleProps || [],
      scoring: activeEvent.scoring,
      isLoading: false,
      UNDERCARD_MATCHES: activeEvent.matches,
      CARD_CONFIG: activeEvent.cardConfig,
      CHAOS_PROPS: activeEvent.chaosProps || [],
      RUMBLE_PROPS: activeEvent.rumbleProps || [],
      SCORING: activeEvent.scoring,
      FINAL_FOUR_SLOTS: activeEvent.finalFourSlots || 4,
    };
  }
  
  return context;
}

/**
 * Hook for components that need to know if they're in an event context
 * Returns null if not wrapped in EventProvider
 */
export function useOptionalEventConfig(): EventContextValue | null {
  return useContext(EventContext);
}
