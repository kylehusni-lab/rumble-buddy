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
import { Separator } from "@/components/ui/separator";
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

interface SoloEventPicks {
  eventId: string;
  picksCount: number;
}

// Grouped by event
interface EventGroup {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  solo: SoloEventPicks | null;
  parties: PartyMembership[];
  isPast: boolean;
}

export default function MyParties() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [parties, setParties] = useState<PartyMembership[]>([]);
  const [soloPlayer, setSoloPlayer] = useState<SoloPlayerInfo | null>(null);
  const [soloEventPicks, setSoloEventPicks] = useState<SoloEventPicks[]>([]);
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
        fetchSoloEventPicks(),
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

  const fetchSoloEventPicks = async () => {
    const { data: sp } = await supabase
      .from("solo_players")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!sp) {
      setSoloEventPicks([]);
      return;
    }

    const { data: soloPicks } = await supabase
      .from("solo_picks")
      .select("event_id, match_id")
      .eq("solo_player_id", sp.id);

    if (soloPicks && soloPicks.length > 0) {
      const byEvent = soloPicks.reduce((acc, pick) => {
        const eventId = pick.event_id || 'unknown';
        if (!acc[eventId]) acc[eventId] = [];
        acc[eventId].push(pick);
        return acc;
      }, {} as Record<string, typeof soloPicks>);

      const picks: SoloEventPicks[] = Object.entries(byEvent).map(([eventId, eventPicks]) => ({
        eventId,
        picksCount: eventPicks.length,
      }));

      setSoloEventPicks(picks);
    } else {
      setSoloEventPicks([]);
    }
  };

  // Build event groups from parties and solo picks
  const buildEventGroups = (): { active: EventGroup[]; past: EventGroup[] } => {
    const groupMap = new Map<string, EventGroup>();

    // Add parties to groups
    for (const party of parties) {
      const eventConfig = EVENT_REGISTRY[party.event_id];
      if (!eventConfig) continue;

      const isPast = party.status === "ended";

      if (!groupMap.has(party.event_id)) {
        groupMap.set(party.event_id, {
          eventId: party.event_id,
          eventTitle: eventConfig.title,
          eventDate: eventConfig.nights[0]?.date || new Date(),
          solo: null,
          parties: [],
          isPast,
        });
      }

      const group = groupMap.get(party.event_id)!;
      group.parties.push(party);
      // If any party is not ended, the group is active
      if (!isPast) group.isPast = false;
    }

    // Add solo picks to groups
    for (const soloPick of soloEventPicks) {
      const eventConfig = EVENT_REGISTRY[soloPick.eventId];
      if (!eventConfig) continue;

      const isPastEvent = isEventExpired(soloPick.eventId);

      if (!groupMap.has(soloPick.eventId)) {
        groupMap.set(soloPick.eventId, {
          eventId: soloPick.eventId,
          eventTitle: eventConfig.title,
          eventDate: eventConfig.nights[0]?.date || new Date(),
          solo: soloPick,
          parties: [],
          isPast: isPastEvent,
        });
      } else {
        const group = groupMap.get(soloPick.eventId)!;
        group.solo = soloPick;
        // Solo doesn't override isPast if parties are still active
      }
    }

    // Convert to array and sort by date
    const allGroups = Array.from(groupMap.values());
    allGroups.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

    const active = allGroups.filter(g => !g.isPast);
    const past = allGroups.filter(g => g.isPast);

    return { active, past };
  };

  const { active: activeEventGroups, past: pastEventGroups } = buildEventGroups();

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

  // Content checks
  const hasActiveContent = activeEventGroups.length > 0 || soloPlayer;
  const hasPastContent = pastEventGroups.length > 0;
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

  const PartyCard = ({ party, compact }: { party: PartyMembership; compact?: boolean }) => (
    <button
      onClick={() => handlePartyClick(party)}
      className={cn(
        "w-full bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left group",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}>
            {party.is_host ? (
              <Crown className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <Users className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm">{party.party_code}</span>
              {party.is_host && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Host</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {party.display_name} - {party.points} pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(party.status, party.is_demo)}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  );

  const EventGroupCard = ({ group, isPast }: { group: EventGroup; isPast: boolean }) => {
    const activeEventId = getActiveEventId();
    const isCurrent = group.eventId === activeEventId;
    const hasParties = group.parties.length > 0;
    const hasSolo = !!group.solo;

    return (
      <div className={cn(
        "bg-card border rounded-xl overflow-hidden",
        isCurrent && !isPast ? "border-primary/30" : "border-border"
      )}>
        {/* Event Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isPast ? "bg-muted" : "bg-primary/10"
              )}>
                <Calendar className={cn(
                  "h-5 w-5",
                  isPast ? "text-muted-foreground" : "text-primary"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{group.eventTitle}</span>
                  {isCurrent && !isPast && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Upcoming</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {group.eventDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modes within event */}
        <div className="p-4 space-y-4">
          {/* Solo Mode Section */}
          {hasSolo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Solo Mode</span>
              </div>
              <button
                onClick={() => navigate("/solo/dashboard")}
                className="w-full bg-muted/30 border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{soloPlayer?.display_name || "Solo"}</span>
                        <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground">
                          {group.solo!.picksCount} picks
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">View your predictions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            </div>
          )}

          {/* Separator between sections */}
          {hasSolo && hasParties && (
            <Separator className="my-2" />
          )}

          {/* Parties Section */}
          {hasParties && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Parties
                </span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {group.parties.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {group.parties.map((party) => (
                  <PartyCard key={party.player_id} party={party} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Check if current event has no solo picks yet
  const activeEventId = getActiveEventId();
  const currentEventHasSolo = soloEventPicks.some(p => p.eventId === activeEventId);
  const showStartSoloCTA = soloPlayer && !currentEventHasSolo && !activeEventGroups.some(g => g.eventId === activeEventId && g.solo);

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
                      {activeEventGroups.length + (soloPlayer && !activeEventGroups.some(g => g.solo) ? 1 : 0)}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", !activeOpen && "-rotate-90")} 
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                {/* Show event groups */}
                {activeEventGroups.map((group) => (
                  <EventGroupCard key={group.eventId} group={group} isPast={false} />
                ))}

                {/* Start Solo CTA for current event if user has solo account but no picks */}
                {soloPlayer && !activeEventGroups.some(g => g.solo) && (
                  <button
                    onClick={() => navigate("/solo/dashboard")}
                    className="w-full bg-card border border-dashed border-primary/30 rounded-xl p-4 hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{soloPlayer.display_name}</div>
                          <p className="text-sm text-muted-foreground">
                            Make your picks for {EVENT_REGISTRY[activeEventId]?.title || 'the upcoming event'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </div>
                  </button>
                )}

                {/* No solo account yet */}
                {!soloPlayer && (
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
                      <Badge variant="secondary" className="text-xs">{pastEventGroups.length}</Badge>
                    </div>
                    <ChevronDown 
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", !pastOpen && "-rotate-90")} 
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3">
                  {pastEventGroups.map((group) => (
                    <EventGroupCard key={group.eventId} group={group} isPast={true} />
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
