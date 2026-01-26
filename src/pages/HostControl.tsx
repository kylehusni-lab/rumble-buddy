import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Zap, Crown, Check, Tv, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isHostSession } from "@/lib/session";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING } from "@/lib/constants";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface RumbleNumber {
  id: string;
  number: number;
  wrestler_name: string | null;
  assigned_to_player_id: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
}

interface Player {
  id: string;
  display_name: string;
}

export default function HostControl() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [partyStatus, setPartyStatus] = useState<string>("live");
  const [entrants, setEntrants] = useState<{ mens: string[]; womens: string[] }>({ mens: [], womens: [] });
  const [matchResults, setMatchResults] = useState<Record<string, string>>({});
  const [mensNumbers, setMensNumbers] = useState<RumbleNumber[]>([]);
  const [womensNumbers, setWomensNumbers] = useState<RumbleNumber[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Elimination modal state
  const [eliminateModal, setEliminateModal] = useState<{ number: RumbleNumber; type: "mens" | "womens" } | null>(null);
  const [eliminatedBy, setEliminatedBy] = useState<string>("");

  // Entry modal state
  const [entryModal, setEntryModal] = useState<{ type: "mens" | "womens"; nextNumber: number } | null>(null);
  const [selectedWrestler, setSelectedWrestler] = useState("");

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const { data: partyData, error } = await supabase
          .from("parties")
          .select("host_session_id, status, mens_rumble_entrants, womens_rumble_entrants")
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

        setPartyStatus(partyData.status);
        setEntrants({
          mens: Array.isArray(partyData.mens_rumble_entrants) ? partyData.mens_rumble_entrants as string[] : [],
          womens: Array.isArray(partyData.womens_rumble_entrants) ? partyData.womens_rumble_entrants as string[] : [],
        });

        // Fetch match results
        const { data: resultsData } = await supabase
          .from("match_results")
          .select("match_id, result")
          .eq("party_code", code);

        if (resultsData) {
          const results: Record<string, string> = {};
          resultsData.forEach(r => { results[r.match_id] = r.result; });
          setMatchResults(results);
        }

        // Fetch rumble numbers
        const { data: numbersData } = await supabase
          .from("rumble_numbers")
          .select("*")
          .eq("party_code", code)
          .order("number");

        if (numbersData) {
          setMensNumbers(numbersData.filter(n => n.rumble_type === "mens"));
          setWomensNumbers(numbersData.filter(n => n.rumble_type === "womens"));
        }

        // Fetch players
        const { data: playersData } = await supabase
          .from("players")
          .select("id, display_name")
          .eq("party_code", code);

        if (playersData) setPlayers(playersData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`host-control-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rumble_numbers", filter: `party_code=eq.${code}` }, () => {
        supabase.from("rumble_numbers").select("*").eq("party_code", code).order("number").then(({ data }) => {
          if (data) {
            setMensNumbers(data.filter(n => n.rumble_type === "mens"));
            setWomensNumbers(data.filter(n => n.rumble_type === "womens"));
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, () => {
        supabase.from("match_results").select("match_id, result").eq("party_code", code).then(({ data }) => {
          if (data) {
            const results: Record<string, string> = {};
            data.forEach(r => { results[r.match_id] = r.result; });
            setMatchResults(results);
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate]);

  const handleScoreMatch = async (matchId: string, result: string, points: number) => {
    try {
      // Insert/update result
      const { error: resultError } = await supabase
        .from("match_results")
        .upsert({ party_code: code!, match_id: matchId, result }, { onConflict: "party_code,match_id" });

      if (resultError) throw resultError;

      // Award points to correct picks
      const { data: correctPicks, error: picksError } = await supabase
        .from("picks")
        .select("id, player_id")
        .eq("match_id", matchId)
        .eq("prediction", result);

      if (picksError) throw picksError;

      if (correctPicks && correctPicks.length > 0) {
        // Update picks with points
        await supabase
          .from("picks")
          .update({ points_awarded: points })
          .in("id", correctPicks.map(p => p.id));

        // Update player scores
        for (const pick of correctPicks) {
          const { data: player } = await supabase
            .from("players")
            .select("points")
            .eq("id", pick.player_id)
            .single();

          if (player) {
            await supabase
              .from("players")
              .update({ points: player.points + points })
              .eq("id", pick.player_id);
          }
        }
      }

      setMatchResults(prev => ({ ...prev, [matchId]: result }));
      toast.success(`${result} wins! Points awarded.`);
    } catch (err) {
      console.error("Error scoring match:", err);
      toast.error("Failed to score match");
    }
  };

  const handleConfirmEntry = async () => {
    if (!entryModal || !selectedWrestler) return;

    const numbers = entryModal.type === "mens" ? mensNumbers : womensNumbers;
    const numRecord = numbers.find(n => n.number === entryModal.nextNumber);
    if (!numRecord) return;

    try {
      await supabase
        .from("rumble_numbers")
        .update({
          wrestler_name: selectedWrestler,
          entry_timestamp: new Date().toISOString(),
        })
        .eq("id", numRecord.id);

      toast.success(`#${entryModal.nextNumber} ${selectedWrestler} enters!`);
      setEntryModal(null);
      setSelectedWrestler("");
    } catch (err) {
      console.error("Error confirming entry:", err);
      toast.error("Failed to confirm entry");
    }
  };

  const handleConfirmElimination = async () => {
    if (!eliminateModal || !eliminatedBy) return;

    try {
      // Update eliminated wrestler
      await supabase
        .from("rumble_numbers")
        .update({
          elimination_timestamp: new Date().toISOString(),
          eliminated_by_number: parseInt(eliminatedBy),
        })
        .eq("id", eliminateModal.number.id);

      // Award points to eliminator's owner
      const eliminatorNum = (eliminateModal.type === "mens" ? mensNumbers : womensNumbers)
        .find(n => n.number === parseInt(eliminatedBy));

      if (eliminatorNum?.assigned_to_player_id) {
        const { data: player } = await supabase
          .from("players")
          .select("points")
          .eq("id", eliminatorNum.assigned_to_player_id)
          .single();

        if (player) {
          await supabase
            .from("players")
            .update({ points: player.points + SCORING.ELIMINATION })
            .eq("id", eliminatorNum.assigned_to_player_id);
        }
      }

      // Check for jobber penalty (< 60 seconds)
      if (eliminateModal.number.entry_timestamp && eliminateModal.number.assigned_to_player_id) {
        const entryTime = new Date(eliminateModal.number.entry_timestamp).getTime();
        const now = Date.now();
        const durationSecs = (now - entryTime) / 1000;

        if (durationSecs < 60) {
          const { data: player } = await supabase
            .from("players")
            .select("points")
            .eq("id", eliminateModal.number.assigned_to_player_id)
            .single();

          if (player) {
            await supabase
              .from("players")
              .update({ points: player.points + SCORING.JOBBER_PENALTY })
              .eq("id", eliminateModal.number.assigned_to_player_id);
            
            toast.warning("Jobber penalty applied! (-10 pts)");
          }
        }
      }

      toast.success(`#${eliminateModal.number.number} eliminated by #${eliminatedBy}!`);
      setEliminateModal(null);
      setEliminatedBy("");
    } catch (err) {
      console.error("Error confirming elimination:", err);
      toast.error("Failed to confirm elimination");
    }
  };

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return "Vacant";
    const player = players.find(p => p.id === playerId);
    return player?.display_name || "Unknown";
  };

  const getNextEntryNumber = (numbers: RumbleNumber[]) => {
    const entered = numbers.filter(n => n.entry_timestamp).map(n => n.number);
    for (let i = 1; i <= 30; i++) {
      if (!entered.includes(i)) return i;
    }
    return null;
  };

  const getActiveWrestlers = (numbers: RumbleNumber[]) => {
    return numbers.filter(n => n.entry_timestamp && !n.elimination_timestamp);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div>
            <div className="text-sm text-muted-foreground">Host Control</div>
            <div className="font-bold text-primary">Party {code}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/tv/${code}`, "_blank")}
            >
              <Tv size={16} className="mr-1" />
              TV View
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <Tabs defaultValue="matches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matches">
              <Trophy size={16} />
            </TabsTrigger>
            <TabsTrigger value="props">
              <Zap size={16} />
            </TabsTrigger>
            <TabsTrigger value="mens">🧔</TabsTrigger>
            <TabsTrigger value="womens">👩</TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <Trophy className="text-primary" size={20} />
              Match Results
            </h2>

            {UNDERCARD_MATCHES.map((match) => (
              <div key={match.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-semibold">{match.title}</h3>
                <div className="flex gap-2">
                  {match.options.map((option) => (
                    <Button
                      key={option}
                      variant={matchResults[match.id] === option ? "gold" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleScoreMatch(match.id, option, SCORING.UNDERCARD_WINNER)}
                      disabled={!!matchResults[match.id]}
                    >
                      {matchResults[match.id] === option && <Check size={16} className="mr-1" />}
                      {option}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {matchResults[match.id] ? `✓ ${matchResults[match.id]} wins` : "Not scored"}
                </p>
              </div>
            ))}
          </TabsContent>

          {/* Props Tab */}
          <TabsContent value="props" className="space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <Zap className="text-primary" size={20} />
              Chaos Props
            </h2>

            {CHAOS_PROPS.map((prop) => (
              <div key={prop.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">{prop.shortName}</h3>
                <div className="flex gap-2">
                  {["YES", "NO"].map((option) => (
                    <Button
                      key={option}
                      variant={matchResults[prop.id] === option ? "gold" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleScoreMatch(prop.id, option, SCORING.PROP_BET)}
                      disabled={!!matchResults[prop.id]}
                    >
                      {matchResults[prop.id] === option && <Check size={16} className="mr-1" />}
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Men's Rumble Tab */}
          <TabsContent value="mens" className="space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              🧔 Men's Rumble Control
            </h2>

            {/* Next Entry */}
            {getNextEntryNumber(mensNumbers) && (
              <div className="bg-primary/20 border border-primary rounded-xl p-4 space-y-3">
                <h3 className="font-semibold">Next Entrant: #{getNextEntryNumber(mensNumbers)}</h3>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => setEntryModal({ type: "mens", nextNumber: getNextEntryNumber(mensNumbers)! })}
                >
                  Confirm Entry
                </Button>
              </div>
            )}

            {/* Active Wrestlers */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Active Wrestlers ({getActiveWrestlers(mensNumbers).length})
              </h3>
              {getActiveWrestlers(mensNumbers).map((num) => (
                <div key={num.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary">#{num.number}</span>
                    <span className="mx-2">•</span>
                    <span>{num.wrestler_name}</span>
                    <span className="text-muted-foreground text-sm ml-2">({getPlayerName(num.assigned_to_player_id)})</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setEliminateModal({ number: num, type: "mens" })}
                  >
                    Eliminate
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Women's Rumble Tab */}
          <TabsContent value="womens" className="space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              👩 Women's Rumble Control
            </h2>

            {/* Next Entry */}
            {getNextEntryNumber(womensNumbers) && (
              <div className="bg-primary/20 border border-primary rounded-xl p-4 space-y-3">
                <h3 className="font-semibold">Next Entrant: #{getNextEntryNumber(womensNumbers)}</h3>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => setEntryModal({ type: "womens", nextNumber: getNextEntryNumber(womensNumbers)! })}
                >
                  Confirm Entry
                </Button>
              </div>
            )}

            {/* Active Wrestlers */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Active Wrestlers ({getActiveWrestlers(womensNumbers).length})
              </h3>
              {getActiveWrestlers(womensNumbers).map((num) => (
                <div key={num.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary">#{num.number}</span>
                    <span className="mx-2">•</span>
                    <span>{num.wrestler_name}</span>
                    <span className="text-muted-foreground text-sm ml-2">({getPlayerName(num.assigned_to_player_id)})</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setEliminateModal({ number: num, type: "womens" })}
                  >
                    Eliminate
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Entry Modal */}
      <Dialog open={!!entryModal} onOpenChange={() => { setEntryModal(null); setSelectedWrestler(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Entry #{entryModal?.nextNumber}</DialogTitle>
          </DialogHeader>
          <Select value={selectedWrestler} onValueChange={setSelectedWrestler}>
            <SelectTrigger>
              <SelectValue placeholder="Select wrestler" />
            </SelectTrigger>
            <SelectContent>
              {(entryModal?.type === "mens" ? entrants.mens : entrants.womens).map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryModal(null)}>Cancel</Button>
            <Button variant="gold" onClick={handleConfirmEntry} disabled={!selectedWrestler}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Elimination Modal */}
      <Dialog open={!!eliminateModal} onOpenChange={() => { setEliminateModal(null); setEliminatedBy(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminate #{eliminateModal?.number.number} {eliminateModal?.number.wrestler_name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Eliminated by:</label>
            <Select value={eliminatedBy} onValueChange={setEliminatedBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                {getActiveWrestlers(eliminateModal?.type === "mens" ? mensNumbers : womensNumbers)
                  .filter(n => n.number !== eliminateModal?.number.number)
                  .map((num) => (
                    <SelectItem key={num.number} value={num.number.toString()}>
                      #{num.number} {num.wrestler_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminateModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmElimination} disabled={!eliminatedBy}>
              Confirm Elimination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
