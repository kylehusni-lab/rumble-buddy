import { WrestlerImage } from "./WrestlerImage";
import { Trophy } from "lucide-react";
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

interface RumblePropsDisplayProps {
  gender: "mens" | "womens";
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
}

interface PropConfig {
  id: string;
  label: string;
  type: "wrestler" | "yes_no";
}

export function RumblePropsDisplay({ gender, players, picks, matchResults }: RumblePropsDisplayProps) {
  const title = gender === "mens" ? "Men's" : "Women's";
  
  // Sort players by points for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  
  // Define props to display - reordered: #1, #30, First Elim, Most Elim, Iron
  const wrestlerProps: PropConfig[] = [
    { id: "entrant_1", label: "#1 Entrant", type: "wrestler" },
    { id: "entrant_30", label: "#30 Entrant", type: "wrestler" },
    { id: "first_elimination", label: "First Elimination", type: "wrestler" },
    { id: "most_eliminations", label: "Most Eliminations", type: "wrestler" },
    { id: "longest_time", label: gender === "mens" ? "Iron Man" : "Iron Woman", type: "wrestler" },
  ];

  // Get pick for a specific player and prop
  const getPlayerPick = (playerId: string, propId: string): string | null => {
    const matchId = `${gender}_${propId}`;
    const pick = picks.find(p => p.player_id === playerId && p.match_id === matchId);
    return pick?.prediction || null;
  };

  // Get result for a prop
  const getResult = (propId: string): string | null => {
    const matchId = `${gender}_${propId}`;
    const result = matchResults.find(r => r.match_id === matchId);
    return result?.result || null;
  };

  // Get cell background based on correctness
  const getCellBg = (prediction: string | null, result: string | null): string => {
    if (!prediction || !result) return "";
    if (prediction === result) return "bg-success/30";
    return "bg-destructive/30";
  };

  // Get Final Four picks for a player
  const getFinalFourPicks = (playerId: string): string[] => {
    return [1, 2, 3, 4].map(i => {
      const pick = picks.find(p => 
        p.player_id === playerId && 
        p.match_id === `${gender}_final_four_${i}`
      );
      return pick?.prediction || "";
    }).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Section Header removed - title shown in TvHeaderStats */}
      
      {/* Leaderboard Row - Inline at top */}
      <div className="bg-card/80 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">Leaderboard</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg flex-shrink-0",
                index === 0 && "bg-primary/20 border border-primary",
                index === 1 && "bg-muted/80",
                index === 2 && "bg-muted/60",
                index > 2 && "bg-muted/40"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                index === 0 && "tv-rank-gold",
                index === 1 && "tv-rank-silver",
                index === 2 && "tv-rank-bronze",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              <span className="font-medium text-sm">{player.display_name}</span>
              <span className={cn(
                "font-bold ml-1",
                index === 0 && "text-primary"
              )}>
                {player.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Props Table - Full Width */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          {/* Header Row - Player Names */}
          <thead>
            <tr className="bg-card/80">
              <th className="p-3 text-left text-sm font-semibold text-muted-foreground border-b border-border/50 w-40">
                Prop
              </th>
              {players.map(player => (
                <th 
                  key={player.id} 
                  className="p-3 text-center text-sm font-semibold text-primary border-b border-border/50"
                >
                  {player.display_name}
                </th>
              ))}
              <th className="p-3 text-center text-sm font-semibold text-success border-b border-border/50 w-28">
                Result
              </th>
            </tr>
          </thead>
          
          <tbody>
            {/* Wrestler Props Rows */}
            {wrestlerProps.map(prop => {
              const result = getResult(prop.id);
              return (
                <tr key={prop.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                  <td className="p-3 text-sm font-medium text-foreground">
                    {prop.label}
                  </td>
                  {players.map(player => {
                    const prediction = getPlayerPick(player.id, prop.id);
                    return (
                      <td 
                        key={player.id} 
                        className={cn("p-2 text-center transition-colors", getCellBg(prediction, result))}
                      >
                        {prediction ? (
                          <div className="flex flex-col items-center gap-1">
                            <WrestlerImage name={prediction} size="xs" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                              {prediction.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center bg-card/50">
                    {result ? (
                      <div className="flex flex-col items-center gap-1">
                        <WrestlerImage name={result} size="xs" />
                        <span className="text-[10px] text-success font-semibold truncate max-w-[90px]">
                          {result.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">TBD</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Final Four Row */}
            <tr className="border-b border-border/30 hover:bg-card/30 transition-colors">
              <td className="p-3 text-sm font-medium text-foreground">
                Final Four
              </td>
              {players.map(player => {
                const fourPicks = getFinalFourPicks(player.id);
                return (
                  <td key={player.id} className="p-2">
                    {fourPicks.length > 0 ? (
                      <div className="flex justify-center gap-1 flex-wrap">
                        {fourPicks.map((name, i) => (
                          <WrestlerImage key={i} name={name} size="xs" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-center block">—</span>
                    )}
                  </td>
                );
              })}
              <td className="p-2 text-center bg-card/50">
                <span className="text-muted-foreground/50">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
