import { WrestlerImage } from "./WrestlerImage";

interface Player {
  id: string;
  display_name: string;
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
  
  // Define props to display
  const wrestlerProps: PropConfig[] = [
    { id: "first_elimination", label: "First Elimination", type: "wrestler" },
    { id: "most_eliminations", label: "Most Eliminations", type: "wrestler" },
    { id: "longest_time", label: gender === "mens" ? "Iron Man" : "Iron Woman", type: "wrestler" },
    { id: "entrant_1", label: "#1 Entrant", type: "wrestler" },
    { id: "entrant_30", label: "#30 Entrant", type: "wrestler" },
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
    if (!prediction || !result) return "bg-card/30";
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

  // Get No-Show pick for a player
  const getNoShowPick = (playerId: string): string | null => {
    const pick = picks.find(p => 
      p.player_id === playerId && 
      p.match_id === `${gender}_no_show`
    );
    return pick?.prediction || null;
  };

  // Check if any player has picks
  const hasAnyPicks = players.some(player => 
    wrestlerProps.some(prop => getPlayerPick(player.id, prop.id))
  );

  if (!hasAnyPicks && players.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-center mb-4">{title} Rumble Predictions</h2>
        <div className="text-center text-muted-foreground py-8">
          No predictions submitted yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-4 space-y-4 overflow-x-auto">
      <h2 className="text-2xl font-bold text-center">{title} Rumble Predictions</h2>
      
      {/* Grid Table */}
      <div className="min-w-[600px]">
        <table className="w-full border-collapse">
          {/* Header Row - Player Names */}
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-semibold text-muted-foreground border-b border-border/50 w-36">
                Prop
              </th>
              {players.map(player => (
                <th 
                  key={player.id} 
                  className="p-2 text-center text-sm font-semibold text-primary border-b border-border/50 min-w-[100px]"
                >
                  {player.display_name}
                </th>
              ))}
              <th className="p-2 text-center text-sm font-semibold text-success border-b border-border/50 min-w-[100px]">
                Result
              </th>
            </tr>
          </thead>
          
          <tbody>
            {/* Wrestler Props Rows */}
            {wrestlerProps.map(prop => {
              const result = getResult(prop.id);
              return (
                <tr key={prop.id} className="border-b border-border/30">
                  <td className="p-2 text-sm font-medium text-foreground">
                    {prop.label}
                  </td>
                  {players.map(player => {
                    const prediction = getPlayerPick(player.id, prop.id);
                    return (
                      <td 
                        key={player.id} 
                        className={`p-2 text-center ${getCellBg(prediction, result)} transition-colors`}
                      >
                        {prediction ? (
                          <div className="flex flex-col items-center gap-1">
                            <WrestlerImage name={prediction} size="xs" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
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
                        <span className="text-[10px] text-success font-semibold truncate max-w-[80px]">
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
            <tr className="border-b border-border/30">
              <td className="p-2 text-sm font-medium text-foreground">
                Final Four
              </td>
              {players.map(player => {
                const fourPicks = getFinalFourPicks(player.id);
                return (
                  <td key={player.id} className="p-2 bg-card/30">
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

            {/* No-Show Row */}
            <tr>
              <td className="p-2 text-sm font-medium text-foreground">
                No-Show?
              </td>
              {players.map(player => {
                const prediction = getNoShowPick(player.id);
                const result = getResult("no_show");
                return (
                  <td 
                    key={player.id} 
                    className={`p-2 text-center ${getCellBg(prediction, result)} transition-colors`}
                  >
                    {prediction ? (
                      <span className={`text-sm font-bold ${
                        prediction === "YES" ? "text-success" : "text-destructive"
                      }`}>
                        {prediction}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                );
              })}
              <td className="p-2 text-center bg-card/50">
                {getResult("no_show") ? (
                  <span className={`text-sm font-bold ${
                    getResult("no_show") === "YES" ? "text-success" : "text-destructive"
                  }`}>
                    {getResult("no_show")}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">TBD</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
