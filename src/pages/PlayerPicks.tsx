import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING } from "@/lib/constants";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface PartyData {
  status: string;
  mens_rumble_entrants: Json;
  womens_rumble_entrants: Json;
}

export default function PlayerPicks() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = getPlayerSession();

  const [party, setParty] = useState<PartyData | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [existingPicks, setExistingPicks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!code || !session?.playerId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch party data
        const { data: partyData, error: partyError } = await supabase
          .from("parties")
          .select("status, mens_rumble_entrants, womens_rumble_entrants")
          .eq("code", code)
          .single();

        if (partyError || !partyData) {
          toast.error("Party not found");
          navigate("/");
          return;
        }

        setParty(partyData);

        // Fetch existing picks
        const { data: picksData } = await supabase
          .from("picks")
          .select("match_id, prediction")
          .eq("player_id", session.playerId);

        if (picksData && picksData.length > 0) {
          const picksMap = picksData.reduce((acc, pick) => {
            acc[pick.match_id] = pick.prediction;
            return acc;
          }, {} as Record<string, string>);
          setExistingPicks(picksMap);
          setPicks(picksMap);
          setHasSubmitted(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [code, session?.playerId, navigate]);

  const handlePickChange = (matchId: string, value: string) => {
    if (party?.status === "live" || party?.status === "completed") return;
    setPicks(prev => ({ ...prev, [matchId]: value }));
  };

  const allPicksComplete = () => {
    const requiredPicks = [
      ...UNDERCARD_MATCHES.map(m => m.id),
      ...CHAOS_PROPS.map(p => p.id),
      "mens_rumble_winner",
      "womens_rumble_winner",
    ];
    return requiredPicks.every(id => picks[id]);
  };

  const handleSubmit = async () => {
    if (!session?.playerId || !allPicksComplete()) return;

    setIsSubmitting(true);

    try {
      const picksToInsert = Object.entries(picks).map(([matchId, prediction]) => ({
        player_id: session.playerId!,
        match_id: matchId,
        prediction,
      }));

      // Upsert picks
      const { error } = await supabase
        .from("picks")
        .upsert(picksToInsert, { onConflict: "player_id,match_id" });

      if (error) throw error;

      setHasSubmitted(true);
      setExistingPicks(picks);
      toast.success("Picks saved! Good luck! 🎉");
      navigate(`/player/dashboard/${code}`);
    } catch (err) {
      console.error("Error submitting picks:", err);
      toast.error("Failed to save picks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const isLocked = party?.status === "live" || party?.status === "completed";
  const mensEntrants = Array.isArray(party?.mens_rumble_entrants) 
    ? party.mens_rumble_entrants as string[] 
    : [];
  const womensEntrants = Array.isArray(party?.womens_rumble_entrants) 
    ? party.womens_rumble_entrants as string[] 
    : [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/player/dashboard/${code}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Party {code}</div>
            <div className="font-bold text-primary">Hey {session?.displayName}!</div>
          </div>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-8">
        {isLocked && (
          <motion.div
            className="bg-secondary/20 border border-secondary rounded-xl p-4 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-secondary-foreground font-medium">
              🔒 Event in progress. Your picks are locked.
            </p>
          </motion.div>
        )}

        {/* Match Winners */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="text-primary" size={24} />
            Match Winners
          </div>

          {UNDERCARD_MATCHES.map((match) => (
            <div key={match.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">{match.title}</h3>
              <RadioGroup
                value={picks[match.id] || ""}
                onValueChange={(val) => handlePickChange(match.id, val)}
                disabled={isLocked}
                className="flex gap-4"
              >
                {match.options.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem value={option} id={`${match.id}-${option}`} />
                    <Label htmlFor={`${match.id}-${option}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">+{SCORING.UNDERCARD_WINNER} pts if correct</p>
            </div>
          ))}
        </motion.section>

        {/* Rumble Winners */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xl font-bold">
            <Crown className="text-primary" size={24} />
            Rumble Winners
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">🧔 Men's Royal Rumble Winner</h3>
            <Select
              value={picks["mens_rumble_winner"] || ""}
              onValueChange={(val) => handlePickChange("mens_rumble_winner", val)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                {mensEntrants.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">+{SCORING.RUMBLE_WINNER_PICK} pts if correct</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">👩 Women's Royal Rumble Winner</h3>
            <Select
              value={picks["womens_rumble_winner"] || ""}
              onValueChange={(val) => handlePickChange("womens_rumble_winner", val)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                {womensEntrants.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">+{SCORING.RUMBLE_WINNER_PICK} pts if correct</p>
          </div>
        </motion.section>

        {/* Chaos Props */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xl font-bold">
            <Zap className="text-primary" size={24} />
            Rumble Chaos Props
          </div>

          {CHAOS_PROPS.map((prop) => (
            <div key={prop.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">{prop.question}</h3>
              <RadioGroup
                value={picks[prop.id] || ""}
                onValueChange={(val) => handlePickChange(prop.id, val)}
                disabled={isLocked}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="YES" id={`${prop.id}-yes`} />
                  <Label htmlFor={`${prop.id}-yes`} className="cursor-pointer">YES</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NO" id={`${prop.id}-no`} />
                  <Label htmlFor={`${prop.id}-no`} className="cursor-pointer">NO</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">+{SCORING.PROP_BET} pts if correct</p>
            </div>
          ))}
        </motion.section>

        {/* Scoring Info */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-muted/50 rounded-xl p-4 space-y-2"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            ℹ️ Number Multipliers (Auto-calculated)
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Iron Man/Woman: +{SCORING.IRON_MAN} pts (longest duration)</li>
            <li>• Final Four: +{SCORING.FINAL_FOUR} pts per number</li>
            <li>• Winner: +{SCORING.RUMBLE_WINNER_NUMBER} pts</li>
            <li>• Jobber Penalty: {SCORING.JOBBER_PENALTY} pts (eliminated &lt;60s)</li>
          </ul>
        </motion.section>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          {hasSubmitted && !isLocked ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !allPicksComplete()}
            >
              <Check className="mr-2" size={20} />
              {isSubmitting ? "Saving..." : "Update Picks"}
            </Button>
          ) : (
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !allPicksComplete() || isLocked}
            >
              {isSubmitting ? "Submitting..." : isLocked ? "Picks Locked 🔒" : "Submit Picks"}
            </Button>
          )}
          {!isLocked && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              ⚠️ Picks locked when event starts!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
