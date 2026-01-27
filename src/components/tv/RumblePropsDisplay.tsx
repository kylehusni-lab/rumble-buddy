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

export function RumblePropsDisplay({ gender, players, picks, matchResults }: RumblePropsDisplayProps) {
  // Get all picks for a specific prop
  const getPicksForProp = (propId: string) => {
    const matchId = `${gender}_${propId}`;
    return players.map(player => {
      const pick = picks.find(p => p.player_id === player.id && p.match_id === matchId);
      return { player, prediction: pick?.prediction || null };
    }).filter(p => p.prediction);
  };

  // Render a row of wrestler picks for a prop
  const renderPropRow = (title: string, propId: string) => {
    const propPicks = getPicksForProp(propId);
    const result = matchResults.find(r => r.match_id === `${gender}_${propId}`);
    
    if (propPicks.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          {result && (
            <span className="text-sm text-success font-semibold">✓ {result.result}</span>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {propPicks.map(({ player, prediction }) => (
            <div key={player.id} className="flex-shrink-0 flex flex-col items-center min-w-[80px]">
              <WrestlerImage 
                name={prediction!} 
                size="sm" 
                className={prediction === result?.result ? "ring-2 ring-success" : ""} 
              />
              <span className="text-xs font-medium mt-1 text-center truncate w-full">{prediction}</span>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">{player.display_name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Final Four section
  const renderFinalFour = () => {
    const playerFinalFours = players.map(player => {
      const fourPicks = [1, 2, 3, 4].map(i => {
        const pick = picks.find(p => 
          p.player_id === player.id && 
          p.match_id === `${gender}_final_four_${i}`
        );
        return pick?.prediction || null;
      }).filter(Boolean) as string[];
      return { player, picks: fourPicks };
    }).filter(p => p.picks.length > 0);

    if (playerFinalFours.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Final Four Picks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {playerFinalFours.map(({ player, picks: playerPicks }) => (
            <div key={player.id} className="bg-card/50 rounded-lg p-3 border border-border/50">
              <div className="text-sm font-semibold text-primary mb-2">{player.display_name}</div>
              <div className="flex gap-2">
                {playerPicks.map((name, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <WrestlerImage name={name} size="sm" />
                    <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[48px] text-center">{name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render No-Show prop (YES/NO)
  const renderNoShow = () => {
    const propPicks = getPicksForProp("no_show");
    const result = matchResults.find(r => r.match_id === `${gender}_no_show`);
    
    if (propPicks.length === 0) return null;

    const yesPicks = propPicks.filter(p => p.prediction === "YES");
    const noPicks = propPicks.filter(p => p.prediction === "NO");
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">No-Show?</h3>
          {result && (
            <span className="text-sm text-success font-semibold">✓ {result.result}</span>
          )}
        </div>
        <div className="flex gap-4">
          <div className={`flex-1 rounded-lg p-3 text-center border ${
            result?.result === "YES" ? "bg-success/20 border-success" : "bg-success/10 border-border/50"
          }`}>
            <div className="text-success font-bold">YES ({yesPicks.length})</div>
            <div className="text-xs text-muted-foreground">
              {yesPicks.map(p => p.player.display_name).join(", ") || "—"}
            </div>
          </div>
          <div className={`flex-1 rounded-lg p-3 text-center border ${
            result?.result === "NO" ? "bg-destructive/20 border-destructive" : "bg-destructive/10 border-border/50"
          }`}>
            <div className="text-destructive font-bold">NO ({noPicks.length})</div>
            <div className="text-xs text-muted-foreground">
              {noPicks.map(p => p.player.display_name).join(", ") || "—"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const title = gender === "mens" ? "Men's" : "Women's";

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">{title} Rumble Predictions</h2>
      
      {renderPropRow("First Elimination", "first_elimination")}
      {renderPropRow("Most Eliminations", "most_eliminations")}
      {renderPropRow(gender === "mens" ? "Iron Man" : "Iron Woman", "longest_time")}
      {renderPropRow("#1 Entrant", "entrant_1")}
      {renderPropRow("#30 Entrant", "entrant_30")}
      {renderFinalFour()}
      {renderNoShow()}
      
      {/* Empty state */}
      {getPicksForProp("first_elimination").length === 0 && 
       getPicksForProp("most_eliminations").length === 0 &&
       getPicksForProp("longest_time").length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No predictions submitted yet
        </div>
      )}
    </div>
  );
}
