import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NumberRevealAnimation } from "@/components/NumberRevealAnimation";
import { CelebrationOverlay, CelebrationType } from "@/components/CelebrationOverlay";

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

interface CelebrationData {
  type: CelebrationType;
  data: any;
}

export default function TvDisplay() {
  const { code } = useParams<{ code: string }>();

  const [partyStatus, setPartyStatus] = useState<string>("pre_event");
  const [players, setPlayers] = useState<Player[]>([]);
  const [mensNumbers, setMensNumbers] = useState<RumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<RumbleNumber[]>([]);
  const [showOverlay, setShowOverlay] = useState<{ type: "entry" | "result"; data: any } | null>(null);
  const [showNumberReveal, setShowNumberReveal] = useState(false);
  const [revealPlayers, setRevealPlayers] = useState<PlayerWithNumbers[]>([]);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  
  // Track shown celebrations to avoid duplicates
  const shownCelebrations = useRef<Set<string>>(new Set());

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
        .from("players")
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
    };

    fetchData();

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

    // Check if we should show reveal on initial load
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

    const checkForFinalFour = (numbers: RumbleNumber[], type: "mens" | "womens") => {
      const celebrationKey = `${type}_final_four`;
      if (shownCelebrations.current.has(celebrationKey)) return;

      const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
      if (active.length === 4) {
        shownCelebrations.current.add(celebrationKey);
        setCelebration({
          type: "final-four",
          data: {
            rumbleType: type,
            wrestlers: active.map(n => ({
              number: n.number,
              wrestlerName: n.wrestler_name || "Unknown",
              ownerName: getPlayerName(n.assigned_to_player_id),
            })),
          },
        });
      }
    };

    const channel = supabase
      .channel(`tv-display-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parties", filter: `code=eq.${code}` }, async (payload) => {
        if (payload.new && typeof payload.new === "object" && "status" in payload.new) {
          const newStatus = payload.new.status as string;
          if (newStatus === "live" && partyStatus === "pre_event") {
            // Event just started - trigger number reveal animation
            await loadRevealData();
          }
          setPartyStatus(newStatus);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, () => {
        supabase.from("players").select("id, display_name, points").eq("party_code", code).order("points", { ascending: false }).then(({ data }) => {
          if (data) setPlayers(data);
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, (payload) => {
        const updated = payload.new as any;
        
        // Show entry overlay
        if (updated.entry_timestamp && !payload.old?.entry_timestamp) {
          const player = players.find(p => p.id === updated.assigned_to_player_id);
          setShowOverlay({
            type: "entry",
            data: {
              number: updated.number,
              wrestler: updated.wrestler_name,
              owner: player?.display_name || "Vacant",
            },
          });
          setTimeout(() => setShowOverlay(null), 5000);
        }

        // Refresh numbers and check for Final Four
        supabase.from("rumble_numbers").select("number, wrestler_name, assigned_to_player_id, entry_timestamp, elimination_timestamp, rumble_type").eq("party_code", code).order("number").then(({ data }) => {
          if (data) {
            const mens = data.filter((n: any) => n.rumble_type === "mens");
            const womens = data.filter((n: any) => n.rumble_type === "womens");
            setMensNumbers(mens);
            setWomensNumbers(womens);
            
            // Check for Final Four after elimination
            if (updated.elimination_timestamp) {
              if (updated.rumble_type === "mens") {
                checkForFinalFour(mens, "mens");
              } else {
                checkForFinalFour(womens, "womens");
              }
            }
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, async (payload) => {
        const matchResult = payload.new as any;
        if (!matchResult?.match_id) return;

        // Check for winner celebration
        if (matchResult.match_id === "mens_rumble_winner" || matchResult.match_id === "womens_rumble_winner") {
          const celebrationKey = matchResult.match_id;
          if (shownCelebrations.current.has(celebrationKey)) return;
          shownCelebrations.current.add(celebrationKey);

          const type = matchResult.match_id === "mens_rumble_winner" ? "mens" : "womens";
          const numbers = type === "mens" ? mensNumbers : womensNumbers;
          const winnerNumber = numbers.find(n => n.wrestler_name === matchResult.result);

          if (winnerNumber) {
            setCelebration({
              type: "winner",
              data: {
                rumbleType: type,
                number: winnerNumber.number,
                wrestlerName: winnerNumber.wrestler_name || "Unknown",
                ownerName: getPlayerName(winnerNumber.assigned_to_player_id),
              },
            });
          }
        }

        // Check for Iron Man/Woman celebration
        if (matchResult.match_id === "mens_iron_man" || matchResult.match_id === "womens_iron_woman") {
          const celebrationKey = matchResult.match_id;
          if (shownCelebrations.current.has(celebrationKey)) return;
          shownCelebrations.current.add(celebrationKey);

          try {
            const ironData = JSON.parse(matchResult.result);
            const type = matchResult.match_id === "mens_iron_man" ? "mens" : "womens";
            
            // Wait a bit to show after winner
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
            }, 7000);
          } catch (e) {
            console.error("Error parsing iron man data:", e);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, players, partyStatus, mensNumbers, womensNumbers]);

  const getPlayerInitial = (playerId: string | null) => {
    if (!playerId) return "V";
    const player = players.find(p => p.id === playerId);
    return player?.display_name?.charAt(0).toUpperCase() || "?";
  };

  const getNumberStatus = (num: RumbleNumber) => {
    if (!num.entry_timestamp) return "pending";
    if (num.elimination_timestamp) return "eliminated";
    return "active";
  };

  const renderNumberGrid = (numbers: RumbleNumber[], title: string) => {
    const activeCount = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="text-primary text-lg">Active: {activeCount}</span>
        </div>
        <div className="grid grid-cols-10 gap-2">
          {numbers.map((num) => {
            const status = getNumberStatus(num);
            return (
              <motion.div
                key={num.number}
                className={`number-cell aspect-square text-sm ${
                  status === "active"
                    ? "number-cell-active"
                    : status === "eliminated"
                    ? "number-cell-eliminated"
                    : "number-cell-vacant"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: num.number * 0.02 }}
              >
                <div className="text-center">
                  <div className="font-bold">{num.number}</div>
                  {status !== "pending" && (
                    <div className="text-[10px] opacity-75">
                      {getPlayerInitial(num.assigned_to_player_id)}
                    </div>
                  )}
                </div>
                {status === "eliminated" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-primary rotate-45" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleRevealComplete = () => {
    setShowNumberReveal(false);
    sessionStorage.setItem(`tv-reveal-seen-${code}`, "true");
  };

  const handleCelebrationComplete = () => {
    setCelebration(null);
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

    <div className="min-h-screen bg-background text-foreground tv-mode p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Crown className="text-primary" size={48} />
          <div>
            <h1 className="text-4xl font-black">
              <span className="text-gradient-gold">ROYAL</span> RUMBLE 2026
            </h1>
            <p className="text-muted-foreground">Party {code}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className={`text-xl font-bold ${partyStatus === "live" ? "text-success" : "text-muted-foreground"}`}>
            {partyStatus === "pre_event" ? "PRE-EVENT" : partyStatus === "live" ? "LIVE" : "COMPLETED"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="col-span-9 space-y-8">
          {partyStatus === "pre_event" ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Crown className="mx-auto text-primary mb-4 animate-pulse" size={80} />
                <h2 className="text-3xl font-bold mb-2">Waiting for Event to Start</h2>
                <p className="text-muted-foreground">{players.length} players ready</p>
              </div>
            </div>
          ) : (
            <>
              {renderNumberGrid(mensNumbers, "🧔 Men's Royal Rumble")}
              {renderNumberGrid(womensNumbers, "👩 Women's Royal Rumble")}
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div className="col-span-3">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="text-primary" size={24} />
              <h2 className="text-xl font-bold">Leaderboard</h2>
            </div>
            <div className="space-y-3">
              {players.slice(0, 10).map((player, index) => (
                <motion.div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    index === 0 ? "bg-primary/20 border border-primary" : "bg-muted"
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {index + 1}
                    </span>
                    <span className="font-medium truncate max-w-[120px]">{player.display_name}</span>
                  </div>
                  <span className={`font-bold ${index === 0 ? "text-primary" : ""}`}>
                    {player.points}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Entry Overlay */}
      <AnimatePresence>
        {showOverlay?.type === "entry" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                className="text-9xl font-black text-primary mb-4"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
              >
                #{showOverlay.data.number}
              </motion.div>
              <motion.div
                className="text-5xl font-bold mb-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {showOverlay.data.wrestler}
              </motion.div>
              <motion.div
                className="text-2xl text-muted-foreground"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Owned by {showOverlay.data.owner}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
