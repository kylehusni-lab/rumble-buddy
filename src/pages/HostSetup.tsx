import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, Users, Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, isHostSession } from "@/lib/session";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface Player {
  id: string;
  display_name: string;
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
  const [mensEntrants, setMensEntrants] = useState<string[]>([]);
  const [womensEntrants, setWomensEntrants] = useState<string[]>([]);
  const [newMensEntrant, setNewMensEntrant] = useState("");
  const [newWomensEntrant, setNewWomensEntrant] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!code) {
      navigate("/");
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
      .channel(`host-setup-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, () => {
        supabase.from("players").select("id, display_name").eq("party_code", code).order("joined_at").then(({ data }) => {
          if (data) setPlayers(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code!);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="p-4 max-w-lg mx-auto">
          <Logo size="sm" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Party Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-2xl p-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">Share this code with your guests</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-black tracking-wider text-primary">{code}</span>
            <Button variant="outline" size="icon" onClick={handleCopyCode}>
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </Button>
          </div>
        </motion.div>

        {/* Players Joined */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-primary" size={20} />
            <h2 className="font-bold">Guests Joined: {players.length}</h2>
          </div>
          {players.length === 0 ? (
            <p className="text-muted-foreground text-sm">Waiting for guests to join...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <span
                  key={player.id}
                  className="bg-muted px-3 py-1 rounded-full text-sm"
                >
                  {player.display_name}
                </span>
              ))}
            </div>
          )}
        </motion.section>

        {/* Men's Entrants */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 space-y-4"
        >
          <h2 className="font-bold flex items-center gap-2">
            🧔 Men's Rumble Entrants ({mensEntrants.length})
          </h2>
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
        </motion.section>

        {/* Women's Entrants */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 space-y-4"
        >
          <h2 className="font-bold flex items-center gap-2">
            👩 Women's Rumble Entrants ({womensEntrants.length})
          </h2>
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
        </motion.section>
      </div>

      {/* Start Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-lg mx-auto">
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
          {players.length < 2 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Need at least 2 players to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
