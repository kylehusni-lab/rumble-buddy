import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { NumberRevealAnimation } from "@/components/NumberRevealAnimation";
import { TvViewNavigator } from "@/components/tv/TvViewNavigator";
import { TvUnifiedHeader, RumbleSubView } from "@/components/tv/TvUnifiedHeader";
import { TvActivityTicker, ActivityEvent } from "@/components/tv/TvActivityTicker";
import { TvScorePopup } from "@/components/tv/TvScorePopup";
import { TvTabId } from "@/components/tv/TvTabBar";
import { OttLogoHero } from "@/components/OttLogo";
import { UNDERCARD_MATCHES } from "@/lib/constants";
import { useTvScale } from "@/hooks/useTvScale";
import { useAutoHideHeader } from "@/hooks/useAutoHideHeader";
import { useTvScoreQueue } from "@/hooks/useTvScoreQueue";

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

// Snapshot data returned by get_tv_snapshot RPC
interface TvSnapshot {
  found: boolean;
  status?: string;
  event_started_at?: string;
  players?: Player[];
  numbers?: (RumbleNumber & { rumble_type: string })[];
  match_results?: MatchResult[];
  picks?: Pick[];
}

export default function TvDisplay() {
  const { code } = useParams<{ code: string }>();
  
  // Responsive scaling hook
  const { mainColSpan, sideColSpan } = useTvScale();
  
  // Auto-hide header hook
  const { isVisible: isHeaderVisible, showHeader } = useAutoHideHeader();
  
  // Score popup queue
  const { currentPopup, addScoreEvent } = useTvScoreQueue();

  const [partyStatus, setPartyStatus] = useState<string>("pre_event");
  const [players, setPlayers] = useState<Player[]>([]);
  const [mensNumbers, setMensNumbers] = useState<RumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<RumbleNumber[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  
  const [showNumberReveal, setShowNumberReveal] = useState(false);
  const [revealPlayers, setRevealPlayers] = useState<PlayerWithNumbers[]>([]);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<TvTabId>("leaderboard");
  const [undercardMatchIndex, setUndercardMatchIndex] = useState(0);
  
  // Sub-view state for rumble tabs (lifted to parent for header control)
  const [mensSubView, setMensSubView] = useState<RumbleSubView>("grid");
  const [womensSubView, setWomensSubView] = useState<RumbleSubView>("grid");
  
  // Activity ticker state
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  
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
  
  // Ref for score popup function
  const addScoreEventRef = useRef<(points: number, playerName: string) => void>(() => {});
  
  // Update refs when functions change
  useEffect(() => {
    addActivityEventRef.current = (type: ActivityEvent["type"], message: string) => {
      const event: ActivityEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: new Date(),
      };
      setActivityEvents(prev => [event, ...prev].slice(0, 20));
    };
  }, []);
  
  useEffect(() => {
    addScoreEventRef.current = addScoreEvent;
  }, [addScoreEvent]);

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

  // Helper to fetch all TV data via RPC (bypasses table SELECT policies)
  const fetchTvSnapshot = useCallback(async (): Promise<TvSnapshot | null> => {
    if (!code) return null;
    
    console.log("[TV] Fetching snapshot via RPC...");
    const { data, error } = await supabase.rpc("get_tv_snapshot", { p_party_code: code });
    
    if (error) {
      console.error("[TV] Snapshot RPC error:", error);
      return null;
    }
    
    // Cast the JSONB response to our typed interface
    const snapshot = data as unknown as TvSnapshot;
    
    if (!snapshot || !snapshot.found) {
      console.log("[TV] Party not found");
      return null;
    }
    
    console.log("[TV] Snapshot received:", snapshot.status, "players:", snapshot.players?.length);
    return snapshot;
  }, [code]);

  // Helper to apply snapshot data to state
  const applySnapshot = useCallback((snapshot: any, triggerReveal = false) => {
    if (!snapshot || !snapshot.found) return;
    
    // Update status
    if (snapshot.status) {
      setPartyStatus(snapshot.status);
    }
    
    // Update players
    if (snapshot.players) {
      setPlayers(snapshot.players);
    }
    
    // Update numbers
    if (snapshot.numbers) {
      const mens = snapshot.numbers.filter((n: any) => n.rumble_type === "mens");
      const womens = snapshot.numbers.filter((n: any) => n.rumble_type === "womens");
      setMensNumbers(mens);
      setWomensNumbers(womens);
    }
    
    // Update picks
    if (snapshot.picks) {
      setPicks(snapshot.picks);
    }
    
    // Update match results
    if (snapshot.match_results) {
      setMatchResults(snapshot.match_results);
    }
    
    // Trigger reveal animation if requested
    if (triggerReveal && snapshot.status === "live" && snapshot.players && snapshot.numbers) {
      const playerData: PlayerWithNumbers[] = snapshot.players.map((p: any) => ({
        playerName: p.display_name,
        mensNumbers: snapshot.numbers
          .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "mens")
          .map((n: any) => n.number)
          .sort((a: number, b: number) => a - b),
        womensNumbers: snapshot.numbers
          .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "womens")
          .map((n: any) => n.number)
          .sort((a: number, b: number) => a - b),
      }));
      
      setRevealPlayers(playerData);
      setShowNumberReveal(true);
    }
  }, []);

  // Effect for initial fetch + fallback polling (realtime is primary)
  useEffect(() => {
    if (!code) return;
    
    const poll = async () => {
      const snapshot = await fetchTvSnapshot();
      if (!snapshot) return;
      
      const wasPreEvent = partyStatusRef.current === "pre_event";
      const isNowLive = snapshot.status === "live";
      
      // Apply the snapshot data
      applySnapshot(snapshot);
      
      // Trigger reveal if transitioning from pre_event to live
      if (wasPreEvent && isNowLive) {
        const hasSeenReveal = sessionStorage.getItem(`tv-reveal-seen-${code}`);
        if (!hasSeenReveal && snapshot.players && snapshot.numbers) {
          const playerData: PlayerWithNumbers[] = snapshot.players.map((p: any) => ({
            playerName: p.display_name,
            mensNumbers: snapshot.numbers
              .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "mens")
              .map((n: any) => n.number)
              .sort((a: number, b: number) => a - b),
            womensNumbers: snapshot.numbers
              .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "womens")
              .map((n: any) => n.number)
              .sort((a: number, b: number) => a - b),
          }));
          
          setRevealPlayers(playerData);
          setShowNumberReveal(true);
        }
      }
    };
    
    // Run immediately on mount
    poll();
    
    // Fallback polling - only start after 5 seconds (give realtime time to connect)
    // Reduced frequency to 5 seconds since realtime is primary
    let pollInterval: NodeJS.Timeout | null = null;
    const fallbackTimer = setTimeout(() => {
      pollInterval = setInterval(poll, 5000);
    }, 5000);
    
    return () => {
      clearTimeout(fallbackTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [code, fetchTvSnapshot, applySnapshot]);

  // Check for initial reveal on mount (for late-joining TVs)
  useEffect(() => {
    if (!code) return;

    const checkInitialReveal = async () => {
      const hasSeenReveal = sessionStorage.getItem(`tv-reveal-seen-${code}`);
      if (hasSeenReveal) return;
      
      const snapshot = await fetchTvSnapshot();
      if (!snapshot || snapshot.status !== "live") return;
      
      // Check if event started recently (within 2 minutes)
      if (snapshot.event_started_at) {
        const startedAt = new Date(snapshot.event_started_at);
        const now = new Date();
        const timeSinceStart = (now.getTime() - startedAt.getTime()) / 1000;
        
        if (timeSinceStart < 120 && snapshot.players && snapshot.numbers) {
          const playerData: PlayerWithNumbers[] = snapshot.players.map((p: any) => ({
            playerName: p.display_name,
            mensNumbers: snapshot.numbers
              .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "mens")
              .map((n: any) => n.number)
              .sort((a: number, b: number) => a - b),
            womensNumbers: snapshot.numbers
              .filter((n: any) => n.assigned_to_player_id === p.id && n.rumble_type === "womens")
              .map((n: any) => n.number)
              .sort((a: number, b: number) => a - b),
          }));
          
          setRevealPlayers(playerData);
          setShowNumberReveal(true);
        }
      }
    };

    checkInitialReveal();
  }, [code, fetchTvSnapshot]);

  // Effect 2: Realtime subscriptions (stable, no state deps)
  useEffect(() => {
    if (!code) return;

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
          playerName: p.display_name || "",
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
          if (data) setPlayers(data as Player[]);
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, (payload) => {
        const updated = payload.new as any;
        const old = payload.old as any;
        
        // Add activity event for entry
        if (updated.entry_timestamp && !old?.entry_timestamp) {
          const player = playersRef.current.find(p => p.id === updated.assigned_to_player_id);
          const ownerName = player?.display_name || "Vacant";
          addActivityEventRef.current("entry", `#${updated.number}: ${updated.wrestler_name} (${ownerName})`);
          
          // Show score popup for entry points
          if (player) {
            addScoreEventRef.current(5, player.display_name);
          }
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, async (payload) => {
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
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "picks" }, async () => {
        // Refresh picks via snapshot RPC (filtered to party players)
        const snapshot = await fetchTvSnapshot();
        if (snapshot?.picks) setPicks(snapshot.picks);
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

  // Handle tab selection
  const handleSelectTab = useCallback((tabId: TvTabId) => {
    setActiveTab(tabId);
    // Reset undercard index when switching tabs
    if (tabId === "undercard") {
      setUndercardMatchIndex(0);
    }
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

    const tabs: TvTabId[] = ["leaderboard", "undercard", "mens", "womens"];
    autoRotateIntervalRef.current = setInterval(() => {
      setActiveTab(prev => {
        const currentIndex = tabs.indexOf(prev);
        return tabs[(currentIndex + 1) % tabs.length];
      });
    }, 30000); // 30 seconds

    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [autoRotate]);

  // Keyboard navigation for main tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tabs: TvTabId[] = ["leaderboard", "undercard", "mens", "womens"];
      if (e.key >= "1" && e.key <= "4") {
        const index = parseInt(e.key) - 1;
        setActiveTab(tabs[index]);
        setAutoRotate(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

      {/* Score Popup */}
      <TvScorePopup event={currentPopup} />

      <div className="min-h-screen bg-background text-foreground tv-mode flex flex-col">
        {/* Unified Auto-Hiding Header */}
        {partyStatus !== "pre_event" && (
          <TvUnifiedHeader
            partyCode={code || ""}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            mensSubView={mensSubView}
            womensSubView={womensSubView}
            onMensSubViewChange={setMensSubView}
            onWomensSubViewChange={setWomensSubView}
            autoRotate={autoRotate}
            onToggleAutoRotate={toggleAutoRotate}
            isVisible={isHeaderVisible}
            onShowHeader={showHeader}
          />
        )}

        {/* Main Content Area - Full Width with top padding for header */}
        <div className={`flex-1 flex flex-col p-6 ${partyStatus !== "pre_event" ? "pt-20" : ""}`}>
          {partyStatus === "pre_event" ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <OttLogoHero size={180} className="mx-auto mb-4" />
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
              activeTab={activeTab}
              undercardMatchIndex={undercardMatchIndex}
              onUndercardMatchChange={setUndercardMatchIndex}
              mensSubView={mensSubView}
              womensSubView={womensSubView}
            />
          )}
        </div>

        {/* Activity Ticker */}
        {partyStatus !== "pre_event" && (
          <div className="px-6 pb-6">
            <TvActivityTicker events={activityEvents} />
          </div>
        )}
      </div>
    </>
  );
}
