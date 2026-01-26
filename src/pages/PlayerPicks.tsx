import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Crown, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { UNDERCARD_MATCHES, CHAOS_PROPS, SCORING } from "@/lib/constants";
import { getWrestlerImageUrl } from "@/lib/wrestler-data";
import { WrestlerPickerModal } from "@/components/WrestlerPickerModal";
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
  const [expandedSection, setExpandedSection] = useState<string>("matches");
  const [wrestlerPicker, setWrestlerPicker] = useState<{
    type: "mens" | "womens";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    if (!code || !session?.playerId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
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
    setPicks((prev) => ({ ...prev, [matchId]: value }));
  };

  const requiredPicks = useMemo(
    () => [
      ...UNDERCARD_MATCHES.map((m) => m.id),
      ...CHAOS_PROPS.map((p) => p.id),
      "mens_rumble_winner",
      "womens_rumble_winner",
    ],
    []
  );

  const completedCount = useMemo(
    () => requiredPicks.filter((id) => picks[id]).length,
    [picks, requiredPicks]
  );

  const allPicksComplete = completedCount === requiredPicks.length;

  const matchesCompleted = UNDERCARD_MATCHES.filter((m) => picks[m.id]).length;
  const propsCompleted = CHAOS_PROPS.filter((p) => picks[p.id]).length;
  const rumbleCompleted =
    (picks["mens_rumble_winner"] ? 1 : 0) + (picks["womens_rumble_winner"] ? 1 : 0);

  const handleSubmit = async () => {
    if (!session?.playerId || !allPicksComplete) return;

    setIsSubmitting(true);

    try {
      const picksToInsert = Object.entries(picks).map(([matchId, prediction]) => ({
        player_id: session.playerId!,
        match_id: matchId,
        prediction,
      }));

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
    ? (party.mens_rumble_entrants as string[])
    : [];
  const womensEntrants = Array.isArray(party?.womens_rumble_entrants)
    ? (party.womens_rumble_entrants as string[])
    : [];

  return (
    <div className="min-h-screen pb-32">
      {/* Header with Progress */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between mb-3">
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

          {/* Progress Bar */}
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Pick Progress</span>
              <span className={allPicksComplete ? "text-primary font-semibold" : "text-foreground"}>
                {completedCount}/{requiredPicks.length} complete
              </span>
            </div>
            <Progress value={(completedCount / requiredPicks.length) * 100} className="h-2" />
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
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

        <Accordion
          type="single"
          collapsible
          value={expandedSection}
          onValueChange={(val) => setExpandedSection(val || "")}
          className="space-y-3"
        >
          {/* Match Winners Section */}
          <AccordionItem
            value="matches"
            className={`bg-card border rounded-xl overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.3)] ${
              matchesCompleted === UNDERCARD_MATCHES.length ? "border-l-4 border-l-primary" : "border-border"
            }`}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-3">
                  <Trophy className="text-primary" size={22} />
                  <div className="text-left">
                    <div className="font-bold">Match Winners</div>
                    <div className="text-xs text-muted-foreground">
                      {matchesCompleted}/{UNDERCARD_MATCHES.length} selected • 75 pts possible
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {UNDERCARD_MATCHES.map((match) => (
                  <div key={match.id} className="space-y-3">
                    <h3 className="font-semibold text-sm">{match.title}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {match.options.map((option) => {
                        const isSelected = picks[match.id] === option;
                        return (
                          <motion.button
                            key={option}
                            onClick={() => !isLocked && handlePickChange(match.id, option)}
                            disabled={isLocked}
                            className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border bg-muted/30 hover:border-muted-foreground"
                            } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                          >
                            <img
                              src={getWrestlerImageUrl(option)}
                              alt={option}
                              className={`w-10 h-10 rounded-full border-2 ${
                                isSelected ? "border-primary" : "border-transparent"
                              }`}
                            />
                            <span className="text-sm font-medium truncate">{option}</span>
                            {isSelected && (
                              <Check className="absolute right-2 text-primary" size={18} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">+{SCORING.UNDERCARD_WINNER} pts</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rumble Winners Section */}
          <AccordionItem
            value="rumble"
            className={`bg-card border rounded-xl overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.3)] ${
              rumbleCompleted === 2 ? "border-l-4 border-l-primary" : "border-border"
            }`}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-3">
                  <Crown className="text-primary" size={22} />
                  <div className="text-left">
                    <div className="font-bold">Rumble Winners</div>
                    <div className="text-xs text-muted-foreground">
                      {rumbleCompleted}/2 selected • 100 pts possible
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {/* Men's Rumble */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">🧔 Men's Royal Rumble Winner</h3>
                  <motion.button
                    onClick={() => !isLocked && setWrestlerPicker({ type: "mens", isOpen: true })}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      picks["mens_rumble_winner"]
                        ? "border-primary bg-primary/10"
                        : "border-dashed border-muted-foreground/50 hover:border-muted-foreground"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                  >
                    {picks["mens_rumble_winner"] ? (
                      <>
                        <img
                          src={getWrestlerImageUrl(picks["mens_rumble_winner"])}
                          alt={picks["mens_rumble_winner"]}
                          className="w-14 h-14 rounded-full border-3 border-primary"
                        />
                        <div className="text-left">
                          <div className="font-bold text-primary">{picks["mens_rumble_winner"]}</div>
                          <div className="text-xs text-muted-foreground">Tap to change</div>
                        </div>
                        <Check className="ml-auto text-primary" size={24} />
                      </>
                    ) : (
                      <div className="w-full text-center py-2">
                        <div className="text-muted-foreground font-medium">Tap to select winner</div>
                      </div>
                    )}
                  </motion.button>
                  <p className="text-xs text-muted-foreground">+{SCORING.RUMBLE_WINNER_PICK} pts</p>
                </div>

                {/* Women's Rumble */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">👩 Women's Royal Rumble Winner</h3>
                  <motion.button
                    onClick={() => !isLocked && setWrestlerPicker({ type: "womens", isOpen: true })}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      picks["womens_rumble_winner"]
                        ? "border-primary bg-primary/10"
                        : "border-dashed border-muted-foreground/50 hover:border-muted-foreground"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                  >
                    {picks["womens_rumble_winner"] ? (
                      <>
                        <img
                          src={getWrestlerImageUrl(picks["womens_rumble_winner"])}
                          alt={picks["womens_rumble_winner"]}
                          className="w-14 h-14 rounded-full border-3 border-primary"
                        />
                        <div className="text-left">
                          <div className="font-bold text-primary">{picks["womens_rumble_winner"]}</div>
                          <div className="text-xs text-muted-foreground">Tap to change</div>
                        </div>
                        <Check className="ml-auto text-primary" size={24} />
                      </>
                    ) : (
                      <div className="w-full text-center py-2">
                        <div className="text-muted-foreground font-medium">Tap to select winner</div>
                      </div>
                    )}
                  </motion.button>
                  <p className="text-xs text-muted-foreground">+{SCORING.RUMBLE_WINNER_PICK} pts</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Chaos Props Section */}
          <AccordionItem
            value="props"
            className={`bg-card border rounded-xl overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.3)] ${
              propsCompleted === CHAOS_PROPS.length ? "border-l-4 border-l-primary" : "border-border"
            }`}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-3">
                  <Zap className="text-primary" size={22} />
                  <div className="text-left">
                    <div className="font-bold">Chaos Props</div>
                    <div className="text-xs text-muted-foreground">
                      {propsCompleted}/{CHAOS_PROPS.length} complete • 60 pts possible
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {CHAOS_PROPS.map((prop) => {
                  const isYes = picks[prop.id] === "YES";
                  const hasValue = picks[prop.id] !== undefined;
                  return (
                    <div
                      key={prop.id}
                      className={`p-4 rounded-lg border transition-all ${
                        hasValue ? "border-border bg-muted/20" : "border-dashed border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{prop.shortName}</h4>
                          <p className="text-xs text-muted-foreground">{prop.question}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">+{SCORING.PROP_BET} pts</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <span
                          className={`text-sm font-medium transition-colors ${
                            hasValue && !isYes ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          NO
                        </span>
                        <Switch
                          checked={isYes}
                          onCheckedChange={(checked) =>
                            !isLocked && handlePickChange(prop.id, checked ? "YES" : "NO")
                          }
                          disabled={isLocked}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isYes ? "text-primary font-bold" : "text-muted-foreground"
                          }`}
                        >
                          YES
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
        <div className="max-w-lg mx-auto space-y-2">
          {hasSubmitted && !isLocked ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !allPicksComplete}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2" size={20} />
                  Update Picks
                </>
              )}
            </Button>
          ) : allPicksComplete && !isLocked ? (
            <Button
              size="lg"
              className="w-full gold-shimmer text-primary-foreground font-bold"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Submitting...
                </>
              ) : (
                "LOCK IN YOUR PREDICTIONS 🔥"
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              disabled
            >
              {isLocked ? "Picks Locked 🔒" : "Submit Picks"}
            </Button>
          )}
          {!isLocked && !allPicksComplete && (
            <p className="text-xs text-muted-foreground text-center">
              Complete all {requiredPicks.length - completedCount} remaining picks to submit
            </p>
          )}
          {!isLocked && allPicksComplete && !hasSubmitted && (
            <p className="text-xs text-primary text-center font-medium">
              ✨ All picks complete! Lock them in!
            </p>
          )}
        </div>
      </div>

      {/* Wrestler Picker Modal */}
      <WrestlerPickerModal
        isOpen={wrestlerPicker?.isOpen || false}
        onClose={() => setWrestlerPicker(null)}
        onSelect={(wrestler) => {
          if (wrestlerPicker?.type === "mens") {
            handlePickChange("mens_rumble_winner", wrestler);
          } else {
            handlePickChange("womens_rumble_winner", wrestler);
          }
        }}
        title={
          wrestlerPicker?.type === "mens" ? "Men's Rumble Winner" : "Women's Rumble Winner"
        }
        wrestlers={wrestlerPicker?.type === "mens" ? mensEntrants : womensEntrants}
        currentSelection={
          wrestlerPicker?.type === "mens"
            ? picks["mens_rumble_winner"]
            : picks["womens_rumble_winner"]
        }
      />
    </div>
  );
}
