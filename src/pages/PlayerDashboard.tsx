import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { NumberRevealAnimation } from "@/components/NumberRevealAnimation";
import { CelebrationOverlay, CelebrationType } from "@/components/CelebrationOverlay";
import { BottomNavBar, TabId, TabBadge } from "@/components/dashboard/BottomNavBar";
import { NumbersSection } from "@/components/dashboard/NumbersSection";
import { MatchesSection } from "@/components/dashboard/MatchesSection";
import { RumblePropsSection } from "@/components/dashboard/RumblePropsSection";
import { SinglePickEditModal } from "@/components/dashboard/SinglePickEditModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Match ID groupings for each tab (chaos props now included in mens/womens)
const TAB_MATCH_IDS: Record<Exclude<TabId, "numbers">, string[]> = {
  matches: ['undercard_1', 'undercard_2', 'undercard_3', 'mens_rumble_winner', 'womens_rumble_winner'],
  mens: [
    'mens_first_elimination', 'mens_most_eliminations', 'mens_longest_time', 'mens_entrant_1', 'mens_entrant_30', 
    'mens_final_four_1', 'mens_final_four_2', 'mens_final_four_3', 'mens_final_four_4', 'mens_no_show',
    'mens_chaos_prop_1', 'mens_chaos_prop_2', 'mens_chaos_prop_3', 'mens_chaos_prop_4', 'mens_chaos_prop_5', 'mens_chaos_prop_6'
  ],
  womens: [
    'womens_first_elimination', 'womens_most_eliminations', 'womens_longest_time', 'womens_entrant_1', 'womens_entrant_30', 
    'womens_final_four_1', 'womens_final_four_2', 'womens_final_four_3', 'womens_final_four_4', 'womens_no_show',
    'womens_chaos_prop_1', 'womens_chaos_prop_2', 'womens_chaos_prop_3', 'womens_chaos_prop_4', 'womens_chaos_prop_5', 'womens_chaos_prop_6'
  ],
};

function calculateBadges(picks: Pick[], results: MatchResult[]): Partial<Record<TabId, TabBadge>> {
  const badges: Partial<Record<TabId, TabBadge>> = {};
  
  for (const [tabId, matchIds] of Object.entries(TAB_MATCH_IDS)) {
    let correct = 0;
    let pending = 0;
    
    for (const matchId of matchIds) {
      const pick = picks.find(p => p.match_id === matchId);
      const result = results.find(r => r.match_id === matchId);
      
      if (!pick) continue;
      if (!result) {
        pending++;
      } else if (pick.prediction === result.result) {
        correct++;
      }
    }
    
    badges[tabId as TabId] = { correct, pending };
  }
  
  return badges;
}

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded: number | null;
}

interface RumbleNumber {
  rumble_type: string;
  number: number;
  wrestler_name: string | null;
  assigned_to_player_id?: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface PlayerWithNumbers {
  playerName: string;
  mensNumbers: number[];
  womensNumbers: number[];
}

interface CelebrationData {
  type: CelebrationType;
  data: any;
}

export default function PlayerDashboard() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = getPlayerSession();

  const [activeTab, setActiveTab] = useState<TabId>("matches");
  const [partyStatus, setPartyStatus] = useState<string>("pre_event");
  const [playerPoints, setPlayerPoints] = useState(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [numbers, setNumbers] = useState<RumbleNumber[]>([]);
  const [allNumbers, setAllNumbers] = useState<RumbleNumber[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNumberReveal, setShowNumberReveal] = useState(false);
  const [revealPlayers, setRevealPlayers] = useState<PlayerWithNumbers[]>([]);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [players, setPlayers] = useState<Array<{ id: string; display_name: string }>>([]);
  
  // Single pick edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [editingCurrentPick, setEditingCurrentPick] = useState("");

  // Track shown celebrations to avoid duplicates
  const shownCelebrations = useRef<Set<string>>(new Set());

  // Switch to numbers tab when event goes live
  useEffect(() => {
    if (partyStatus === "live" && numbers.length > 0) {
      setActiveTab("numbers");
    }
  }, [partyStatus, numbers.length]);

  useEffect(() => {
    if (!code || !session?.playerId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch party status
        const { data: partyData } = await supabase
          .from("parties")
          .select("status")
          .eq("code", code)
          .single();
        
        if (partyData) setPartyStatus(partyData.status);

        // Fetch player data (use public view to avoid exposing sensitive data)
        const { data: playerData } = await supabase
          .from("players_public")
          .select("points")
          .eq("id", session.playerId)
          .single();

        if (playerData) setPlayerPoints(playerData.points);

        // Fetch all players for ranking
        const { data: allPlayersData } = await supabase
          .from("players_public")
          .select("id, display_name, points")
          .eq("party_code", code)
          .order("points", { ascending: false });

        if (allPlayersData) {
          setTotalPlayers(allPlayersData.length);
          setPlayers(allPlayersData);
          const rank = allPlayersData.findIndex(p => p.id === session.playerId) + 1;
          setPlayerRank(rank > 0 ? rank : null);
        }

        // Fetch picks
        const { data: picksData } = await supabase
          .from("picks")
          .select("match_id, prediction, points_awarded")
          .eq("player_id", session.playerId);

        if (picksData) setPicks(picksData);

        // Fetch assigned numbers
        const { data: numbersData } = await supabase
          .from("rumble_numbers")
          .select("rumble_type, number, wrestler_name, entry_timestamp, elimination_timestamp")
          .eq("party_code", code)
          .eq("assigned_to_player_id", session.playerId)
          .order("number");

        if (numbersData) setNumbers(numbersData);

        // Fetch all numbers for celebration checks
        const { data: allNumbersData } = await supabase
          .from("rumble_numbers")
          .select("rumble_type, number, wrestler_name, assigned_to_player_id, entry_timestamp, elimination_timestamp")
          .eq("party_code", code)
          .order("number");

        if (allNumbersData) setAllNumbers(allNumbersData);

        // Fetch match results
        const { data: resultsData } = await supabase
          .from("match_results")
          .select("match_id, result")
          .eq("party_code", code);

        if (resultsData) setResults(resultsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Function to load reveal data - only current player's numbers for personal reveal
    const loadRevealData = async () => {
      const { data: myNumbersData } = await supabase
        .from("rumble_numbers")
        .select("number, rumble_type")
        .eq("party_code", code)
        .eq("assigned_to_player_id", session.playerId);

      if (myNumbersData && myNumbersData.length > 0) {
        const playerData: PlayerWithNumbers[] = [{
          playerName: session.displayName || "You",
          mensNumbers: myNumbersData
            .filter(n => n.rumble_type === "mens")
            .map(n => n.number)
            .sort((a, b) => a - b),
          womensNumbers: myNumbersData
            .filter(n => n.rumble_type === "womens")
            .map(n => n.number)
            .sort((a, b) => a - b),
        }];
        
        setRevealPlayers(playerData);
        setShowNumberReveal(true);
      }
    };

    // Check if we should show reveal on initial load (party just went live)
    const checkInitialReveal = async () => {
      const hasSeenReveal = sessionStorage.getItem(`reveal-seen-${code}`);
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
            await loadRevealData();
          }
        }
      }
    };

    checkInitialReveal();

    const getPlayerName = (playerId: string | null) => {
      if (!playerId) return "Vacant";
      const player = players.find(p => p.id === playerId);
      return player?.display_name || "Unknown";
    };

    const checkForPlayerCelebration = (matchId: string, result: string, numbersToCheck: RumbleNumber[]) => {
      // Check Final Four - if player's number is in the final four
      if (matchId === "mens_final_four" || matchId === "womens_final_four") {
        const celebrationKey = `player_${matchId}`;
        if (shownCelebrations.current.has(celebrationKey)) return;

        const type = matchId === "mens_final_four" ? "mens" : "womens";
        const finalFourNumbers = result.split(",").map(s => parseInt(s.replace("#", "")));
        const playerNumbers = numbersToCheck
          .filter(n => n.rumble_type === type && n.assigned_to_player_id === session.playerId)
          .map(n => n.number);

        const playerInFinalFour = playerNumbers.some(n => finalFourNumbers.includes(n));
        
        if (playerInFinalFour) {
          shownCelebrations.current.add(celebrationKey);
          
          const activeNumbers = numbersToCheck.filter(n => 
            n.rumble_type === type && 
            n.entry_timestamp && 
            !n.elimination_timestamp
          );

          setCelebration({
            type: "final-four",
            data: {
              rumbleType: type,
              wrestlers: activeNumbers.slice(0, 4).map(n => ({
                number: n.number,
                wrestlerName: n.wrestler_name || "Unknown",
                ownerName: getPlayerName(n.assigned_to_player_id || null),
              })),
            },
          });
        }
      }

      // Check Winner - if player owns the winning number or picked the winner
      if (matchId === "mens_rumble_winner" || matchId === "womens_rumble_winner") {
        const celebrationKey = `player_${matchId}`;
        if (shownCelebrations.current.has(celebrationKey)) return;

        const type = matchId === "mens_rumble_winner" ? "mens" : "womens";
        const winnerNumber = numbersToCheck.find(n => n.wrestler_name === result && n.rumble_type === type);
        
        if (winnerNumber) {
          const isOwner = winnerNumber.assigned_to_player_id === session.playerId;
          const pick = picks.find(p => p.match_id === matchId);
          const isPicker = pick?.prediction === result;

          if (isOwner || isPicker) {
            shownCelebrations.current.add(celebrationKey);
            setCelebration({
              type: "winner",
              data: {
                rumbleType: type,
                number: winnerNumber.number,
                wrestlerName: winnerNumber.wrestler_name || "Unknown",
                ownerName: getPlayerName(winnerNumber.assigned_to_player_id || null),
              },
            });
          }
        }
      }

      // Check Iron Man/Woman - if player owns the Iron Man number
      if (matchId === "mens_iron_man" || matchId === "womens_iron_woman") {
        const celebrationKey = `player_${matchId}`;
        if (shownCelebrations.current.has(celebrationKey)) return;

        try {
          const ironData = JSON.parse(result);
          if (ironData.owner === session.playerId) {
            shownCelebrations.current.add(celebrationKey);
            const type = matchId === "mens_iron_man" ? "mens" : "womens";
            
            // Delay to show after winner if winner was also shown
            setTimeout(() => {
              setCelebration({
                type: "iron-man",
                data: {
                  rumbleType: type,
                  number: ironData.number,
                  wrestlerName: ironData.wrestler,
                  duration: ironData.duration,
                  ownerName: getPlayerName(ironData.owner),
                },
              });
            }, shownCelebrations.current.has(`player_${type}_rumble_winner`) ? 7000 : 0);
          }
        } catch (e) {
          console.error("Error parsing iron man data:", e);
        }
      }
    };

    // Set up realtime subscriptions
    const channel = supabase
      .channel(`player-dashboard-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parties", filter: `code=eq.${code}` }, async (payload) => {
        const newStatus = (payload.new as any)?.status;
        if (newStatus === "live" && partyStatus === "pre_event") {
          // Event just started - trigger number reveal animation
          await loadRevealData();
        }
        fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `id=eq.${session.playerId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "picks", filter: `player_id=eq.${session.playerId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, (payload) => {
        const matchResult = payload.new as any;
        if (matchResult?.match_id && matchResult?.result) {
          checkForPlayerCelebration(matchResult.match_id, matchResult.result, allNumbers);
        }
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, session?.playerId, navigate, partyStatus, players, allNumbers, picks]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const handleRevealComplete = () => {
    setShowNumberReveal(false);
    sessionStorage.setItem(`reveal-seen-${code}`, "true");
  };

  const handleCelebrationComplete = () => {
    setCelebration(null);
  };

  const mensNumbers = numbers.filter(n => n.rumble_type === "mens");
  const womensNumbers = numbers.filter(n => n.rumble_type === "womens");
  const showNumbers = partyStatus !== "pre_event" || numbers.length > 0;

  // Check if we can edit picks (only in pre_event status)
  const canEditPicks = partyStatus === "pre_event";

  const handleEditPick = (matchId: string, currentPick: string) => {
    setEditingMatchId(matchId);
    setEditingCurrentPick(currentPick);
    setEditModalOpen(true);
  };

  const handleSavePick = async (matchId: string, newValue: string) => {
    if (!session?.playerId) return;
    
    try {
      const { error } = await supabase
        .from("picks")
        .upsert({
          player_id: session.playerId,
          match_id: matchId,
          prediction: newValue,
        }, { onConflict: "player_id,match_id" });

      if (error) throw error;

      // Update local state
      setPicks(prev => {
        const existing = prev.find(p => p.match_id === matchId);
        if (existing) {
          return prev.map(p => p.match_id === matchId ? { ...p, prediction: newValue } : p);
        } else {
          return [...prev, { match_id: matchId, prediction: newValue, points_awarded: null }];
        }
      });

      toast.success("Pick updated!");
    } catch (err) {
      console.error("Error saving pick:", err);
      toast.error("Failed to save pick");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "numbers":
        return <NumbersSection mensNumbers={mensNumbers} womensNumbers={womensNumbers} />;
      case "matches":
        return <MatchesSection picks={picks} results={results} onEditPick={handleEditPick} canEdit={canEditPicks} />;
      case "mens":
        return <RumblePropsSection picks={picks} results={results} gender="mens" onEditPick={handleEditPick} canEdit={canEditPicks} />;
      case "womens":
        return <RumblePropsSection picks={picks} results={results} gender="womens" onEditPick={handleEditPick} canEdit={canEditPicks} />;
      default:
        return null;
    }
  };

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

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebration && (
          <CelebrationOverlay
            type={celebration.type}
            data={celebration.data}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-24">
        {/* Header with persistent points - Enhanced with gradient and rank badges */}
        <div className="sticky top-0 z-20 header-gradient backdrop-blur border-b border-border/50 ring-rope-texture">
          <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-1 rounded-lg hover:bg-muted/50"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="text-center flex-1 min-w-0 px-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Group {code}</div>
              <div className="font-bold truncate text-[15px]">{session?.displayName}</div>
            </div>
            <div className="text-right">
              <motion.div 
                key={playerPoints}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-gradient-gold"
              >
                {playerPoints}
              </motion.div>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5",
                playerRank === 1 && "rank-badge-1 text-primary-foreground",
                playerRank === 2 && "rank-badge-2 text-primary-foreground",
                playerRank === 3 && "rank-badge-3 text-white",
                playerRank && playerRank > 3 && "bg-muted text-muted-foreground"
              )}>
                #{playerRank} of {totalPlayers}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-lg mx-auto p-4">
          {/* Status Banner (pre-event only) */}
          {partyStatus === "pre_event" && (
            <motion.div
              className="bg-muted/50 rounded-xl p-4 text-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock className="mx-auto mb-2 text-muted-foreground" size={24} />
              <p className="text-muted-foreground">Waiting for event to start...</p>
              <Link to={`/player/picks/${code}`}>
                <Button variant="outline" size="sm" className="mt-3">
                  <Edit size={16} className="mr-2" />
                  Edit Picks
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          showNumbers={showNumbers}
          badges={calculateBadges(picks, results)}
        />
      </div>

      {/* Single Pick Edit Modal */}
      <SinglePickEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        matchId={editingMatchId}
        currentPick={editingCurrentPick}
        onSave={handleSavePick}
      />
    </>
  );
}
