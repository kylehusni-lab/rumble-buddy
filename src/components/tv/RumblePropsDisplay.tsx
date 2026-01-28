import { WrestlerImage } from "./WrestlerImage";
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
  // Define props to display - reordered: #1, #30, First Elim, Most Elim, Iron
  
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
    <div className="h-full">
      {/* Props Table - Full Width, Larger */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          {/* Header Row - Player Names */}
          <thead>
            <tr className="bg-card/80">
              <th className="p-4 text-left text-base font-semibold text-muted-foreground border-b border-border/50 w-44">
                Prop
              </th>
              {players.map(player => (
                <th 
                  key={player.id} 
                  className="p-4 text-center text-base font-semibold text-primary border-b border-border/50"
                >
                  {player.display_name}
                </th>
              ))}
              <th className="p-4 text-center text-base font-semibold text-success border-b border-border/50 w-32">
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
                  <td className="p-4 text-base font-medium text-foreground">
                    {prop.label}
                  </td>
                  {players.map(player => {
                    const prediction = getPlayerPick(player.id, prop.id);
                    return (
                      <td 
                        key={player.id} 
                        className={cn("p-3 text-center transition-colors", getCellBg(prediction, result))}
                      >
                        {prediction ? (
                          <div className="flex justify-center">
                            <WrestlerImage name={prediction} size="sm" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center bg-card/50">
                    {result ? (
                      <div className="flex justify-center">
                        <WrestlerImage name={result} size="sm" />
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
              <td className="p-4 text-base font-medium text-foreground">
                Final Four
              </td>
              {players.map(player => {
                const fourPicks = getFinalFourPicks(player.id);
                return (
                  <td key={player.id} className="p-3">
                    {fourPicks.length > 0 ? (
                      <div className="flex justify-center gap-1.5 flex-wrap">
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
              <td className="p-3 text-center bg-card/50">
                <span className="text-muted-foreground/50">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
