import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogOut, Crown, ChevronRight, Loader2, ChevronDown, User, Sparkles, Zap, History, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OttLogoImage } from "@/components/logo";
import { LegalFooter } from "@/components/LegalFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPlayerSession, setPlayerSession } from "@/lib/session";
import { isEventExpired, EVENT_REGISTRY, getActiveEventId } from "@/lib/events";
import { cn } from "@/lib/utils";

interface PartyMembership {
  player_id: string;
  party_code: string;
  display_name: string;
  points: number;
  status: string | null;
  is_host: boolean;
  is_demo: boolean | null;
  event_id: string;
}

interface SoloPlayerInfo {
  id: string;
  display_name: string;
  created_at: string;
}

interface PastEvent {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  picksCount: number;
  totalScore: number | null;
  type: "solo" | "party";
  partyCode?: string;
  isHost?: boolean;
}

export default function MyParties() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [parties, setParties] = useState<PartyMembership[]>([]);
  const [soloPlayer, setSoloPlayer] = useState<SoloPlayerInfo | null>(null);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchParties(),
        fetchSoloPlayer(),
        fetchPastEvents(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load your data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParties = async () => {
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, party_code, display_name, points")
      .eq("user_id", user!.id);

    if (playerError) throw playerError;

    if (!playerData || playerData.length === 0) {
      setParties([]);
      return;
    }

    const partyCodes = playerData.map(p => p.party_code);
    const { data: partyData, error: partyError } = await supabase
      .from("parties")
      .select("code, status, is_demo, event_id")
      .in("code", partyCodes);

    if (partyError) throw partyError;

    const { data: hostData } = await supabase
      .from("parties")
      .select("code")
      .eq("host_user_id", user!.id);

    const hostCodes = new Set(hostData?.map(p => p.code) || []);

    const combined: PartyMembership[] = playerData.map(player => {
      const partyInfo = partyData?.find(p => p.code === player.party_code);
      return {
        player_id: player.id,
        party_code: player.party_code,
        display_name: player.display_name,
        points: player.points,
        status: partyInfo?.status || "pre_event",
        is_host: hostCodes.has(player.party_code),
        is_demo: partyInfo?.is_demo || false,
        event_id: partyInfo?.event_id || "unknown",
      };
    });

    // Auto-expire parties that are live but the event has ended
    for (const party of combined) {
      if (party.status === "live" && party.is_host && isEventExpired(party.event_id)) {
        try {
          await supabase.rpc("mark_party_ended", { p_party_code: party.party_code });
          party.status = "ended";
        } catch (err) {
          console.error("Failed to auto-expire party:", party.party_code, err);
        }
      }
    }

    // Sync localStorage session if user is host of any party
    const session = getPlayerSession();
    if (session && session.partyCode) {
      const hostedParty = combined.find(p => p.is_host && p.party_code === session.partyCode);
      if (hostedParty && !session.isHost) {
        setPlayerSession({
          ...session,
          isHost: true,
        });
      }
    }

    setParties(combined);
  };

  const fetchSoloPlayer = async () => {
    const { data, error } = await supabase
      .from("solo_players")
      .select("id, display_name, created_at")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (error) throw error;
    if (data) setSoloPlayer(data);
  };

  const fetchPastEvents = async () => {
    const events: PastEvent[] = [];

    // Get solo picks grouped by event
    const { data: soloPlayer } = await supabase
      .from("solo_players")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (soloPlayer) {
      const { data: soloPicks } = await supabase
        .from("solo_picks")
        .select("event_id, match_id")
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
            events.push({
              eventId,
              eventTitle: eventConfig.title,
              eventDate: eventConfig.nights[0]?.date || new Date(),
              picksCount: picks.length,
              totalScore: null,
              type: "solo",
            });
          }
        });
      }
    }

    // Get ended party picks
    const { data: partyPlayers } = await supabase
      .from("players")
      .select("id, party_code, points")
      .eq("user_id", user!.id);

    if (partyPlayers && partyPlayers.length > 0) {
      const partyCodes = partyPlayers.map(p => p.party_code);
      
      // Get ended parties
      const { data: endedParties } = await supabase
        .from("parties")
        .select("code, event_id, host_user_id")
        .in("code", partyCodes)
        .eq("status", "ended");

      if (endedParties) {
        for (const party of endedParties) {
          const player = partyPlayers.find(p => p.party_code === party.code);
          const eventConfig = EVENT_REGISTRY[party.event_id];
          
          // Avoid duplicates if same event already exists from solo
          const existingSolo = events.find(e => e.eventId === party.event_id && e.type === "solo");
          
          if (eventConfig && player) {
            events.push({
              eventId: party.event_id,
              eventTitle: eventConfig.title,
              eventDate: eventConfig.nights[0]?.date || new Date(),
              picksCount: 0, // We could fetch this but it's not critical
              totalScore: player.points,
              type: "party",
              partyCode: party.code,
              isHost: party.host_user_id === user!.id,
            });
          }
        }
      }
    }

    // Sort by date descending
    events.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
    setPastEvents(events);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handlePartyClick = (party: PartyMembership) => {
    if (party.is_host) {
      navigate(`/host/setup/${party.party_code}`);
    } else {
      navigate(`/player/dashboard/${party.party_code}`);
    }
  };

  // Filter parties into active (pre_event, live) and ended
  const activeParties = parties.filter(p => p.status !== "ended");
  const activeHostedParties = activeParties.filter(p => p.is_host);
  const activeJoinedParties = activeParties.filter(p => !p.is_host);
  
  const hasActiveContent = soloPlayer || activeParties.length > 0;
  const hasPastContent = pastEvents.length > 0;
  const hasNoAccess = !hasActiveContent && !hasPastContent;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string | null, isDemo: boolean | null) => {
    const badges = [];
    
    if (isDemo) {
      badges.push(
        <Badge key="demo" variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
          Demo
        </Badge>
      );
    }
    
    switch (status) {
      case "live":
        badges.push(<Badge key="status" className="bg-primary/20 text-primary border-primary/30 text-xs">Live</Badge>);
        break;
      default:
        badges.push(<Badge key="status" variant="outline" className="text-xs">Pre-Event</Badge>);
    }
    
    return <div className="flex items-center gap-1.5">{badges}</div>;
  };

  const PartyCard = ({ party }: { party: PartyMembership }) => (
    <button
      onClick={() => handlePartyClick(party)}
      className="w-full bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {party.is_host ? (
              <Crown className="h-5 w-5 text-primary" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">{party.party_code}</span>
              {party.is_host && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Host</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {party.display_name} - {party.points} pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(party.status, party.is_demo)}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  );

  const PastEventCard = ({ event }: { event: PastEvent }) => {
    const activeEventId = getActiveEventId();
    const isCurrent = event.eventId === activeEventId;

    return (
      <button
        onClick={() => {
          if (event.type === "party" && event.partyCode) {
            if (event.isHost) {
              navigate(`/host/setup/${event.partyCode}`);
            } else {
              navigate(`/player/dashboard/${event.partyCode}`);
            }
          } else {
            navigate("/solo/dashboard");
          }
        }}
        className={cn(
          "w-full bg-card border rounded-xl p-4 hover:bg-muted/50 transition-colors text-left group",
          isCurrent ? "border-primary/30" : "border-border"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{event.eventTitle}</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    event.type === "solo" 
                      ? "bg-muted/50 text-muted-foreground" 
                      : "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  {event.type === "solo" ? "Solo" : "Party"}
                </Badge>
                {isCurrent && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Current</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {event.eventDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {event.totalScore !== null && (
                  <span className="flex items-center gap-1 text-primary">
                    <Trophy className="w-3 h-3" />
                    {event.totalScore} pts
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg space-y-6 pt-8">
        <OttLogoImage size="sm" showTagline />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {hasNoAccess ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">No access yet</h2>
              <p className="text-muted-foreground text-sm">
                Join a party or start solo mode to make your picks
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => navigate("/join")}>
                <Plus className="h-4 w-4 mr-2" />
                Join a Party
              </Button>
              <Button variant="outline" onClick={() => navigate("/solo/setup")}>
                <User className="h-4 w-4 mr-2" />
                Start Solo Mode
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ACTIVE Section */}
            <Collapsible open={activeOpen} onOpenChange={setActiveOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between py-3 px-1 group">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Active</span>
                    <Badge variant="secondary" className="text-xs">
                      {(soloPlayer ? 1 : 0) + activeParties.length}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", !activeOpen && "-rotate-90")} 
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                {/* Solo Mode Subsection */}
                {soloPlayer ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Solo Mode</span>
                    </div>
                    <button
                      onClick={() => navigate("/solo/dashboard")}
                      className="w-full bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{soloPlayer.display_name}</div>
                            <p className="text-sm text-muted-foreground">
                              Track your own picks and results
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/solo/setup")}
                    className="w-full bg-card border border-dashed border-primary/30 rounded-xl p-4 hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-primary">Start Solo Mode</div>
                          <p className="text-sm text-muted-foreground">
                            Make picks on your own
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </div>
                  </button>
                )}

                {/* Party Mode Subsection */}
                {activeParties.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Party Mode</span>
                      <Badge variant="outline" className="text-xs">{activeParties.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {activeHostedParties.map((party) => (
                        <PartyCard key={party.player_id} party={party} />
                      ))}
                      {activeJoinedParties.map((party) => (
                        <PartyCard key={party.player_id} party={party} />
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* PAST Section */}
            {hasPastContent && (
              <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between py-3 px-1 group">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Past</span>
                      <Badge variant="secondary" className="text-xs">{pastEvents.length}</Badge>
                    </div>
                    <ChevronDown 
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", !pastOpen && "-rotate-90")} 
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {pastEvents.map((event, idx) => (
                    <PastEventCard key={`${event.eventId}-${event.type}-${idx}`} event={event} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate("/join")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Join a Party
            </Button>
          </div>
        )}
      </div>

      <LegalFooter />
    </div>
  );
}
