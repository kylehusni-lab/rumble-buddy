import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Play, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { isHostSession } from "@/lib/session";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { HostHeader } from "@/components/host/HostHeader";
import { QuickActionsSheet } from "@/components/host/QuickActionsSheet";
import { GuestStatusCard } from "@/components/host/GuestStatusCard";
import { ConnectionStatus } from "@/components/host/ConnectionStatus";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  display_name: string;
  picks_count?: number;
}

interface PartyData {
  host_session_id: string;
  status: string;
  mens_rumble_entrants: Json;
  womens_rumble_entrants: Json;
}

export default function HostSetup() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [party, setParty] = useState<PartyData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerPicks, setPlayerPicks] = useState<Record<string, number>>({});
  const [mensEntrants, setMensEntrants] = useState<string[]>([]);
  const [womensEntrants, setWomensEntrants] = useState<string[]>([]);
  const [newMensEntrant, setNewMensEntrant] = useState("");
  const [newWomensEntrant, setNewWomensEntrant] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Collapsible states
  const [guestsOpen, setGuestsOpen] = useState(true);
  const [mensEntrantsOpen, setMensEntrantsOpen] = useState(false);
  const [womensEntrantsOpen, setWomensEntrantsOpen] = useState(false);

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
          .select("host_session_id, status, mens_rumble_entrants, womens_rumble_entrants")
          .eq("code", code)
          .single();

        if (error || !partyData) {
          toast.error("Party not found");
          navigate("/");
          return;
        }

        // Verify host access
        if (!isHostSession(partyData.host_session_id)) {
          toast.error("You are not the host of this party");
          navigate("/");
          return;
        }

        // Redirect if event already started
        if (partyData.status !== "pre_event") {
          navigate(`/host/control/${code}`);
          return;
        }

        setParty(partyData);
        setMensEntrants(Array.isArray(partyData.mens_rumble_entrants) 
          ? partyData.mens_rumble_entrants as string[] 
          : []);
        setWomensEntrants(Array.isArray(partyData.womens_rumble_entrants) 
          ? partyData.womens_rumble_entrants as string[] 
          : []);

        // Fetch players
        const { data: playersData } = await supabase
          .from("players")
          .select("id, display_name")
          .eq("party_code", code)
          .order("joined_at");

        if (playersData) {
          setPlayers(playersData);
          
          // Fetch picks counts for each player
          const picksCountMap: Record<string, number> = {};
          for (const player of playersData) {
            const { count } = await supabase
              .from("picks")
              .select("*", { count: "exact", head: true })
              .eq("player_id", player.id);
            picksCountMap[player.id] = count || 0;
          }
          setPlayerPicks(picksCountMap);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`host-setup-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, async () => {
        const { data } = await supabase
          .from("players")
          .select("id, display_name")
          .eq("party_code", code)
          .order("joined_at");
        
        if (data) {
          setPlayers(data);
          // Update picks counts
          const picksCountMap: Record<string, number> = {};
          for (const player of data) {
            const { count } = await supabase
              .from("picks")
              .select("*", { count: "exact", head: true })
              .eq("player_id", player.id);
            picksCountMap[player.id] = count || 0;
          }
          setPlayerPicks(picksCountMap);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, async () => {
        // Refresh picks counts when picks change
        const picksCountMap: Record<string, number> = {};
        for (const player of players) {
          const { count } = await supabase
            .from("picks")
            .select("*", { count: "exact", head: true })
            .eq("player_id", player.id);
          picksCountMap[player.id] = count || 0;
        }
        setPlayerPicks(picksCountMap);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate, players.length]);

  const handleAddEntrant = async (type: "mens" | "womens") => {
    const newName = type === "mens" ? newMensEntrant.trim() : newWomensEntrant.trim();
    if (!newName) return;

    const current = type === "mens" ? mensEntrants : womensEntrants;
    if (current.includes(newName)) {
      toast.error("This entrant already exists");
      return;
    }

    const updated = [...current, newName];
    
    const { error } = await supabase
      .from("parties")
      .update({ [`${type}_rumble_entrants`]: updated })
      .eq("code", code);

    if (error) {
      toast.error("Failed to add entrant");
      return;
    }

    if (type === "mens") {
      setMensEntrants(updated);
      setNewMensEntrant("");
    } else {
      setWomensEntrants(updated);
      setNewWomensEntrant("");
    }
  };

  const handleRemoveEntrant = async (type: "mens" | "womens", name: string) => {
    const current = type === "mens" ? mensEntrants : womensEntrants;
    const updated = current.filter(n => n !== name);

    const { error } = await supabase
      .from("parties")
      .update({ [`${type}_rumble_entrants`]: updated })
      .eq("code", code);

    if (error) {
      toast.error("Failed to remove entrant");
      return;
    }

    if (type === "mens") setMensEntrants(updated);
    else setWomensEntrants(updated);
  };

  const distributeNumbers = async (rumbleType: "mens" | "womens") => {
    if (players.length === 0) return;

    const numbersPerPlayer = Math.floor(30 / players.length);
    const remainder = 30 % players.length;

    const numbers = Array.from({ length: 30 }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const assignments: { party_code: string; rumble_type: string; number: number; assigned_to_player_id: string | null }[] = [];
    let index = 0;

    players.forEach((player, playerIndex) => {
      const count = numbersPerPlayer + (playerIndex < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) {
        assignments.push({
          party_code: code!,
          rumble_type: rumbleType,
          number: numbers[index],
          assigned_to_player_id: player.id,
        });
        index++;
      }
    });

    // Remaining numbers go to Vacant
    while (index < 30) {
      assignments.push({
        party_code: code!,
        rumble_type: rumbleType,
        number: numbers[index],
        assigned_to_player_id: null,
      });
      index++;
    }

    const { error } = await supabase.from("rumble_numbers").insert(assignments);
    if (error) throw error;
  };

  const handleStartEvent = async () => {
    if (players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }

    setIsStarting(true);

    try {
      // Distribute numbers for both rumbles
      await distributeNumbers("mens");
      await distributeNumbers("womens");

      // Update party status
      const { error } = await supabase
        .from("parties")
        .update({
          status: "live",
          event_started_at: new Date().toISOString(),
        })
        .eq("code", code);

      if (error) throw error;

      toast.success("Event started! Numbers distributed! 🎉");
      navigate(`/host/control/${code}`);
    } catch (err) {
      console.error("Error starting event:", err);
      toast.error("Failed to start event. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const guestsReady = players.filter(p => (playerPicks[p.id] || 0) >= 7).length;
  const totalGuests = players.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <ConnectionStatus isConnected={isConnected} />
      <HostHeader code={code!} onMenuClick={() => setMenuOpen(true)} />
      <QuickActionsSheet open={menuOpen} onOpenChange={setMenuOpen} code={code!} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Event Status</h2>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Pre-Event
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-primary">{totalGuests}</p>
              <p className="text-sm text-muted-foreground">Guests Joined</p>
            </div>
            <div>
              <p className="text-3xl font-black text-primary">{guestsReady}/{totalGuests}</p>
              <p className="text-sm text-muted-foreground">Picks Complete</p>
            </div>
          </div>
        </motion.div>

        {/* Guests List (Collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Collapsible open={guestsOpen} onOpenChange={setGuestsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="text-primary" size={20} />
                  <span className="font-bold">Guests ({totalGuests})</span>
                </div>
                <ChevronDown className={cn(
                  "text-muted-foreground transition-transform",
                  guestsOpen && "rotate-180"
                )} size={20} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {players.length === 0 ? (
                  <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground text-sm">
                    Waiting for guests to join...
                  </div>
                ) : (
                  players.map((player) => (
                    <GuestStatusCard
                      key={player.id}
                      displayName={player.display_name}
                      picksCount={playerPicks[player.id] || 0}
                      picksCompleted={(playerPicks[player.id] || 0) >= 7}
                    />
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* Men's Entrants (Collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Collapsible open={mensEntrantsOpen} onOpenChange={setMensEntrantsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <span className="font-bold">🧔 Men's Entrants ({mensEntrants.length})</span>
                <ChevronDown className={cn(
                  "text-muted-foreground transition-transform",
                  mensEntrantsOpen && "rotate-180"
                )} size={20} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 bg-card/50 border border-border rounded-xl space-y-4">
                <div className="flex flex-wrap gap-2">
                  {mensEntrants.map((name) => (
                    <div
                      key={name}
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {name}
                      <button
                        onClick={() => handleRemoveEntrant("mens", name)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add entrant..."
                    value={newMensEntrant}
                    onChange={(e) => setNewMensEntrant(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEntrant("mens")}
                  />
                  <Button variant="outline" size="icon" onClick={() => handleAddEntrant("mens")}>
                    <Plus size={20} />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* Women's Entrants (Collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Collapsible open={womensEntrantsOpen} onOpenChange={setWomensEntrantsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <span className="font-bold">👩 Women's Entrants ({womensEntrants.length})</span>
                <ChevronDown className={cn(
                  "text-muted-foreground transition-transform",
                  womensEntrantsOpen && "rotate-180"
                )} size={20} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 bg-card/50 border border-border rounded-xl space-y-4">
                <div className="flex flex-wrap gap-2">
                  {womensEntrants.map((name) => (
                    <div
                      key={name}
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {name}
                      <button
                        onClick={() => handleRemoveEntrant("womens", name)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add entrant..."
                    value={newWomensEntrant}
                    onChange={(e) => setNewWomensEntrant(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEntrant("womens")}
                  />
                  <Button variant="outline" size="icon" onClick={() => handleAddEntrant("womens")}>
                    <Plus size={20} />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </div>

      {/* Start Button - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-lg mx-auto space-y-2">
          {players.length < 2 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertCircle size={16} />
              Need at least 2 guests to start
            </div>
          )}
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            onClick={handleStartEvent}
            disabled={isStarting || players.length < 2}
          >
            <Play className="mr-2" size={24} />
            {isStarting ? "Starting..." : "Start Event & Draw Numbers"}
          </Button>
        </div>
      </div>
    </div>
  );
}
