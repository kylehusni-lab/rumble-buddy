import { useState, useEffect } from "react";
import { Calendar, Trophy, ChevronRight, ChevronDown, History, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_REGISTRY, getActiveEventId } from "@/lib/events";
import { cn } from "@/lib/utils";

interface EventPicksSummary {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  picksCount: number;
  totalScore: number | null;
  isParty: boolean;
}

interface PickHistorySectionProps {
  userId: string;
}

export function PickHistorySection({ userId }: PickHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [eventSummaries, setEventSummaries] = useState<EventPicksSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventPicks, setSelectedEventPicks] = useState<Record<string, string>>({});

  // Fetch pick history
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Check for solo_player record
        const { data: soloPlayer } = await supabase
          .from("solo_players")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        // Check for party player records
        const { data: partyPlayers } = await supabase
          .from("players")
          .select("id")
          .eq("user_id", userId);

        const summaries: EventPicksSummary[] = [];

        // Get solo picks grouped by event
        if (soloPlayer) {
          const { data: soloPicks } = await supabase
            .from("solo_picks")
            .select("event_id, match_id, prediction")
            .eq("solo_player_id", soloPlayer.id);

          if (soloPicks && soloPicks.length > 0) {
            const byEvent = soloPicks.reduce((acc, pick) => {
              const eventId = pick.event_id || 'unknown';
              if (!acc[eventId]) acc[eventId] = [];
              acc[eventId].push(pick);
              return acc;
            }, {} as Record<string, typeof soloPicks>);

            Object.entries(byEvent).forEach(([eventId, picks]) => {
              const eventConfig = EVENT_REGISTRY[eventId];
              if (eventConfig) {
                summaries.push({
                  eventId,
                  eventTitle: eventConfig.title,
                  eventDate: eventConfig.nights[0]?.date || new Date(),
                  picksCount: picks.length,
                  totalScore: null,
                  isParty: false,
                });
              }
            });
          }
        }

        // Get party picks grouped by event
        if (partyPlayers && partyPlayers.length > 0) {
          const playerIds = partyPlayers.map(p => p.id);
          
          const { data: partyPicks } = await supabase
            .from("picks")
            .select("event_id, match_id, prediction, points_awarded, player_id")
            .in("player_id", playerIds);

          if (partyPicks && partyPicks.length > 0) {
            const byEvent = partyPicks.reduce((acc, pick) => {
              const eventId = pick.event_id || 'unknown';
              if (!acc[eventId]) acc[eventId] = [];
              acc[eventId].push(pick);
              return acc;
            }, {} as Record<string, typeof partyPicks>);

            Object.entries(byEvent).forEach(([eventId, picks]) => {
              const eventConfig = EVENT_REGISTRY[eventId];
              // Check if we already have this event from solo picks
              const existing = summaries.find(s => s.eventId === eventId);
              
              if (eventConfig && !existing) {
                const totalScore = picks.reduce((sum, p) => sum + (p.points_awarded || 0), 0);
                summaries.push({
                  eventId,
                  eventTitle: eventConfig.title,
                  eventDate: eventConfig.nights[0]?.date || new Date(),
                  picksCount: picks.length,
                  totalScore: totalScore > 0 ? totalScore : null,
                  isParty: true,
                });
              }
            });
          }
        }

        // Sort by date descending
        summaries.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
        setEventSummaries(summaries);
      } catch (err) {
        console.error("Error fetching pick history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  // Fetch picks for selected event
  useEffect(() => {
    if (!selectedEvent) {
      setSelectedEventPicks({});
      return;
    }

    const fetchEventPicks = async () => {
      try {
        const { data: soloPlayer } = await supabase
          .from("solo_players")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (soloPlayer) {
          const { data: picks } = await supabase
            .from("solo_picks")
            .select("match_id, prediction")
            .eq("solo_player_id", soloPlayer.id)
            .eq("event_id", selectedEvent);

          if (picks && picks.length > 0) {
            const picksMap = picks.reduce((acc, p) => {
              acc[p.match_id] = p.prediction;
              return acc;
            }, {} as Record<string, string>);
            setSelectedEventPicks(picksMap);
            return;
          }
        }

        const { data: players } = await supabase
          .from("players")
          .select("id")
          .eq("user_id", userId);

        if (players && players.length > 0) {
          const { data: picks } = await supabase
            .from("picks")
            .select("match_id, prediction")
            .in("player_id", players.map(p => p.id))
            .eq("event_id", selectedEvent);

          if (picks && picks.length > 0) {
            const picksMap = picks.reduce((acc, p) => {
              acc[p.match_id] = p.prediction;
              return acc;
            }, {} as Record<string, string>);
            setSelectedEventPicks(picksMap);
          }
        }
      } catch (err) {
        console.error("Error fetching event picks:", err);
      }
    };

    fetchEventPicks();
  }, [selectedEvent, userId]);

  const activeEventId = getActiveEventId();

  if (isLoading) {
    return (
      <div className="border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-5 w-5 animate-pulse" />
          <span>Loading pick history...</span>
        </div>
      </div>
    );
  }

  if (eventSummaries.length === 0) {
    return null; // Don't show section if no history
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-3 px-1 group">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pick History</span>
            <Badge variant="secondary" className="text-xs">{eventSummaries.length}</Badge>
          </div>
          <ChevronDown 
            className={cn("h-4 w-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} 
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {selectedEvent ? (
          // Detail View
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <button
              onClick={() => setSelectedEvent(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </button>
            <h3 className="font-semibold">{EVENT_REGISTRY[selectedEvent]?.title}</h3>
            
            {Object.keys(selectedEventPicks).length === 0 ? (
              <p className="text-sm text-muted-foreground">No picks found for this event.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(selectedEventPicks).map(([matchId, prediction]) => {
                  const displayName = matchId
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  return (
                    <div
                      key={matchId}
                      className="p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="text-xs text-muted-foreground">
                        {displayName}
                      </div>
                      <div className="text-sm font-medium">{prediction}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Event List View
          eventSummaries.map((summary) => (
            <button
              key={`${summary.eventId}-${summary.isParty}`}
              onClick={() => setSelectedEvent(summary.eventId)}
              className={cn(
                "w-full bg-card border rounded-xl p-4 hover:bg-muted/50 transition-colors text-left group",
                summary.eventId === activeEventId
                  ? "border-primary/30 bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{summary.eventTitle}</span>
                      {summary.isParty && (
                        <Badge variant="outline" className="text-xs">Party</Badge>
                      )}
                      {summary.eventId === activeEventId && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {summary.eventDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{summary.picksCount} picks</span>
                      {summary.totalScore !== null && (
                        <span className="flex items-center gap-1 text-primary">
                          <Trophy className="w-3 h-3" />
                          {summary.totalScore} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
