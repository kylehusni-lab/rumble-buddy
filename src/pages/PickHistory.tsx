import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Trophy, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EVENT_REGISTRY, getActiveEventId } from "@/lib/events";
import { cn } from "@/lib/utils";

interface EventPicksSummary {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  picksCount: number;
  resultsCount: number;
  totalScore: number | null;
}

export default function PickHistory() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [eventSummaries, setEventSummaries] = useState<EventPicksSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventPicks, setSelectedEventPicks] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
    }
  }, [authLoading, user, navigate]);

  // Fetch pick history for the user
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // First check if user has a solo_player record
        const { data: soloPlayer } = await supabase
          .from("solo_players")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Also check if user has any party player records
        const { data: partyPlayers } = await supabase
          .from("players")
          .select("id")
          .eq("user_id", user.id);

        const summaries: EventPicksSummary[] = [];

        // Get solo picks grouped by event
        if (soloPlayer) {
          const { data: soloPicks } = await supabase
            .from("solo_picks")
            .select("event_id, match_id, prediction")
            .eq("solo_player_id", soloPlayer.id);

          if (soloPicks && soloPicks.length > 0) {
            // Group by event_id
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
                  resultsCount: 0, // We could fetch results too
                  totalScore: null,
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
            // Group by event_id
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
                  eventTitle: `${eventConfig.title} (Party)`,
                  eventDate: eventConfig.nights[0]?.date || new Date(),
                  picksCount: picks.length,
                  resultsCount: picks.filter(p => p.points_awarded !== null).length,
                  totalScore: totalScore > 0 ? totalScore : null,
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
  }, [user]);

  // Fetch picks for selected event
  useEffect(() => {
    if (!selectedEvent || !user) return;

    const fetchEventPicks = async () => {
      try {
        // Check solo picks first
        const { data: soloPlayer } = await supabase
          .from("solo_players")
          .select("id")
          .eq("user_id", user.id)
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

        // Check party picks
        const { data: players } = await supabase
          .from("players")
          .select("id")
          .eq("user_id", user.id);

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
  }, [selectedEvent, user]);

  const activeEventId = getActiveEventId();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => selectedEvent ? setSelectedEvent(null) : navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-bold text-lg">
              {selectedEvent ? EVENT_REGISTRY[selectedEvent]?.title : "Pick History"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedEvent ? "Your picks for this event" : "View your past event picks"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {!selectedEvent ? (
          // Event List View
          <div className="space-y-3">
            {eventSummaries.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="font-semibold text-lg mb-2">No Pick History Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Your picks from past events will appear here.
                </p>
                <Button onClick={() => navigate("/solo/picks")}>
                  Make Your First Picks
                </Button>
              </div>
            ) : (
              eventSummaries.map((summary) => (
                <button
                  key={summary.eventId}
                  onClick={() => setSelectedEvent(summary.eventId)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all hover:border-primary/50",
                    summary.eventId === activeEventId
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{summary.eventTitle}</h3>
                        {summary.eventId === activeEventId && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {summary.eventDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {summary.picksCount} picks
                        </span>
                        {summary.totalScore !== null && (
                          <span className="flex items-center gap-1 text-primary">
                            <Trophy className="w-4 h-4" />
                            {summary.totalScore} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Event Detail View
          <div className="space-y-4">
            {Object.keys(selectedEventPicks).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No picks found for this event.
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  {Object.entries(selectedEventPicks).map(([matchId, prediction]) => {
                    // Format match ID for display
                    const displayName = matchId
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());

                    return (
                      <div
                        key={matchId}
                        className="p-3 bg-card rounded-lg border border-border"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {displayName}
                        </div>
                        <div className="font-medium">{prediction}</div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedEvent(null)}
                >
                  Back to Events
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
