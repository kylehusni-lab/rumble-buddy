import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OttNavBar } from "@/components/OttNavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getActiveEventId } from "@/lib/events";
import { EVENT_CONFIG } from "@/lib/constants";
import { Trophy, Loader2, ArrowLeft, Medal } from "lucide-react";

interface LeaderboardRow {
  solo_player_id: string;
  display_name: string;
  total_points: number;
  picks_made: number;
  rank: number;
}

export default function GlobalLeaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_global_leaderboard", {
        p_event_id: getActiveEventId(),
        p_limit: 100,
      });
      if (!mounted) return;
      if (error) {
        console.error(error);
      } else if (data) {
        setRows(data as LeaderboardRow[]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <OttNavBar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-ott-accent/10 rounded-full">
              <Trophy className="w-8 h-8 text-ott-accent" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">{EVENT_CONFIG.TITLE}</p>
        </div>

        <Card className="bg-ott-surface border-border overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-ott-accent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No players have made picks yet. Be the first!
              <div className="mt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="bg-ott-accent text-background hover:bg-ott-accent/90"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[60px_1fr_80px_80px] gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-ott-surface-elevated">
                <div>Rank</div>
                <div>Player</div>
                <div className="text-right">Picks</div>
                <div className="text-right">Points</div>
              </div>
              {rows.map((row) => (
                <div
                  key={row.solo_player_id}
                  className="grid grid-cols-[60px_1fr_80px_80px] gap-2 px-4 py-3 items-center"
                >
                  <div className={`font-black flex items-center gap-1 ${rankColor(row.rank)}`}>
                    {row.rank <= 3 && <Medal className="w-4 h-4" />}
                    {row.rank}
                  </div>
                  <div className="font-semibold truncate">{row.display_name}</div>
                  <div className="text-right text-muted-foreground tabular-nums">
                    {row.picks_made}
                  </div>
                  <div className="text-right font-bold text-ott-accent tabular-nums">
                    {row.total_points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
