import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Swords, Hash, Zap, Trophy, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  UNDERCARD_MATCHES, 
  CHAOS_PROPS, 
  RUMBLE_PROPS, 
  FINAL_FOUR_SLOTS 
} from "@/lib/constants";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  display_name: string;
  points: number;
}

interface Pick {
  player_id: string;
  match_id: string;
  prediction: string;
}

interface MatchResult {
  match_id: string;
  result: string;
}

type SectionId = "matches" | "mens" | "womens";

export default function ViewAllPicks() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(["matches"]));
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch players
        const { data: playersData } = await supabase
          .from("players_public")
          .select("id, display_name, points")
          .eq("party_code", code)
          .order("points", { ascending: false });

        if (playersData) setPlayers(playersData);

        // Fetch all picks for this party's players
        if (playersData && playersData.length > 0) {
          const playerIds = playersData.map(p => p.id);
          const { data: picksData } = await supabase
            .from("picks")
            .select("player_id, match_id, prediction")
            .in("player_id", playerIds);

          if (picksData) setPicks(picksData);
        }

        // Fetch results
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

    // Realtime subscription
    const channel = supabase
      .channel(`view-all-picks-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `party_code=eq.${code}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `party_code=eq.${code}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate]);

  const toggleSection = (section: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getPlayerPick = (playerId: string, matchId: string) => {
    return picks.find(p => p.player_id === playerId && p.match_id === matchId)?.prediction;
  };

  const getResult = (matchId: string) => {
    return results.find(r => r.match_id === matchId)?.result;
  };

  const isCorrect = (playerId: string, matchId: string) => {
    const pick = getPlayerPick(playerId, matchId);
    const result = getResult(matchId);
    return pick && result && pick === result;
  };

  const isWrong = (playerId: string, matchId: string) => {
    const pick = getPlayerPick(playerId, matchId);
    const result = getResult(matchId);
    return pick && result && pick !== result;
  };

  // Group picks by category
  const matchCategories = useMemo(() => ({
    matches: [
      ...UNDERCARD_MATCHES.map(m => ({ id: m.id, label: m.title })),
      { id: "mens_rumble_winner", label: "Men's Rumble Winner" },
      { id: "womens_rumble_winner", label: "Women's Rumble Winner" },
    ],
    mens: [
      ...RUMBLE_PROPS.map(p => ({ id: `mens_${p.id}`, label: p.title })),
      ...Array.from({ length: FINAL_FOUR_SLOTS }, (_, i) => ({ 
        id: `mens_final_four_${i + 1}`, 
        label: `Final Four #${i + 1}` 
      })),
      ...CHAOS_PROPS.map((p, i) => ({ id: `mens_chaos_prop_${i + 1}`, label: p.shortName })),
    ],
    womens: [
      ...RUMBLE_PROPS.map(p => ({ id: `womens_${p.id}`, label: p.title })),
      ...Array.from({ length: FINAL_FOUR_SLOTS }, (_, i) => ({ 
        id: `womens_final_four_${i + 1}`, 
        label: `Final Four #${i + 1}` 
      })),
      ...CHAOS_PROPS.map((p, i) => ({ id: `womens_chaos_prop_${i + 1}`, label: p.shortName })),
    ],
  }), []);

  const sections: { id: SectionId; label: string; icon: typeof Swords }[] = [
    { id: "matches", label: "Matches & Winners", icon: Swords },
    { id: "mens", label: "Men's Rumble Props", icon: Hash },
    { id: "womens", label: "Women's Rumble Props", icon: Zap },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading picks...</div>
      </div>
    );
  }

  // Mobile: Show player cards with their picks
  // Desktop: Show grid with players as columns

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/host/control/${code}`)}>
            <ArrowLeft size={24} />
          </Button>
          <div className="text-center flex-1">
            <h1 className="font-bold text-lg">All Picks</h1>
            <p className="text-sm text-muted-foreground">{players.length} players</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Player Pills - Horizontal Scroll */}
      <div className="border-b border-border bg-card/50">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 p-3 min-w-max">
            <button
              onClick={() => setSelectedPlayer(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                !selectedPlayer
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Users className="w-4 h-4 inline mr-1" />
              All ({players.length})
            </button>
            {players.map((player, idx) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1",
                  selectedPlayer === player.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {idx === 0 && <Trophy className="w-3 h-3 text-primary" />}
                {player.display_name}
                <span className="text-xs opacity-70">{player.points}pts</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {players.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No players have joined yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{section.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {matchCategories[section.id].length} picks
                    </span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Section Content */}
                <AnimatePresence>
                  {expandedSections.has(section.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Desktop: Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-t border-border">
                            <tr>
                              <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 min-w-[140px]">
                                Pick
                              </th>
                              {(selectedPlayer ? players.filter(p => p.id === selectedPlayer) : players).map((player) => (
                                <th key={player.id} className="p-3 font-semibold text-center min-w-[100px]">
                                  <div className="truncate">{player.display_name}</div>
                                </th>
                              ))}
                              <th className="p-3 font-semibold text-center min-w-[100px] bg-primary/10">
                                Result
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchCategories[section.id].map((match, idx) => (
                              <tr key={match.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                <td className="p-3 font-medium sticky left-0 bg-inherit border-r border-border">
                                  {match.label}
                                </td>
                                {(selectedPlayer ? players.filter(p => p.id === selectedPlayer) : players).map((player) => {
                                  const pick = getPlayerPick(player.id, match.id);
                                  const correct = isCorrect(player.id, match.id);
                                  const wrong = isWrong(player.id, match.id);
                                  const isWrestlerPick = match.id.includes("rumble_winner") || 
                                    match.id.includes("first_elimination") ||
                                    match.id.includes("most_eliminations") ||
                                    match.id.includes("longest_time") ||
                                    match.id.includes("entrant_") ||
                                    match.id.includes("final_four");

                                  return (
                                    <td 
                                      key={player.id} 
                                      className={cn(
                                        "p-2 text-center",
                                        correct && "bg-success/20",
                                        wrong && "bg-destructive/20"
                                      )}
                                    >
                                      {pick ? (
                                        isWrestlerPick ? (
                                          <div className="flex flex-col items-center">
                                            <img
                                              src={getWrestlerImageUrl(pick)}
                                              alt={pick}
                                              className="w-8 h-8 rounded-full object-cover border border-border"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = getPlaceholderImageUrl(pick);
                                              }}
                                            />
                                            <span className="text-[10px] truncate max-w-[80px] mt-0.5">
                                              {pick.replace(/^\*/, '')}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium",
                                            pick === "YES" && "bg-success/20 text-success",
                                            pick === "NO" && "bg-destructive/20 text-destructive",
                                            !["YES", "NO"].includes(pick) && "bg-muted"
                                          )}>
                                            {pick}
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-center bg-primary/5 border-l border-border">
                                  {getResult(match.id) ? (
                                    <span className="font-semibold text-primary text-xs">
                                      {getResult(match.id)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Pending</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile: Card View */}
                      <div className="md:hidden border-t border-border">
                        {matchCategories[section.id].map((match, idx) => (
                          <div 
                            key={match.id} 
                            className={cn(
                              "p-3",
                              idx !== matchCategories[section.id].length - 1 && "border-b border-border"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{match.label}</span>
                              {getResult(match.id) && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {getResult(match.id)}
                                </span>
                              )}
                            </div>
                            
                            {/* Player picks as horizontal scroll */}
                            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                              <div className="flex gap-2 min-w-max pb-1">
                                {(selectedPlayer ? players.filter(p => p.id === selectedPlayer) : players).map((player) => {
                                  const pick = getPlayerPick(player.id, match.id);
                                  const correct = isCorrect(player.id, match.id);
                                  const wrong = isWrong(player.id, match.id);
                                  const isWrestlerPick = match.id.includes("rumble_winner") || 
                                    match.id.includes("first_elimination") ||
                                    match.id.includes("most_eliminations") ||
                                    match.id.includes("longest_time") ||
                                    match.id.includes("entrant_") ||
                                    match.id.includes("final_four");

                                  return (
                                    <div 
                                      key={player.id}
                                      className={cn(
                                        "flex flex-col items-center p-2 rounded-lg min-w-[70px]",
                                        correct && "bg-success/20",
                                        wrong && "bg-destructive/20",
                                        !correct && !wrong && "bg-muted/50"
                                      )}
                                    >
                                      {pick && isWrestlerPick ? (
                                        <img
                                          src={getWrestlerImageUrl(pick)}
                                          alt={pick}
                                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = getPlaceholderImageUrl(pick);
                                          }}
                                        />
                                      ) : pick ? (
                                        <div className={cn(
                                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
                                          pick === "YES" && "bg-success/30 text-success",
                                          pick === "NO" && "bg-destructive/30 text-destructive",
                                          !["YES", "NO"].includes(pick) && "bg-muted text-foreground"
                                        )}>
                                          {pick.slice(0, 3)}
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                                          —
                                        </div>
                                      )}
                                      <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[60px]">
                                        {player.display_name}
                                      </span>
                                      {pick && isWrestlerPick && (
                                        <span className="text-[8px] text-foreground truncate max-w-[60px]">
                                          {pick.replace(/^\*/, '').split(' ')[0]}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}