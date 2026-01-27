import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isHostSession } from "@/lib/session";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HostHeader } from "@/components/host/HostHeader";
import { QuickActionsSheet } from "@/components/host/QuickActionsSheet";
import { ConnectionStatus } from "@/components/host/ConnectionStatus";
import { MatchScoringCard } from "@/components/host/MatchScoringCard";
import { PropScoringCard } from "@/components/host/PropScoringCard";
import { BulkPropsModal } from "@/components/host/BulkPropsModal";
import { RumbleEntryControl } from "@/components/host/RumbleEntryControl";
import { ActiveWrestlerCard } from "@/components/host/ActiveWrestlerCard";
import { EliminationModal } from "@/components/host/EliminationModal";
import { WinnerDeclarationModal } from "@/components/host/WinnerDeclarationModal";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING } from "@/lib/constants";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";

interface RumbleNumber {
  id: string;
  number: number;
  wrestler_name: string | null;
  assigned_to_player_id: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
  eliminated_by_number: number | null;
}

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface MatchResult {
  match_id: string;
  result: string;
}

interface PartyData {
  host_session_id: string;
  status: string;
}

export default function HostControl() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();

  const [party, setParty] = useState<PartyData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [mensNumbers, setMensNumbers] = useState<RumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<RumbleNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("matches");

  // Modals
  const [bulkPropsOpen, setBulkPropsOpen] = useState(false);
  const [bulkPropsType, setBulkPropsType] = useState<"mens" | "womens">("mens");
  const [eliminationTarget, setEliminationTarget] = useState<RumbleNumber | null>(null);
  const [eliminationType, setEliminationType] = useState<"mens" | "womens">("mens");
  const [winnerData, setWinnerData] = useState<{
    type: "mens" | "womens";
    number: RumbleNumber;
    ironPerson: RumbleNumber | null;
    correctPredictionCount: number;
  } | null>(null);

  // Bonus tracking
  const [mensFinalFourAwarded, setMensFinalFourAwarded] = useState(false);
  const [womensFinalFourAwarded, setWomensFinalFourAwarded] = useState(false);

  // Match started tracking (for delayed timer on #1/#2)
  const [mensMatchStarted, setMensMatchStarted] = useState(false);
  const [womensMatchStarted, setWomensMatchStarted] = useState(false);

  // Local surprise entrants (added during this session)
  const [mensSurpriseEntrants, setMensSurpriseEntrants] = useState<string[]>([]);
  const [womensSurpriseEntrants, setWomensSurpriseEntrants] = useState<string[]>([]);

  // Duration update timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    // Check PIN verification
    const storedPin = localStorage.getItem(`party_${code}_pin`);
    if (!storedPin) {
      navigate(`/host/verify-pin/${code}`);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch party data
        const { data: partyData, error } = await supabase
          .from("parties")
          .select("host_session_id, status")
          .eq("code", code)
          .single();

        if (error || !partyData) {
          toast.error("Party not found");
          navigate("/");
          return;
        }

        if (!isHostSession(partyData.host_session_id)) {
          toast.error("You are not the host of this party");
          navigate("/");
          return;
        }

        if (partyData.status === "pre_event") {
          navigate(`/host/setup/${code}`);
          return;
        }

        setParty(partyData);

        // Fetch players
        const { data: playersData } = await supabase
          .from("players")
          .select("id, display_name, points")
          .eq("party_code", code);
        if (playersData) setPlayers(playersData);

        // Fetch match results
        const { data: resultsData } = await supabase
          .from("match_results")
          .select("match_id, result")
          .eq("party_code", code);
        if (resultsData) setMatchResults(resultsData);

        // Fetch rumble numbers
        const { data: mensData } = await supabase
          .from("rumble_numbers")
          .select("*")
          .eq("party_code", code)
          .eq("rumble_type", "mens")
          .order("number");
        if (mensData) setMensNumbers(mensData);

        const { data: womensData } = await supabase
          .from("rumble_numbers")
          .select("*")
          .eq("party_code", code)
          .eq("rumble_type", "womens")
          .order("number");
        if (womensData) setWomensNumbers(womensData);

        // Check if Final Four was already awarded
        if (resultsData) {
          setMensFinalFourAwarded(resultsData.some(r => r.match_id === "mens_final_four"));
          setWomensFinalFourAwarded(resultsData.some(r => r.match_id === "womens_final_four"));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Realtime subscriptions
    const channel = supabase
      .channel(`host-control-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, async () => {
        const { data } = await supabase
          .from("match_results")
          .select("match_id, result")
          .eq("party_code", code);
        if (data) setMatchResults(data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, async () => {
        const { data: mensData } = await supabase
          .from("rumble_numbers")
          .select("*")
          .eq("party_code", code)
          .eq("rumble_type", "mens")
          .order("number");
        if (mensData) setMensNumbers(mensData);

        const { data: womensData } = await supabase
          .from("rumble_numbers")
          .select("*")
          .eq("party_code", code)
          .eq("rumble_type", "womens")
          .order("number");
        if (womensData) setWomensNumbers(womensData);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, async () => {
        const { data } = await supabase
          .from("players")
          .select("id, display_name, points")
          .eq("party_code", code);
        if (data) setPlayers(data);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate]);

  // Helper to get player name by ID
  const getPlayerName = useCallback((playerId: string | null) => {
    if (!playerId) return null;
    return players.find(p => p.id === playerId)?.display_name || null;
  }, [players]);

  // Helper to get player by ID
  const getPlayer = useCallback((playerId: string | null) => {
    if (!playerId) return null;
    return players.find(p => p.id === playerId) || null;
  }, [players]);

  // Helper to get match result
  const getMatchResult = useCallback((matchId: string) => {
    return matchResults.find(r => r.match_id === matchId)?.result || null;
  }, [matchResults]);

  // Score a match
  const handleScoreMatch = async (matchId: string, winner: string) => {
    try {
      await supabase.from("match_results").insert({
        party_code: code!,
        match_id: matchId,
        result: winner,
      });

      // Award points to correct predictions
      const { data: correctPicks } = await supabase
        .from("picks")
        .select("player_id")
        .eq("match_id", matchId)
        .eq("prediction", winner);

      if (correctPicks) {
        for (const pick of correctPicks) {
          const player = getPlayer(pick.player_id);
          if (player) {
            await supabase
              .from("players")
              .update({ points: player.points + SCORING.UNDERCARD_WINNER })
              .eq("id", pick.player_id);
          }
        }
      }

      toast.success(`${winner} wins! Points awarded.`);
    } catch (err) {
      console.error("Error scoring match:", err);
      toast.error("Failed to score match");
    }
  };

  // Reset a match result
  const handleResetMatch = async (matchId: string) => {
    try {
      await supabase
        .from("match_results")
        .delete()
        .eq("party_code", code)
        .eq("match_id", matchId);
      toast.success("Match result reset");
    } catch (err) {
      console.error("Error resetting match:", err);
      toast.error("Failed to reset match");
    }
  };

  // Score a prop
  const handleScoreProp = async (propId: string, answer: "YES" | "NO") => {
    try {
      await supabase.from("match_results").insert({
        party_code: code!,
        match_id: propId,
        result: answer,
      });

      // Award points to correct predictions
      const { data: correctPicks } = await supabase
        .from("picks")
        .select("player_id")
        .eq("match_id", propId)
        .eq("prediction", answer);

      if (correctPicks) {
        for (const pick of correctPicks) {
          const player = getPlayer(pick.player_id);
          if (player) {
            await supabase
              .from("players")
              .update({ points: player.points + SCORING.PROP_BET })
              .eq("id", pick.player_id);
          }
        }
      }

      toast.success(`Prop scored: ${answer}`);
    } catch (err) {
      console.error("Error scoring prop:", err);
      toast.error("Failed to score prop");
    }
  };

  // Bulk score props
  const handleBulkScoreProps = async (answers: Record<string, "YES" | "NO">) => {
    try {
      const prefix = bulkPropsType === "mens" ? "mens_chaos_" : "womens_chaos_";
      
      for (const [propId, answer] of Object.entries(answers)) {
        const matchId = `${prefix}${propId}`;
        await supabase.from("match_results").insert({
          party_code: code!,
          match_id: matchId,
          result: answer,
        });

        // Award points
        const { data: correctPicks } = await supabase
          .from("picks")
          .select("player_id")
          .eq("match_id", matchId)
          .eq("prediction", answer);

        if (correctPicks) {
          for (const pick of correctPicks) {
            const player = getPlayer(pick.player_id);
            if (player) {
              await supabase
                .from("players")
                .update({ points: player.points + SCORING.PROP_BET })
                .eq("id", pick.player_id);
            }
          }
        }
      }

      toast.success("All props scored!");
    } catch (err) {
      console.error("Error bulk scoring props:", err);
      toast.error("Failed to score props");
    }
  };

  // Confirm wrestler entry
  const handleConfirmEntry = async (type: "mens" | "womens", wrestlerName: string) => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const matchStarted = type === "mens" ? mensMatchStarted : womensMatchStarted;
    const enteredCount = numbers.filter(n => n.wrestler_name).length;
    const nextNumber = enteredCount + 1;
    const numberRecord = numbers.find(n => n.number === nextNumber);

    if (!numberRecord) {
      toast.error("Invalid number");
      return;
    }

    // For #1 and #2, only set timestamp if match has started
    // For #3+, always set timestamp (match must have started by then)
    const shouldSetTimestamp = matchStarted || nextNumber > 2;

    try {
      await supabase
        .from("rumble_numbers")
        .update({
          wrestler_name: wrestlerName,
          entry_timestamp: shouldSetTimestamp ? new Date().toISOString() : null,
        })
        .eq("id", numberRecord.id);

      toast.success(`#${nextNumber} ${wrestlerName} has entered!`);
    } catch (err) {
      console.error("Error confirming entry:", err);
      toast.error("Failed to confirm entry");
    }
  };

  // Start match handler - sets timestamp for pending entries
  const handleStartMatch = async (type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const now = new Date().toISOString();

    try {
      // Find all entries that have a wrestler but no timestamp
      const pendingEntries = numbers.filter(n => n.wrestler_name && !n.entry_timestamp);

      for (const entry of pendingEntries) {
        await supabase
          .from("rumble_numbers")
          .update({ entry_timestamp: now })
          .eq("id", entry.id);
      }

      if (type === "mens") {
        setMensMatchStarted(true);
      } else {
        setWomensMatchStarted(true);
      }

      toast.success(`${type === "mens" ? "Men's" : "Women's"} Rumble has begun! 🔔`);
    } catch (err) {
      console.error("Error starting match:", err);
      toast.error("Failed to start match");
    }
  };

  // Add surprise entrant handler
  const handleAddSurprise = (type: "mens" | "womens", name: string) => {
    if (type === "mens") {
      setMensSurpriseEntrants(prev => [...prev, name]);
    } else {
      setWomensSurpriseEntrants(prev => [...prev, name]);
    }
    toast.success(`${name} added as surprise entrant!`);
  };

  // Handle elimination
  const handleElimination = async (eliminatedByNumber: number) => {
    if (!eliminationTarget) return;

    const type = eliminationType;
    const numbers = type === "mens" ? mensNumbers : womensNumbers;

    try {
      const now = new Date();
      
      // Update the eliminated wrestler
      await supabase
        .from("rumble_numbers")
        .update({
          elimination_timestamp: now.toISOString(),
          eliminated_by_number: eliminatedByNumber,
        })
        .eq("id", eliminationTarget.id);

      // Calculate duration for Jobber Penalty
      const entryTime = new Date(eliminationTarget.entry_timestamp!).getTime();
      const durationSeconds = (now.getTime() - entryTime) / 1000;

      // Award elimination points to eliminator's owner
      const eliminator = numbers.find(n => n.number === eliminatedByNumber);
      if (eliminator?.assigned_to_player_id) {
        const player = getPlayer(eliminator.assigned_to_player_id);
        if (player) {
          await supabase
            .from("players")
            .update({ points: player.points + SCORING.ELIMINATION })
            .eq("id", player.id);
          toast.success(`+${SCORING.ELIMINATION} pts for elimination!`);
        }
      }

      // Check for Jobber Penalty (eliminated in under 60 seconds)
      if (durationSeconds < 60 && eliminationTarget.assigned_to_player_id) {
        const player = getPlayer(eliminationTarget.assigned_to_player_id);
        if (player) {
          await supabase
            .from("players")
            .update({ points: player.points + SCORING.JOBBER_PENALTY })
            .eq("id", player.id);
          toast.warning(`Jobber Penalty! ${player.display_name} loses 10 pts (under 60s)`);
        }
      }

      // Check for Final Four
      const activeAfterElimination = numbers.filter(n => 
        n.entry_timestamp && 
        !n.elimination_timestamp && 
        n.id !== eliminationTarget.id
      ).length;

      const finalFourAwarded = type === "mens" ? mensFinalFourAwarded : womensFinalFourAwarded;
      
      if (activeAfterElimination === 4 && !finalFourAwarded) {
        const finalFourNumbers = numbers.filter(n => 
          n.entry_timestamp && 
          !n.elimination_timestamp && 
          n.id !== eliminationTarget.id
        );

        for (const num of finalFourNumbers) {
          if (num.assigned_to_player_id) {
            const player = getPlayer(num.assigned_to_player_id);
            if (player) {
              await supabase
                .from("players")
                .update({ points: player.points + SCORING.FINAL_FOUR })
                .eq("id", player.id);
            }
          }
        }

        // Record Final Four event
        await supabase.from("match_results").insert({
          party_code: code!,
          match_id: `${type}_final_four`,
          result: finalFourNumbers.map(n => `#${n.number}`).join(","),
        });

        if (type === "mens") setMensFinalFourAwarded(true);
        else setWomensFinalFourAwarded(true);

        toast.success("Final Four! +10 pts to each remaining owner!");
      }

      // Check for winner (last one standing)
      if (activeAfterElimination === 1) {
        const winner = numbers.find(n => 
          n.entry_timestamp && 
          !n.elimination_timestamp && 
          n.id !== eliminationTarget.id
        );

        if (winner) {
          // Calculate Iron Man/Woman
          const durationsWithEntries = numbers
            .filter(n => n.entry_timestamp)
            .map(n => ({
              ...n,
              duration: n.elimination_timestamp
                ? new Date(n.elimination_timestamp).getTime() - new Date(n.entry_timestamp!).getTime()
                : now.getTime() - new Date(n.entry_timestamp!).getTime(),
            }));

          const ironPerson = durationsWithEntries.reduce((max, n) => 
            n.duration > (max?.duration || 0) ? n : max
          , null as (RumbleNumber & { duration: number }) | null);

          // Count correct predictions
          const { count: correctPredictionCount } = await supabase
            .from("picks")
            .select("*", { count: "exact", head: true })
            .eq("match_id", type === "mens" ? "mens_rumble_winner" : "womens_rumble_winner")
            .eq("prediction", winner.wrestler_name);

          setWinnerData({
            type,
            number: winner,
            ironPerson: ironPerson as RumbleNumber | null,
            correctPredictionCount: correctPredictionCount || 0,
          });
        }
      }

      setEliminationTarget(null);
    } catch (err) {
      console.error("Error handling elimination:", err);
      toast.error("Failed to record elimination");
    }
  };

  // Confirm winner and award points
  const handleConfirmWinner = async () => {
    if (!winnerData) return;

    try {
      const { type, number: winner, ironPerson } = winnerData;

      // Award points to number owner
      if (winner.assigned_to_player_id) {
        const { data: freshPlayer } = await supabase
          .from("players")
          .select("points")
          .eq("id", winner.assigned_to_player_id)
          .single();
        
        if (freshPlayer) {
          await supabase
            .from("players")
            .update({ points: freshPlayer.points + SCORING.RUMBLE_WINNER_NUMBER })
            .eq("id", winner.assigned_to_player_id);
        }
      }

      // Award Iron Man/Woman points
      if (ironPerson?.assigned_to_player_id) {
        const { data: freshPlayer } = await supabase
          .from("players")
          .select("points")
          .eq("id", ironPerson.assigned_to_player_id)
          .single();
        
        if (freshPlayer) {
          await supabase
            .from("players")
            .update({ points: freshPlayer.points + SCORING.IRON_MAN })
            .eq("id", ironPerson.assigned_to_player_id);
        }
      }

      // Award correct prediction points
      const matchId = type === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
      const { data: correctPicks } = await supabase
        .from("picks")
        .select("player_id")
        .eq("match_id", matchId)
        .eq("prediction", winner.wrestler_name);

      if (correctPicks) {
        for (const pick of correctPicks) {
          const { data: freshPlayer } = await supabase
            .from("players")
            .select("points")
            .eq("id", pick.player_id)
            .single();
          
          if (freshPlayer) {
            await supabase
              .from("players")
              .update({ points: freshPlayer.points + SCORING.RUMBLE_WINNER_PICK })
              .eq("id", pick.player_id);
          }
        }
      }

      // Record the result
      await supabase.from("match_results").insert({
        party_code: code!,
        match_id: matchId,
        result: winner.wrestler_name!,
      });

      toast.success(`${winner.wrestler_name} is the ${type === "mens" ? "Men's" : "Women's"} Royal Rumble Winner! 🏆`);
      setWinnerData(null);
    } catch (err) {
      console.error("Error confirming winner:", err);
      toast.error("Failed to award winner points");
    }
  };

  // Computed values
  const mensActiveWrestlers = useMemo(() => {
    return mensNumbers
      .filter(n => n.entry_timestamp && !n.elimination_timestamp)
      .sort((a, b) => new Date(b.entry_timestamp!).getTime() - new Date(a.entry_timestamp!).getTime());
  }, [mensNumbers]);

  const womensActiveWrestlers = useMemo(() => {
    return womensNumbers
      .filter(n => n.entry_timestamp && !n.elimination_timestamp)
      .sort((a, b) => new Date(b.entry_timestamp!).getTime() - new Date(a.entry_timestamp!).getTime());
  }, [womensNumbers]);

  // Count entered as wrestlers with names (not just timestamps, since #1/#2 may not have timestamp yet)
  const mensEnteredCount = mensNumbers.filter(n => n.wrestler_name).length;
  const womensEnteredCount = womensNumbers.filter(n => n.wrestler_name).length;

  const mensNextNumber = mensEnteredCount + 1;
  const womensNextNumber = womensEnteredCount + 1;

  const mensNextOwner = getPlayerName(mensNumbers.find(n => n.number === mensNextNumber)?.assigned_to_player_id || null);
  const womensNextOwner = getPlayerName(womensNumbers.find(n => n.number === womensNextNumber)?.assigned_to_player_id || null);

  // Combine platform entrants with surprise entrants
  const allMensEntrants = useMemo(() => [...mensEntrants, ...mensSurpriseEntrants], [mensEntrants, mensSurpriseEntrants]);
  const allWomensEntrants = useMemo(() => [...womensEntrants, ...womensSurpriseEntrants], [womensEntrants, womensSurpriseEntrants]);

  // Calculate durations for active wrestlers (handle null timestamp)
  const getDuration = (entryTimestamp: string | null) => {
    if (!entryTimestamp) return 0;
    return Math.floor((Date.now() - new Date(entryTimestamp).getTime()) / 1000);
  };

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <ConnectionStatus isConnected={isConnected} />
      <HostHeader code={code!} onMenuClick={() => setMenuOpen(true)} />
      <QuickActionsSheet open={menuOpen} onOpenChange={setMenuOpen} code={code!} />

      <div className="max-w-lg mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="props">Props</TabsTrigger>
            <TabsTrigger value="mens" className="relative">
              Men's
              {mensActiveWrestlers.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              )}
            </TabsTrigger>
            <TabsTrigger value="womens" className="relative">
              Women's
              {womensActiveWrestlers.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-3">
            <h2 className="text-lg font-bold mb-4">Undercard Matches</h2>
            {UNDERCARD_MATCHES.map((match) => (
              <MatchScoringCard
                key={match.id}
                matchId={match.id}
                title={match.title}
                options={match.options}
                scoredResult={getMatchResult(match.id)}
                onScore={handleScoreMatch}
                onReset={handleResetMatch}
              />
            ))}
          </TabsContent>

          {/* Props Tab */}
          <TabsContent value="props" className="space-y-6">
            {/* Men's Props */}
            <section>
              <h3 className="font-bold mb-4">Men's Rumble Props</h3>
              <div className="space-y-3">
                {CHAOS_PROPS.map((prop) => {
                  const matchId = `mens_chaos_${prop.id}`;
                  const result = getMatchResult(matchId);
                  return (
                    <PropScoringCard
                      key={matchId}
                      propId={matchId}
                      title={prop.shortName}
                      question={prop.question}
                      scoredResult={result as "YES" | "NO" | null}
                      onScore={handleScoreProp}
                    />
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setBulkPropsType("mens");
                  setBulkPropsOpen(true);
                }}
              >
                Score All Men's Props at Once
              </Button>
            </section>

            {/* Women's Props */}
            <section>
              <h3 className="font-bold mb-4">Women's Rumble Props</h3>
              <div className="space-y-3">
                {CHAOS_PROPS.map((prop) => {
                  const matchId = `womens_chaos_${prop.id}`;
                  const result = getMatchResult(matchId);
                  return (
                    <PropScoringCard
                      key={matchId}
                      propId={matchId}
                      title={prop.shortName}
                      question={prop.question}
                      scoredResult={result as "YES" | "NO" | null}
                      onScore={handleScoreProp}
                    />
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setBulkPropsType("womens");
                  setBulkPropsOpen(true);
                }}
              >
                Score All Women's Props at Once
              </Button>
            </section>
          </TabsContent>

          {/* Men's Rumble Tab */}
          <TabsContent value="mens" className="space-y-4">
            <RumbleEntryControl
              nextNumber={mensNextNumber}
              ownerName={mensNextOwner}
              entrants={allMensEntrants}
              enteredCount={mensEnteredCount}
              onConfirmEntry={(wrestler) => handleConfirmEntry("mens", wrestler)}
              matchStarted={mensMatchStarted}
              onStartMatch={() => handleStartMatch("mens")}
              onAddSurprise={(name) => handleAddSurprise("mens", name)}
            />

            <div className="space-y-2">
              <h3 className="font-bold flex items-center justify-between">
                Active Wrestlers
                <span className="text-sm font-normal text-muted-foreground">
                  ({mensActiveWrestlers.length})
                </span>
              </h3>
              {mensActiveWrestlers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No wrestlers in the ring yet
                </p>
              ) : (
                mensActiveWrestlers.map((wrestler) => (
                  <ActiveWrestlerCard
                    key={wrestler.id}
                    number={wrestler.number}
                    wrestlerName={wrestler.wrestler_name || "Unknown"}
                    ownerName={getPlayerName(wrestler.assigned_to_player_id)}
                    duration={getDuration(wrestler.entry_timestamp!)}
                    onEliminate={() => {
                      setEliminationTarget(wrestler);
                      setEliminationType("mens");
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Women's Rumble Tab */}
          <TabsContent value="womens" className="space-y-4">
            <RumbleEntryControl
              nextNumber={womensNextNumber}
              ownerName={womensNextOwner}
              entrants={allWomensEntrants}
              enteredCount={womensEnteredCount}
              onConfirmEntry={(wrestler) => handleConfirmEntry("womens", wrestler)}
              matchStarted={womensMatchStarted}
              onStartMatch={() => handleStartMatch("womens")}
              onAddSurprise={(name) => handleAddSurprise("womens", name)}
            />

            <div className="space-y-2">
              <h3 className="font-bold flex items-center justify-between">
                Active Wrestlers
                <span className="text-sm font-normal text-muted-foreground">
                  ({womensActiveWrestlers.length})
                </span>
              </h3>
              {womensActiveWrestlers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No wrestlers in the ring yet
                </p>
              ) : (
                womensActiveWrestlers.map((wrestler) => (
                  <ActiveWrestlerCard
                    key={wrestler.id}
                    number={wrestler.number}
                    wrestlerName={wrestler.wrestler_name || "Unknown"}
                    ownerName={getPlayerName(wrestler.assigned_to_player_id)}
                    duration={getDuration(wrestler.entry_timestamp!)}
                    onEliminate={() => {
                      setEliminationTarget(wrestler);
                      setEliminationType("womens");
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <BulkPropsModal
        open={bulkPropsOpen}
        onOpenChange={setBulkPropsOpen}
        type={bulkPropsType}
        onSubmit={handleBulkScoreProps}
      />

      <EliminationModal
        open={!!eliminationTarget}
        onOpenChange={(open) => !open && setEliminationTarget(null)}
        targetNumber={eliminationTarget?.number || 0}
        targetWrestler={eliminationTarget?.wrestler_name || ""}
        activeWrestlers={(eliminationType === "mens" ? mensActiveWrestlers : womensActiveWrestlers).map(w => ({
          number: w.number,
          wrestler_name: w.wrestler_name || "",
          ownerName: getPlayerName(w.assigned_to_player_id),
        }))}
        onConfirm={handleElimination}
      />

      {winnerData && (
        <WinnerDeclarationModal
          open={!!winnerData}
          onOpenChange={(open) => !open && setWinnerData(null)}
          type={winnerData.type}
          winnerNumber={winnerData.number.number}
          winnerName={winnerData.number.wrestler_name || ""}
          ownerName={getPlayerName(winnerData.number.assigned_to_player_id)}
          ironPersonName={winnerData.ironPerson ? getPlayerName(winnerData.ironPerson.assigned_to_player_id) : null}
          correctPredictionCount={winnerData.correctPredictionCount}
          onConfirm={handleConfirmWinner}
        />
      )}
    </div>
  );
}
