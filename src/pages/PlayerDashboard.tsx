import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Hash, Check, X, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING } from "@/lib/constants";
import { NumberRevealAnimation } from "@/components/NumberRevealAnimation";

interface Pick {
  match_id: string;
  prediction: string;
  points_awarded: number | null;
}

interface RumbleNumber {
  rumble_type: string;
  number: number;
  wrestler_name: string | null;
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

export default function PlayerDashboard() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = getPlayerSession();

  const [partyStatus, setPartyStatus] = useState<string>("pre_event");
  const [previousStatus, setPreviousStatus] = useState<string>("pre_event");
  const [playerPoints, setPlayerPoints] = useState(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [numbers, setNumbers] = useState<RumbleNumber[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNumberReveal, setShowNumberReveal] = useState(false);
  const [revealPlayers, setRevealPlayers] = useState<PlayerWithNumbers[]>([]);

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

        // Fetch player data
        const { data: playerData } = await supabase
          .from("players")
          .select("points")
          .eq("id", session.playerId)
          .single();

        if (playerData) setPlayerPoints(playerData.points);

        // Fetch all players for ranking
        const { data: allPlayers } = await supabase
          .from("players")
          .select("id, points")
          .eq("party_code", code)
          .order("points", { ascending: false });

        if (allPlayers) {
          setTotalPlayers(allPlayers.length);
          const rank = allPlayers.findIndex(p => p.id === session.playerId) + 1;
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
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, () => fetchData())
      .subscribe();

    // Function to load reveal data
    const loadRevealData = async () => {
      // Fetch all players with their numbers for the reveal
      const { data: allPlayers } = await supabase
        .from("players")
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, session?.playerId, navigate]);

  const getPickResult = (matchId: string) => {
    const result = results.find(r => r.match_id === matchId);
    const pick = picks.find(p => p.match_id === matchId);
    if (!result || !pick) return null;
    return result.result === pick.prediction;
  };

  const getNumberStatus = (num: RumbleNumber) => {
    if (!num.entry_timestamp) return "pending";
    if (num.elimination_timestamp) return "eliminated";
    return "active";
  };

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

  const mensNumbers = numbers.filter(n => n.rumble_type === "mens");
  const womensNumbers = numbers.filter(n => n.rumble_type === "womens");

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

    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Party {code}</div>
            <div className="font-bold">{session?.displayName}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{playerPoints}</div>
            <div className="text-xs text-muted-foreground">
              {playerRank ? `#${playerRank} of ${totalPlayers}` : "pts"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Status Banner */}
        {partyStatus === "pre_event" && (
          <motion.div
            className="bg-muted/50 rounded-xl p-4 text-center"
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

        {/* Your Numbers (only show after event starts) */}
        {partyStatus !== "pre_event" && (mensNumbers.length > 0 || womensNumbers.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-xl font-bold">
              <Hash className="text-primary" size={24} />
              Your Numbers
            </div>

            {mensNumbers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">🧔 Men's Rumble</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mensNumbers.map((num) => {
                    const status = getNumberStatus(num);
                    return (
                      <div
                        key={`mens-${num.number}`}
                        className={`p-3 rounded-xl border ${
                          status === "active"
                            ? "bg-primary/20 border-primary active-pulse"
                            : status === "eliminated"
                            ? "bg-destructive/20 border-destructive opacity-60"
                            : "bg-muted border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">#{num.number}</span>
                          {status === "active" && <span className="text-xs text-primary">ACTIVE</span>}
                          {status === "eliminated" && <X size={16} className="text-destructive" />}
                        </div>
                        <div className="text-sm truncate">
                          {num.wrestler_name || "Not yet entered"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {womensNumbers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">👩 Women's Rumble</h3>
                <div className="grid grid-cols-2 gap-2">
                  {womensNumbers.map((num) => {
                    const status = getNumberStatus(num);
                    return (
                      <div
                        key={`womens-${num.number}`}
                        className={`p-3 rounded-xl border ${
                          status === "active"
                            ? "bg-primary/20 border-primary active-pulse"
                            : status === "eliminated"
                            ? "bg-destructive/20 border-destructive opacity-60"
                            : "bg-muted border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">#{num.number}</span>
                          {status === "active" && <span className="text-xs text-primary">ACTIVE</span>}
                          {status === "eliminated" && <X size={16} className="text-destructive" />}
                        </div>
                        <div className="text-sm truncate">
                          {num.wrestler_name || "Not yet entered"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Your Picks */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="text-primary" size={24} />
            Your Picks
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {/* Undercard matches */}
            {UNDERCARD_MATCHES.map((match) => {
              const pick = picks.find(p => p.match_id === match.id);
              const isCorrect = getPickResult(match.id);
              
              return (
                <div key={match.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{match.title}</div>
                    <div className="font-medium">{pick?.prediction || "No pick"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect === true && (
                      <>
                        <Check size={18} className="text-success" />
                        <span className="text-success text-sm">+{SCORING.UNDERCARD_WINNER}</span>
                      </>
                    )}
                    {isCorrect === false && <X size={18} className="text-destructive" />}
                    {isCorrect === null && <span className="text-xs text-muted-foreground">pending</span>}
                  </div>
                </div>
              );
            })}

            {/* Rumble winners */}
            {["mens_rumble_winner", "womens_rumble_winner"].map((matchId) => {
              const pick = picks.find(p => p.match_id === matchId);
              const isCorrect = getPickResult(matchId);
              const label = matchId === "mens_rumble_winner" ? "🧔 Men's Winner" : "👩 Women's Winner";

              return (
                <div key={matchId} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="font-medium">{pick?.prediction || "No pick"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect === true && (
                      <>
                        <Check size={18} className="text-success" />
                        <span className="text-success text-sm">+{SCORING.RUMBLE_WINNER_PICK}</span>
                      </>
                    )}
                    {isCorrect === false && <X size={18} className="text-destructive" />}
                    {isCorrect === null && <span className="text-xs text-muted-foreground">pending</span>}
                  </div>
                </div>
              );
            })}

            {/* Props */}
            {CHAOS_PROPS.map((prop) => {
              const pick = picks.find(p => p.match_id === prop.id);
              const isCorrect = getPickResult(prop.id);

              return (
                <div key={prop.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{prop.shortName}</div>
                    <div className="font-medium">{pick?.prediction || "No pick"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect === true && (
                      <>
                        <Check size={18} className="text-success" />
                        <span className="text-success text-sm">+{SCORING.PROP_BET}</span>
                      </>
                    )}
                    {isCorrect === false && <X size={18} className="text-destructive" />}
                    {isCorrect === null && <span className="text-xs text-muted-foreground">pending</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
    </>
  );
}
