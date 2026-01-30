import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HostHeader } from "@/components/host/HostHeader";
import { QuickActionsSheet } from "@/components/host/QuickActionsSheet";
import { ConnectionStatus } from "@/components/host/ConnectionStatus";
import { MatchScoringCard } from "@/components/host/MatchScoringCard";
import { PropScoringCard } from "@/components/host/PropScoringCard";
import { RumblePropScoringCard } from "@/components/host/RumblePropScoringCard";
import { BulkPropsModal } from "@/components/host/BulkPropsModal";
import { RumbleEntryControl } from "@/components/host/RumbleEntryControl";
import { ActiveWrestlerCard } from "@/components/host/ActiveWrestlerCard";
import { EliminationModal } from "@/components/host/EliminationModal";
import { WinnerDeclarationModal } from "@/components/host/WinnerDeclarationModal";
import { FinalFourConfirmationModal } from "@/components/host/FinalFourConfirmationModal";
import { CollapsibleSection } from "@/components/host/CollapsibleSection";
import { FixedTabNavigation } from "@/components/host/FixedTabNavigation";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING, MATCH_IDS } from "@/lib/constants";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { Sparkles } from "lucide-react";

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
  status: string;
}

const TAB_ORDER = ["matches", "props", "mens", "womens"];

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
  
  // Final Four confirmation modal
  const [finalFourConfirmation, setFinalFourConfirmation] = useState<{
    type: "mens" | "womens";
    wrestlers: { number: number; wrestler_name: string; ownerName: string }[];
    correctPredictionCount: number;
  } | null>(null);

  // Match started tracking (for delayed timer on #1/#2)
  const [mensMatchStarted, setMensMatchStarted] = useState(false);
  const [womensMatchStarted, setWomensMatchStarted] = useState(false);

  // Local surprise entrants (added during this session)
  const [mensSurpriseEntrants, setMensSurpriseEntrants] = useState<string[]>([]);
  const [womensSurpriseEntrants, setWomensSurpriseEntrants] = useState<string[]>([]);

  // Duration update timer - optimized to only update currentTime
  // Child components use this via getDuration() which is memoized per wrestler
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Tab navigation helpers
  const currentTabIndex = TAB_ORDER.indexOf(activeTab);
  const handleTabNavigate = (direction: -1 | 1) => {
    const newIndex = currentTabIndex + direction;
    if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
      setActiveTab(TAB_ORDER[newIndex]);
    }
  };

  // Fetch data
  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    // For authenticated users, auto-set verification status
    // The real security is now auth.uid() matching host_user_id in RLS
    const storedPin = localStorage.getItem(`party_${code}_pin`);
    if (!storedPin) {
      // Auto-verify for authenticated users accessing their party
      localStorage.setItem(`party_${code}_pin`, "verified");
    }

    const fetchData = async () => {
      try {
        // Verify host access via session
        const session = getPlayerSession();
        if (!session?.isHost || session.partyCode !== code) {
          toast.error("You are not the host of this group");
          navigate("/my-parties");
          return;
        }

        // Fetch party data from public view (definer permissions bypass RLS)
        const { data: partyData, error } = await supabase
          .from("parties_public")
          .select("status")
          .eq("code", code)
          .single();

        if (error || !partyData) {
          toast.error("Group not found");
          navigate("/");
          return;
        }

        // Redirect if event hasn't started yet
        if (partyData.status === "pre_event") {
          navigate(`/host/setup/${code}`);
          return;
        }

        setParty(partyData);

        // Fetch players (use public view to avoid exposing sensitive data)
        const { data: playersData } = await supabase
          .from("players_public")
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
          .from("players_public")
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

  // Auto-detect winner on page load when match is complete but winner not declared
  useEffect(() => {
    const checkForUnclaimedWinner = async (type: "mens" | "womens") => {
      const numbers = type === "mens" ? mensNumbers : womensNumbers;
      const entered = numbers.filter(n => n.wrestler_name);
      const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
      const matchId = type === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
      const alreadyDeclared = matchResults.find(r => r.match_id === matchId);
      
      // Only trigger if: all 30 entered, exactly 1 active, no winner declared, no modal already showing
      if (entered.length === 30 && active.length === 1 && !alreadyDeclared && !winnerData) {
        const winner = active[0];
        
        // Calculate Iron Man/Woman (longest duration)
        const now = new Date();
        const durationsWithEntries = numbers
          .filter(n => n.entry_timestamp)
          .map(n => ({
            ...n,
            duration: n.elimination_timestamp
              ? new Date(n.elimination_timestamp).getTime() - new Date(n.entry_timestamp!).getTime()
              : now.getTime() - new Date(n.entry_timestamp!).getTime(),
          }));

        const ironPerson = durationsWithEntries.length > 0
          ? durationsWithEntries.reduce((max, n) => 
              n.duration > (max?.duration || 0) ? n : max
            , null as (RumbleNumber & { duration: number }) | null)
          : null;

        // Count correct predictions
        const { count: correctPredictionCount } = await supabase
          .from("picks")
          .select("*", { count: "exact", head: true })
          .eq("match_id", matchId)
          .eq("prediction", winner.wrestler_name);

        setWinnerData({
          type,
          number: winner,
          ironPerson: ironPerson as RumbleNumber | null,
          correctPredictionCount: correctPredictionCount || 0,
        });
      }
    };

    // Only check if we have data loaded
    if (mensNumbers.length > 0 && !isLoading) {
      checkForUnclaimedWinner("mens");
    }
    if (womensNumbers.length > 0 && !isLoading) {
      checkForUnclaimedWinner("womens");
    }
  }, [mensNumbers, womensNumbers, matchResults, winnerData, isLoading]);

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

  // Score a Rumble prop (wrestler-based)
  const handleScoreRumbleProp = async (propId: string, answer: string) => {
    try {
      await supabase.from("match_results").insert({
        party_code: code!,
        match_id: propId,
        result: answer,
      });

      // Award points based on prop type
      let points: number = SCORING.PROP_BET;
      if (propId.includes("most_eliminations") || propId.includes("longest_time")) {
        points = SCORING.MOST_ELIMINATIONS;
      } else if (propId.includes("entrant_1") || propId.includes("entrant_30")) {
        points = SCORING.ENTRANT_GUESS;
      } else if (propId.includes("first_elimination") || propId.includes("no_show")) {
        points = SCORING.FIRST_ELIMINATION;
      } else if (propId.includes("final_four")) {
        points = SCORING.FINAL_FOUR_PICK;
      }

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
              .update({ points: player.points + points })
              .eq("id", pick.player_id);
          }
        }
      }

      toast.success(`Rumble prop scored: ${answer}`);
    } catch (err) {
      console.error("Error scoring rumble prop:", err);
      toast.error("Failed to score prop");
    }
  };

  // Reset a Rumble prop result
  const handleResetRumbleProp = async (propId: string) => {
    try {
      await supabase
        .from("match_results")
        .delete()
        .eq("party_code", code)
        .eq("match_id", propId);
      toast.success("Prop result reset");
    } catch (err) {
      console.error("Error resetting prop:", err);
      toast.error("Failed to reset prop");
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

  // Show Final Four confirmation dialog
  const handleShowFinalFourConfirmation = async (type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);

    if (active.length !== 4) {
      toast.error("Final Four not yet reached - need exactly 4 active wrestlers");
      return;
    }

    const finalFourNames = active.map(n => n.wrestler_name).filter(Boolean) as string[];

    // Check if any slot is already scored
    const alreadyScored = [1, 2, 3, 4].some(slot => 
      getMatchResult(`${type}_final_four_${slot}`)
    );

    if (alreadyScored) {
      toast.error("Final Four predictions already scored");
      return;
    }

    // Calculate how many players have at least one correct Final Four pick
    // A pick is correct if it matches ANY of the 4 final four wrestlers
    const matchId = type === "mens" ? "mens_rumble_winner" : "womens_rumble_winner";
    const { data: allFinalFourPicks } = await supabase
      .from("picks")
      .select("player_id, match_id, prediction")
      .like("match_id", `${type}_final_four_%`);
    
    const playersWithCorrectPicks = new Set<string>();
    allFinalFourPicks?.forEach(pick => {
      if (finalFourNames.includes(pick.prediction)) {
        playersWithCorrectPicks.add(pick.player_id);
      }
    });

    setFinalFourConfirmation({
      type,
      wrestlers: active.map(n => ({
        number: n.number,
        wrestler_name: n.wrestler_name || "Unknown",
        ownerName: getPlayerName(n.assigned_to_player_id),
      })),
      correctPredictionCount: playersWithCorrectPicks.size,
    });
  };

  // Execute Final Four scoring after confirmation
  const handleConfirmFinalFourScoring = async () => {
    if (!finalFourConfirmation) return;

    const { type, wrestlers } = finalFourConfirmation;
    const finalFourNames = wrestlers.map(w => w.wrestler_name);

    try {
      // Fetch all Final Four picks for this type
      const { data: allFinalFourPicks } = await supabase
        .from("picks")
        .select("player_id, match_id, prediction")
        .like("match_id", `${type}_final_four_%`);

      // Record the actual Final Four wrestlers in match_results for each slot
      for (let slot = 1; slot <= 4; slot++) {
        const propId = `${type}_final_four_${slot}`;
        const wrestler = finalFourNames[slot - 1];
        if (wrestler) {
          await supabase.from("match_results").insert({
            party_code: code!,
            match_id: propId,
            result: wrestler,
          });
        }
      }

      // Award points: For each player's pick, check if it matches ANY of the final four
      // Group picks by player
      const picksByPlayer = new Map<string, string[]>();
      allFinalFourPicks?.forEach(pick => {
        const existing = picksByPlayer.get(pick.player_id) || [];
        existing.push(pick.prediction);
        picksByPlayer.set(pick.player_id, existing);
      });

      // Award points for each correct pick - fetch fresh player data for each update
      for (const [playerId, picks] of picksByPlayer) {
        const correctPicks = picks.filter(pick => finalFourNames.includes(pick));
        if (correctPicks.length > 0) {
          const pointsToAward = correctPicks.length * SCORING.FINAL_FOUR_PICK;
          
          // Fetch fresh player data to avoid race condition
          const { data: freshPlayer } = await supabase
            .from("players")
            .select("points")
            .eq("id", playerId)
            .single();
          
          if (freshPlayer) {
            await supabase
              .from("players")
              .update({ points: freshPlayer.points + pointsToAward })
              .eq("id", playerId);
          }
        }
      }

      toast.success(`${type === "mens" ? "Men's" : "Women's"} Final Four predictions scored!`);
      setFinalFourConfirmation(null);
    } catch (err) {
      console.error("Error scoring Final Four:", err);
      toast.error("Failed to score Final Four predictions");
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

  // Computed values - show wrestlers with names as "active" even before match starts
  const mensActiveWrestlers = useMemo(() => {
    return mensNumbers
      .filter(n => n.wrestler_name && !n.elimination_timestamp)
      .sort((a, b) => {
        // Sort by entry timestamp if available, otherwise by number
        if (a.entry_timestamp && b.entry_timestamp) {
          return new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime();
        }
        return b.number - a.number;
      });
  }, [mensNumbers]);

  const womensActiveWrestlers = useMemo(() => {
    return womensNumbers
      .filter(n => n.wrestler_name && !n.elimination_timestamp)
      .sort((a, b) => {
        if (a.entry_timestamp && b.entry_timestamp) {
          return new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime();
        }
        return b.number - a.number;
      });
  }, [womensNumbers]);

  // Count entered as wrestlers with names (not just timestamps, since #1/#2 may not have timestamp yet)
  const mensEnteredCount = mensNumbers.filter(n => n.wrestler_name).length;
  const womensEnteredCount = womensNumbers.filter(n => n.wrestler_name).length;

  const mensNextNumber = mensEnteredCount + 1;
  const womensNextNumber = womensEnteredCount + 1;

  const mensNextOwner = getPlayerName(mensNumbers.find(n => n.number === mensNextNumber)?.assigned_to_player_id || null);
  const womensNextOwner = getPlayerName(womensNumbers.find(n => n.number === womensNextNumber)?.assigned_to_player_id || null);

  // Combine platform entrants with surprise entrants, filtering out already-entered wrestlers
  const allMensEntrants = useMemo(() => {
    const enteredNames = new Set(
      mensNumbers
        .filter(n => n.wrestler_name)
        .map(n => n.wrestler_name!.toLowerCase())
    );
    return [...mensEntrants, ...mensSurpriseEntrants]
      .filter(name => !enteredNames.has(name.toLowerCase()));
  }, [mensEntrants, mensSurpriseEntrants, mensNumbers]);

  const allWomensEntrants = useMemo(() => {
    const enteredNames = new Set(
      womensNumbers
        .filter(n => n.wrestler_name)
        .map(n => n.wrestler_name!.toLowerCase())
    );
    return [...womensEntrants, ...womensSurpriseEntrants]
      .filter(name => !enteredNames.has(name.toLowerCase()));
  }, [womensEntrants, womensSurpriseEntrants, womensNumbers]);

  // Calculate durations for active wrestlers (handle null timestamp)
  // Uses currentTime state to trigger re-renders only when timer updates
  const getDuration = useCallback((entryTimestamp: string | null) => {
    if (!entryTimestamp) return 0;
    return Math.floor((currentTime - new Date(entryTimestamp).getTime()) / 1000);
  }, [currentTime]);

  // Get elimination count for a wrestler by their number
  const getEliminationCount = useCallback((number: number, type: "mens" | "womens") => {
    const numbers = type === "mens" ? mensNumbers : womensNumbers;
    return numbers.filter(n => n.eliminated_by_number === number).length;
  }, [mensNumbers, womensNumbers]);

  // Derive Rumble prop values from match data
  const getDerivedPropValues = useCallback((numbers: RumbleNumber[], type: "mens" | "womens", results: MatchResult[]) => {
    // #1 Entrant - whoever is assigned to number 1
    const entrant1 = numbers.find(n => n.number === 1)?.wrestler_name || null;
    
    // #30 Entrant - whoever is assigned to number 30
    const entrant30 = numbers.find(n => n.number === 30)?.wrestler_name || null;
    
    // First Elimination - first wrestler to be eliminated (earliest elimination_timestamp)
    const eliminated = numbers.filter(n => n.elimination_timestamp);
    const firstEliminated = eliminated.length > 0
      ? eliminated.reduce((first, n) => {
          if (!first.elimination_timestamp) return n;
          return new Date(n.elimination_timestamp!).getTime() < new Date(first.elimination_timestamp).getTime() ? n : first;
        })
      : null;
    const firstElimination = firstEliminated?.wrestler_name || null;
    
    // Most Eliminations - wrestler with most eliminations (by eliminated_by_number)
    const eliminationCounts = new Map<number, number>();
    eliminated.forEach(n => {
      if (n.eliminated_by_number) {
        eliminationCounts.set(n.eliminated_by_number, (eliminationCounts.get(n.eliminated_by_number) || 0) + 1);
      }
    });
    let mostEliminationsNumber: number | null = null;
    let maxElims = 0;
    eliminationCounts.forEach((count, num) => {
      if (count > maxElims) {
        maxElims = count;
        mostEliminationsNumber = num;
      }
    });
    const mostEliminationsWrestler = mostEliminationsNumber 
      ? numbers.find(n => n.number === mostEliminationsNumber)?.wrestler_name || null
      : null;
    
    // Iron Man/Woman - longest time in ring (only calculable when match is complete or we have eliminations)
    const withDurations = numbers
      .filter(n => n.entry_timestamp)
      .map(n => ({
        ...n,
        duration: n.elimination_timestamp
          ? new Date(n.elimination_timestamp).getTime() - new Date(n.entry_timestamp!).getTime()
          : Date.now() - new Date(n.entry_timestamp!).getTime(),
      }));
    const longestSurvivor = withDurations.length > 0
      ? withDurations.reduce((max, n) => n.duration > max.duration ? n : max)
      : null;
    // Only show Iron Man if we have at least some eliminations (match in progress)
    const ironMan = eliminated.length > 0 ? longestSurvivor?.wrestler_name || null : null;
    
    // Final Four - check if already recorded in match_results first
    const finalFourResult = results.find(r => r.match_id === `${type}_final_four`);
    if (finalFourResult) {
      // Parse the stored result (format: "#1,#16,#26,#30")
      const numberStrings = finalFourResult.result.split(",");
      const finalFourWrestlers = numberStrings.map(numStr => {
        const num = parseInt(numStr.replace("#", ""));
        return numbers.find(n => n.number === num)?.wrestler_name || null;
      }).filter(Boolean) as string[];
      
      return {
        [`${type}_entrant_1`]: entrant1,
        [`${type}_entrant_30`]: entrant30,
        [`${type}_first_elimination`]: firstElimination,
        [`${type}_most_eliminations`]: mostEliminationsWrestler,
        [`${type}_longest_time`]: ironMan,
        [`${type}_final_four`]: finalFourWrestlers.join(", "),
        [`${type}_final_four_1`]: finalFourWrestlers[0] || null,
        [`${type}_final_four_2`]: finalFourWrestlers[1] || null,
        [`${type}_final_four_3`]: finalFourWrestlers[2] || null,
        [`${type}_final_four_4`]: finalFourWrestlers[3] || null,
      };
    }
    
    // Fall back to live detection when exactly 4 active
    const active = numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
    const finalFourArray = active.length === 4 
      ? active.map(n => n.wrestler_name).filter(Boolean) as string[]
      : [];
    
    return {
      [`${type}_entrant_1`]: entrant1,
      [`${type}_entrant_30`]: entrant30,
      [`${type}_first_elimination`]: firstElimination,
      [`${type}_most_eliminations`]: mostEliminationsWrestler,
      [`${type}_longest_time`]: ironMan,
      [`${type}_final_four`]: finalFourArray.length === 4 ? finalFourArray.join(", ") : null,
      [`${type}_final_four_1`]: finalFourArray[0] || null,
      [`${type}_final_four_2`]: finalFourArray[1] || null,
      [`${type}_final_four_3`]: finalFourArray[2] || null,
      [`${type}_final_four_4`]: finalFourArray[3] || null,
    };
  }, []);

  const mensDerivedProps = useMemo(() => getDerivedPropValues(mensNumbers, "mens", matchResults), [mensNumbers, matchResults, getDerivedPropValues]);
  const womensDerivedProps = useMemo(() => getDerivedPropValues(womensNumbers, "womens", matchResults), [womensNumbers, matchResults, getDerivedPropValues]);

  // Calculate section stats for collapsible headers
  const getMatchesSectionStats = () => {
    let scored = 0;
    let points = 0;
    UNDERCARD_MATCHES.forEach(match => {
      if (getMatchResult(match.id)) {
        scored++;
        points += SCORING.UNDERCARD_WINNER;
      }
    });
    return { scored, total: UNDERCARD_MATCHES.length, points };
  };

  const getMensRumblePropsStats = () => {
    const propIds = [
      MATCH_IDS.MENS_ENTRANT_1,
      MATCH_IDS.MENS_ENTRANT_30,
      MATCH_IDS.MENS_FIRST_ELIMINATION,
      MATCH_IDS.MENS_MOST_ELIMINATIONS,
      MATCH_IDS.MENS_LONGEST_TIME,
    ];
    let scored = 0;
    let points = 0;
    propIds.forEach(id => {
      if (getMatchResult(id)) {
        scored++;
        points += SCORING.PROP_BET;
      }
    });
    return { scored, total: propIds.length, points };
  };

  const getMensFinalFourStats = () => {
    const slots = [1, 2, 3, 4];
    let scored = 0;
    let points = 0;
    slots.forEach(slot => {
      if (getMatchResult(`mens_final_four_${slot}`)) {
        scored++;
        points += SCORING.FINAL_FOUR_PICK;
      }
    });
    return { scored, total: 4, points };
  };

  const getMensChaosPropsStats = () => {
    let scored = 0;
    let points = 0;
    CHAOS_PROPS.forEach(prop => {
      if (getMatchResult(`mens_chaos_${prop.id}`)) {
        scored++;
        points += SCORING.PROP_BET;
      }
    });
    return { scored, total: CHAOS_PROPS.length, points };
  };

  const getWomensRumblePropsStats = () => {
    const propIds = [
      MATCH_IDS.WOMENS_ENTRANT_1,
      MATCH_IDS.WOMENS_ENTRANT_30,
      MATCH_IDS.WOMENS_FIRST_ELIMINATION,
      MATCH_IDS.WOMENS_MOST_ELIMINATIONS,
      MATCH_IDS.WOMENS_LONGEST_TIME,
    ];
    let scored = 0;
    let points = 0;
    propIds.forEach(id => {
      if (getMatchResult(id)) {
        scored++;
        points += SCORING.PROP_BET;
      }
    });
    return { scored, total: propIds.length, points };
  };

  const getWomensFinalFourStats = () => {
    const slots = [1, 2, 3, 4];
    let scored = 0;
    let points = 0;
    slots.forEach(slot => {
      if (getMatchResult(`womens_final_four_${slot}`)) {
        scored++;
        points += SCORING.FINAL_FOUR_PICK;
      }
    });
    return { scored, total: 4, points };
  };

  const getWomensChaosPropsStats = () => {
    let scored = 0;
    let points = 0;
    CHAOS_PROPS.forEach(prop => {
      if (getMatchResult(`womens_chaos_${prop.id}`)) {
        scored++;
        points += SCORING.PROP_BET;
      }
    });
    return { scored, total: CHAOS_PROPS.length, points };
  };

  // Check if Final Four auto-score is available
  const canAutoScoreMensFinalFour = () => {
    const active = mensNumbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
    const alreadyScored = [1, 2, 3, 4].some(slot => getMatchResult(`mens_final_four_${slot}`));
    return active.length === 4 && !alreadyScored;
  };

  const canAutoScoreWomensFinalFour = () => {
    const active = womensNumbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
    const alreadyScored = [1, 2, 3, 4].some(slot => getMatchResult(`womens_final_four_${slot}`));
    return active.length === 4 && !alreadyScored;
  };

  const matchesStats = getMatchesSectionStats();
  const mensRumbleStats = getMensRumblePropsStats();
  const mensFinalFourStats = getMensFinalFourStats();
  const mensChaosStats = getMensChaosPropsStats();
  const womensRumbleStats = getWomensRumblePropsStats();
  const womensFinalFourStats = getWomensFinalFourStats();
  const womensChaosStats = getWomensChaosPropsStats();

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
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
          <TabsContent value="matches" className="space-y-4">
            <CollapsibleSection
              title="Undercard Matches"
              scoredCount={matchesStats.scored}
              totalCount={matchesStats.total}
              pointsAwarded={matchesStats.points}
              defaultOpen={matchesStats.scored < matchesStats.total}
            >
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
            </CollapsibleSection>
          </TabsContent>

          {/* Props Tab */}
          <TabsContent value="props" className="space-y-4">
            {/* Men's Rumble Props */}
            <CollapsibleSection
              title="Men's Rumble Props"
              scoredCount={mensRumbleStats.scored}
              totalCount={mensRumbleStats.total}
              pointsAwarded={mensRumbleStats.points}
              defaultOpen={mensRumbleStats.scored < mensRumbleStats.total}
            >
              <RumblePropScoringCard
                propId={MATCH_IDS.MENS_ENTRANT_1}
                title="#1 Entrant"
                question="Who enters at #1?"
                scoredResult={getMatchResult(MATCH_IDS.MENS_ENTRANT_1)}
                derivedValue={mensDerivedProps.mens_entrant_1}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={mensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.MENS_ENTRANT_30}
                title="#30 Entrant"
                question="Who enters at #30?"
                scoredResult={getMatchResult(MATCH_IDS.MENS_ENTRANT_30)}
                derivedValue={mensDerivedProps.mens_entrant_30}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={mensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.MENS_FIRST_ELIMINATION}
                title="First Eliminated"
                question="Who gets eliminated first?"
                scoredResult={getMatchResult(MATCH_IDS.MENS_FIRST_ELIMINATION)}
                derivedValue={mensDerivedProps.mens_first_elimination}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={mensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.MENS_MOST_ELIMINATIONS}
                title="Most Eliminations"
                question="Who has the most eliminations?"
                scoredResult={getMatchResult(MATCH_IDS.MENS_MOST_ELIMINATIONS)}
                derivedValue={mensDerivedProps.mens_most_eliminations}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={mensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.MENS_LONGEST_TIME}
                title="Iron Man"
                question="Who lasts longest in the ring?"
                scoredResult={getMatchResult(MATCH_IDS.MENS_LONGEST_TIME)}
                derivedValue={mensDerivedProps.mens_longest_time}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={mensEntrants}
              />
            </CollapsibleSection>

            {/* Men's Final Four Predictions */}
            <CollapsibleSection
              title="Men's Final Four"
              scoredCount={mensFinalFourStats.scored}
              totalCount={mensFinalFourStats.total}
              pointsAwarded={mensFinalFourStats.points}
              defaultOpen={mensFinalFourStats.scored < mensFinalFourStats.total}
            >
              {canAutoScoreMensFinalFour() && (
                <Button
                  variant="gold"
                  className="w-full mb-3"
                  onClick={() => handleShowFinalFourConfirmation("mens")}
                >
                  <Sparkles size={16} className="mr-2" />
                  Auto-Score Final Four Predictions
                </Button>
              )}
              {[1, 2, 3, 4].map((slot) => (
                <RumblePropScoringCard
                  key={`mens_final_four_${slot}`}
                  propId={`mens_final_four_${slot}`}
                  title={`Final Four Pick #${slot}`}
                  question={`Player's ${slot === 1 ? '1st' : slot === 2 ? '2nd' : slot === 3 ? '3rd' : '4th'} Final Four pick`}
                  scoredResult={getMatchResult(`mens_final_four_${slot}`)}
                  derivedValue={mensDerivedProps[`mens_final_four_${slot}`]}
                  onScore={handleScoreRumbleProp}
                  onReset={handleResetRumbleProp}
                  availableWrestlers={mensEntrants}
                />
              ))}
            </CollapsibleSection>

            {/* Men's Chaos Props */}
            <CollapsibleSection
              title="Men's Chaos Props"
              scoredCount={mensChaosStats.scored}
              totalCount={mensChaosStats.total}
              pointsAwarded={mensChaosStats.points}
              defaultOpen={mensChaosStats.scored < mensChaosStats.total}
            >
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
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setBulkPropsType("mens");
                  setBulkPropsOpen(true);
                }}
              >
                Score All Men's Chaos Props at Once
              </Button>
            </CollapsibleSection>

            {/* Women's Rumble Props */}
            <CollapsibleSection
              title="Women's Rumble Props"
              scoredCount={womensRumbleStats.scored}
              totalCount={womensRumbleStats.total}
              pointsAwarded={womensRumbleStats.points}
              defaultOpen={womensRumbleStats.scored < womensRumbleStats.total}
            >
              <RumblePropScoringCard
                propId={MATCH_IDS.WOMENS_ENTRANT_1}
                title="#1 Entrant"
                question="Who enters at #1?"
                scoredResult={getMatchResult(MATCH_IDS.WOMENS_ENTRANT_1)}
                derivedValue={womensDerivedProps.womens_entrant_1}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={womensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.WOMENS_ENTRANT_30}
                title="#30 Entrant"
                question="Who enters at #30?"
                scoredResult={getMatchResult(MATCH_IDS.WOMENS_ENTRANT_30)}
                derivedValue={womensDerivedProps.womens_entrant_30}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={womensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.WOMENS_FIRST_ELIMINATION}
                title="First Eliminated"
                question="Who gets eliminated first?"
                scoredResult={getMatchResult(MATCH_IDS.WOMENS_FIRST_ELIMINATION)}
                derivedValue={womensDerivedProps.womens_first_elimination}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={womensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.WOMENS_MOST_ELIMINATIONS}
                title="Most Eliminations"
                question="Who has the most eliminations?"
                scoredResult={getMatchResult(MATCH_IDS.WOMENS_MOST_ELIMINATIONS)}
                derivedValue={womensDerivedProps.womens_most_eliminations}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={womensEntrants}
              />
              <RumblePropScoringCard
                propId={MATCH_IDS.WOMENS_LONGEST_TIME}
                title="Iron Woman"
                question="Who lasts longest in the ring?"
                scoredResult={getMatchResult(MATCH_IDS.WOMENS_LONGEST_TIME)}
                derivedValue={womensDerivedProps.womens_longest_time}
                onScore={handleScoreRumbleProp}
                onReset={handleResetRumbleProp}
                availableWrestlers={womensEntrants}
              />
            </CollapsibleSection>

            {/* Women's Final Four Predictions */}
            <CollapsibleSection
              title="Women's Final Four"
              scoredCount={womensFinalFourStats.scored}
              totalCount={womensFinalFourStats.total}
              pointsAwarded={womensFinalFourStats.points}
              defaultOpen={womensFinalFourStats.scored < womensFinalFourStats.total}
            >
              {canAutoScoreWomensFinalFour() && (
                <Button
                  variant="gold"
                  className="w-full mb-3"
                  onClick={() => handleShowFinalFourConfirmation("womens")}
                >
                  <Sparkles size={16} className="mr-2" />
                  Auto-Score Final Four Predictions
                </Button>
              )}
              {[1, 2, 3, 4].map((slot) => (
                <RumblePropScoringCard
                  key={`womens_final_four_${slot}`}
                  propId={`womens_final_four_${slot}`}
                  title={`Final Four Pick #${slot}`}
                  question={`Player's ${slot === 1 ? '1st' : slot === 2 ? '2nd' : slot === 3 ? '3rd' : '4th'} Final Four pick`}
                  scoredResult={getMatchResult(`womens_final_four_${slot}`)}
                  derivedValue={womensDerivedProps[`womens_final_four_${slot}`]}
                  onScore={handleScoreRumbleProp}
                  onReset={handleResetRumbleProp}
                  availableWrestlers={womensEntrants}
                />
              ))}
            </CollapsibleSection>

            {/* Women's Chaos Props */}
            <CollapsibleSection
              title="Women's Chaos Props"
              scoredCount={womensChaosStats.scored}
              totalCount={womensChaosStats.total}
              pointsAwarded={womensChaosStats.points}
              defaultOpen={womensChaosStats.scored < womensChaosStats.total}
            >
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
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setBulkPropsType("womens");
                  setBulkPropsOpen(true);
                }}
              >
                Score All Women's Chaos Props at Once
              </Button>
            </CollapsibleSection>
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
                mensActiveWrestlers.map((wrestler) => {
                  const mensWinnerName = getMatchResult("mens_rumble_winner");
                  const isWinner = mensWinnerName === wrestler.wrestler_name;
                  return (
                    <ActiveWrestlerCard
                      key={wrestler.id}
                      number={wrestler.number}
                      wrestlerName={wrestler.wrestler_name || "Unknown"}
                      ownerName={getPlayerName(wrestler.assigned_to_player_id)}
                      duration={getDuration(wrestler.entry_timestamp!)}
                      eliminationCount={getEliminationCount(wrestler.number, "mens")}
                      onEliminate={() => {
                        setEliminationTarget(wrestler);
                        setEliminationType("mens");
                      }}
                      isWinner={isWinner}
                    />
                  );
                })
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
                womensActiveWrestlers.map((wrestler) => {
                  const womensWinnerName = getMatchResult("womens_rumble_winner");
                  const isWinner = womensWinnerName === wrestler.wrestler_name;
                  return (
                    <ActiveWrestlerCard
                      key={wrestler.id}
                      number={wrestler.number}
                      wrestlerName={wrestler.wrestler_name || "Unknown"}
                      ownerName={getPlayerName(wrestler.assigned_to_player_id)}
                      duration={getDuration(wrestler.entry_timestamp!)}
                      eliminationCount={getEliminationCount(wrestler.number, "womens")}
                      onEliminate={() => {
                        setEliminationTarget(wrestler);
                        setEliminationType("womens");
                      }}
                      isWinner={isWinner}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom Navigation */}
      <FixedTabNavigation
        tabs={TAB_ORDER}
        currentIndex={currentTabIndex}
        onNavigate={handleTabNavigate}
      />

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

      {finalFourConfirmation && (
        <FinalFourConfirmationModal
          open={!!finalFourConfirmation}
          onOpenChange={(open) => !open && setFinalFourConfirmation(null)}
          type={finalFourConfirmation.type}
          wrestlers={finalFourConfirmation.wrestlers}
          correctPredictionCount={finalFourConfirmation.correctPredictionCount}
          totalPlayers={players.length}
          onConfirm={handleConfirmFinalFourScoring}
        />
      )}
    </div>
  );
}
