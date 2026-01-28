import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { NumberRevealAnimation } from "@/components/NumberRevealAnimation";
import { TvViewNavigator, VIEWS, ViewType } from "@/components/tv/TvViewNavigator";
import { TvHeaderStats } from "@/components/tv/TvHeaderStats";
import { TvActivityTicker, ActivityEvent } from "@/components/tv/TvActivityTicker";
import { TvTabBar } from "@/components/tv/TvTabBar";
import { Logo } from "@/components/Logo";
import { UNDERCARD_MATCHES } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface RumbleNumber {
  number: number;
  wrestler_name: string | null;
  assigned_to_player_id: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
}

interface PlayerWithNumbers {
  playerName: string;
  mensNumbers: number[];
  womensNumbers: number[];
}

interface Pick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface MatchResult {
  match_id: string;
  result: string;
}

export default function TvDisplay() {
  const { code } = useParams<{ code: string }>();
  
  // Responsive scaling hook
  const { mainColSpan, sideColSpan } = useTvScale();

  const [partyStatus, setPartyStatus] = useState<string>("pre_event");
  const [players, setPlayers] = useState<Player[]>([]);
  const [mensNumbers, setMensNumbers] = useState<RumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<RumbleNumber[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  
  const [showNumberReveal, setShowNumberReveal] = useState(false);
  const [revealPlayers, setRevealPlayers] = useState<PlayerWithNumbers[]>([]);
  const [currentViewType, setCurrentViewType] = useState<ViewType>("undercard");
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [currentViewTitle, setCurrentViewTitle] = useState(VIEWS[0].title);
  
  // Activity ticker state
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);
  
  // Auto-rotate state
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to hold current state for use in realtime callbacks (prevents infinite loops)
  const playersRef = useRef<Player[]>([]);
  const mensNumbersRef = useRef<RumbleNumber[]>([]);
  const womensNumbersRef = useRef<RumbleNumber[]>([]);
  const partyStatusRef = useRef<string>("pre_event");
  
  // Ref for activity event function
  const addActivityEventRef = useRef<(type: ActivityEvent["type"], message: string) => void>(() => {});
  
  // Update addActivityEventRef when the function changes
  useEffect(() => {
    addActivityEventRef.current = (type: ActivityEvent["type"], message: string) => {
      const event: ActivityEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: new Date(),
      };
      setActivityEvents(prev => [event, ...prev].slice(0, 20));
      setLastActivityTime(new Date());
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    mensNumbersRef.current = mensNumbers;
  }, [mensNumbers]);

  useEffect(() => {
    womensNumbersRef.current = womensNumbers;
  }, [womensNumbers]);

  useEffect(() => {
    partyStatusRef.current = partyStatus;
  }, [partyStatus]);

  // Check if we're in undercard phase (any undercard match not yet resolved)
  const isUndercardPhase = UNDERCARD_MATCHES.some(m => 
    !matchResults.some(r => r.match_id === m.id)
  );

  // Effect 1: Initial data fetch (runs once per code change)
  useEffect(() => {
    if (!code) return;

    const fetchData = async () => {
      const { data: partyData } = await supabase
        .from("parties")
        .select("status")
        .eq("code", code)
        .single();

      if (partyData) setPartyStatus(partyData.status);

      const { data: playersData } = await supabase
        .from("players_public")
        .select("id, display_name, points")
        .eq("party_code", code)
        .order("points", { ascending: false });

      if (playersData) setPlayers(playersData);

      const { data: numbersData } = await supabase
        .from("rumble_numbers")
        .select("number, wrestler_name, assigned_to_player_id, entry_timestamp, elimination_timestamp, rumble_type")
        .eq("party_code", code)
        .order("number");

      if (numbersData) {
        setMensNumbers(numbersData.filter((n: any) => n.rumble_type === "mens"));
        setWomensNumbers(numbersData.filter((n: any) => n.rumble_type === "womens"));
      }

      // Fetch picks
      const { data: picksData } = await supabase
        .from("picks")
        .select("player_id, match_id, prediction")
        .in("player_id", playersData?.map(p => p.id) || []);
      
      if (picksData) setPicks(picksData);

      // Fetch match results
      const { data: resultsData } = await supabase
        .from("match_results")
        .select("match_id, result")
        .eq("party_code", code);
      
      if (resultsData) setMatchResults(resultsData);
    };

    fetchData();

    const checkInitialReveal = async () => {
      const hasSeenReveal = sessionStorage.getItem(`tv-reveal-seen-${code}`);
      if (!hasSeenReveal) {
        const { data: partyData } = await supabase
          .from("parties")
          .select("status, event_started_at")
          .eq("code", code)
          .single();
        
        if (partyData?.status === "live" && partyData.event_started_at) {
          const startedAt = new Date(partyData.event_started_at);
          const now = new Date();
          const timeSinceStart = (now.getTime() - startedAt.getTime()) / 1000;
          
          // Show reveal if event started within the last 2 minutes
          if (timeSinceStart < 120) {
            const { data: allPlayers } = await supabase
              .from("players_public")
              .select("id, display_name")
              .eq("party_code", code)
              .order("joined_at");

            const { data: allNumbers } = await supabase
              .from("rumble_numbers")
              .select("number, assigned_to_player_id, rumble_type")
              .eq("party_code", code);

            if (allPlayers && allNumbers) {
              const playerData: PlayerWithNumbers[] = allPlayers.map(p => ({
                playerName: p.display_name,
                mensNumbers: allNumbers
                  .filter(n => n.assigned_to_player_id === p.id && n.rumble_type === "mens")
                  .map(n => n.number)
                  .sort((a, b) => a - b),
                womensNumbers: allNumbers
                  .filter(n => n.assigned_to_player_id === p.id && n.rumble_type === "womens")
                  .map(n => n.number)
                  .sort((a, b) => a - b),
              }));
              
              setRevealPlayers(playerData);
              setShowNumberReveal(true);
            }
          }
        }
      }
    };

    checkInitialReveal();
  }, [code]); // Only re-run when party code changes

  // Effect 2: Realtime subscriptions (stable, no state deps)
  useEffect(() => {
    if (!code) return;

    // Helper functions that read from refs, not state
    const getPlayerName = (playerId: string | null) => {
      if (!playerId) return "Vacant";
      const player = playersRef.current.find(p => p.id === playerId);
      return player?.display_name || "Unknown";
    };

    // Note: Final Four celebration removed for seamless second-screen viewing

    const loadRevealData = async () => {
      const { data: allPlayers } = await supabase
        .from("players_public")
        .select("id, display_name")
        .eq("party_code", code)
        .order("joined_at");

      const { data: allNumbers } = await supabase
        .from("rumble_numbers")
        .select("number, assigned_to_player_id, rumble_type")
        .eq("party_code", code);

      if (allPlayers && allNumbers) {
        const playerData: PlayerWithNumbers[] = allPlayers.map(p => ({
          playerName: p.display_name,
          mensNumbers: allNumbers
            .filter(n => n.assigned_to_player_id === p.id && n.rumble_type === "mens")
            .map(n => n.number)
            .sort((a, b) => a - b),
          womensNumbers: allNumbers
            .filter(n => n.assigned_to_player_id === p.id && n.rumble_type === "womens")
            .map(n => n.number)
            .sort((a, b) => a - b),
        }));
        
        setRevealPlayers(playerData);
        setShowNumberReveal(true);
      }
    };

    const channel = supabase
      .channel(`tv-display-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parties", filter: `code=eq.${code}` }, async (payload) => {
        if (payload.new && typeof payload.new === "object" && "status" in payload.new) {
          const newStatus = payload.new.status as string;
          if (newStatus === "live" && partyStatusRef.current === "pre_event") {
            // Event just started - trigger number reveal animation
            await loadRevealData();
          }
          setPartyStatus(newStatus);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, () => {
        supabase.from("players_public").select("id, display_name, points").eq("party_code", code).order("points", { ascending: false }).then(({ data }) => {
          if (data) setPlayers(data);
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, (payload) => {
        const updated = payload.new as any;
        const old = payload.old as any;
        
        // Add activity event for entry (no overlay animation)
        if (updated.entry_timestamp && !old?.entry_timestamp) {
          const player = playersRef.current.find(p => p.id === updated.assigned_to_player_id);
          const ownerName = player?.display_name || "Vacant";
          addActivityEventRef.current("entry", `#${updated.number}: ${updated.wrestler_name} (${ownerName})`);
        }
        
        // Add activity event for elimination
        if (updated.elimination_timestamp && !old?.elimination_timestamp) {
          addActivityEventRef.current("elimination", `${updated.wrestler_name} eliminated`);
        }

        // Refresh numbers
        supabase.from("rumble_numbers").select("number, wrestler_name, assigned_to_player_id, entry_timestamp, elimination_timestamp, rumble_type").eq("party_code", code).order("number").then(({ data }) => {
          if (data) {
            const mens = data.filter((n: any) => n.rumble_type === "mens");
            const womens = data.filter((n: any) => n.rumble_type === "womens");
            setMensNumbers(mens);
            setWomensNumbers(womens);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, async (payload) => {
        const matchResult = payload.new as any;
        if (!matchResult?.match_id) return;

        // Update match results state
        setMatchResults(prev => {
          const exists = prev.some(r => r.match_id === matchResult.match_id);
          if (exists) {
            return prev.map(r => r.match_id === matchResult.match_id ? matchResult : r);
          }
          return [...prev, matchResult];
        });
        
        // Add activity event for match results
        if (matchResult.match_id.startsWith("undercard")) {
          addActivityEventRef.current("result", `${matchResult.result} wins!`);
        } else if (matchResult.match_id === "mens_rumble_winner" || matchResult.match_id === "womens_rumble_winner") {
          const label = matchResult.match_id === "mens_rumble_winner" ? "Men's" : "Women's";
          addActivityEventRef.current("result", `${label} Rumble Winner: ${matchResult.result}!`);
        }
        // Note: Celebration overlays removed for seamless second-screen viewing
        // Winner and Iron Man events are still shown in the activity ticker
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, () => {
        // Refresh picks when they change
        supabase.from("picks").select("player_id, match_id, prediction").then(({ data }) => {
          if (data) setPicks(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]); // Only code as dependency - refs handle current state access

  const getPlayerInitials = (playerId: string | null) => {
    if (!playerId) return "V";
    const player = players.find(p => p.id === playerId);
    if (!player?.display_name) return "?";
    
    const names = player.display_name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return player.display_name.slice(0, 2).toUpperCase();
  };

  const getNumberStatus = (num: RumbleNumber): "pending" | "active" | "eliminated" => {
    if (!num.entry_timestamp) return "pending";
    if (num.elimination_timestamp) return "eliminated";
    return "active";
  };

  // Calculate rumble stats
  const activeWrestlerCount = currentViewType === "rumble" 
    ? (currentViewIndex === 3 
        ? mensNumbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length
        : womensNumbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length)
    : 0;
  
  const totalEliminations = currentViewType === "rumble"
    ? (currentViewIndex === 3
        ? mensNumbers.filter(n => n.elimination_timestamp).length
        : womensNumbers.filter(n => n.elimination_timestamp).length)
    : 0;

  // Handle view changes from navigator
  const handleViewChange = useCallback((viewType: ViewType, viewIndex: number, viewTitle: string) => {
    setCurrentViewType(viewType);
    setCurrentViewIndex(viewIndex);
    setCurrentViewTitle(viewTitle);
  }, []);

  // Handle manual view selection (pauses auto-rotate)
  const handleSelectView = useCallback((index: number) => {
    setCurrentViewIndex(index);
    setCurrentViewTitle(VIEWS[index].title);
    setCurrentViewType(VIEWS[index].type);
    // Pause auto-rotate on manual navigation
    setAutoRotate(false);
  }, []);

  // Auto-rotate logic
  useEffect(() => {
    if (!autoRotate) {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
        autoRotateIntervalRef.current = null;
      }
      return;
    }

    autoRotateIntervalRef.current = setInterval(() => {
      setCurrentViewIndex(prev => (prev === VIEWS.length - 1 ? 0 : prev + 1));
    }, 30000); // 30 seconds

    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [autoRotate]);

  // Keep view info in sync when currentViewIndex changes from auto-rotate
  useEffect(() => {
    const view = VIEWS[currentViewIndex];
    setCurrentViewTitle(view.title);
    setCurrentViewType(view.type);
  }, [currentViewIndex]);

  const handleRevealComplete = () => {
    setShowNumberReveal(false);
    sessionStorage.setItem(`tv-reveal-seen-${code}`, "true");
  };

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => !prev);
  }, []);

  return (
    <>
      {/* Number Reveal Animation */}
      <AnimatePresence>
        {showNumberReveal && revealPlayers.length > 0 && (
          <NumberRevealAnimation
            players={revealPlayers}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>

    <div className="min-h-screen bg-background text-foreground tv-mode p-6 flex flex-col">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <p className="text-muted-foreground text-lg font-mono">#{code}</p>
        </div>
        
        <TvHeaderStats
          currentViewTitle={currentViewTitle}
          activeWrestlerCount={activeWrestlerCount}
          totalEliminations={totalEliminations}
          lastActivityTime={lastActivityTime}
          autoRotate={autoRotate}
          onToggleAutoRotate={toggleAutoRotate}
          showRumbleStats={currentViewType === "rumble"}
        />
      </div>

      {/* Tab Bar - Moved up directly below header */}
      {partyStatus !== "pre_event" && (
        <div className="mb-4">
          <TvTabBar
            views={VIEWS}
            currentIndex={currentViewIndex}
            onSelectView={handleSelectView}
            isViewComplete={(view) => {
              if (view.type === "undercard") {
                return matchResults.some(r => r.match_id === view.id);
              }
              if (view.id === "mens") {
                return matchResults.some(r => r.match_id === "mens_rumble_winner");
              }
              if (view.id === "womens") {
                return matchResults.some(r => r.match_id === "womens_rumble_winner");
              }
              return false;
            }}
            isViewActive={(view) => {
              if (view.type === "rumble") {
                const numbers = view.id === "mens" ? mensNumbers : womensNumbers;
                return numbers.some(n => n.entry_timestamp && !n.elimination_timestamp);
              }
              return false;
            }}
          />
        </div>
      )}

      {/* Main Content Area - Full Width */}
      <div className="flex-1">
        {partyStatus === "pre_event" ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Logo size="lg" className="mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Waiting for Event to Start</h2>
              <p className="text-muted-foreground">{players.length} players ready</p>
            </div>
          </div>
        ) : (
          <TvViewNavigator
            matchResults={matchResults}
            mensNumbers={mensNumbers}
            womensNumbers={womensNumbers}
            players={players}
            picks={picks}
            getPlayerInitials={getPlayerInitials}
            getNumberStatus={getNumberStatus}
            onViewChange={handleViewChange}
            currentViewIndex={currentViewIndex}
            onSelectView={handleSelectView}
          />
        )}
      </div>

      {/* Activity Ticker */}
      {partyStatus !== "pre_event" && (
        <div className="mt-4">
          <TvActivityTicker events={activityEvents} />
        </div>
      )}

    </div>
    </>
  );
}
