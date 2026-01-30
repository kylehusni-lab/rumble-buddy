import { WrestlerImage } from "./WrestlerImage";
import { cn } from "@/lib/utils";

// Player color palette for headers
const PLAYER_COLORS = [
  { hex: "#e91e63" },  // Pink
  { hex: "#f44336" },  // Red
  { hex: "#ff9800" },  // Orange
  { hex: "#ffc107" },  // Amber
  { hex: "#4caf50" },  // Green
  { hex: "#00bcd4" },  // Cyan
  { hex: "#2196f3" },  // Blue
  { hex: "#9c27b0" },  // Purple
  { hex: "#795548" },  // Brown
  { hex: "#607d8b" },  // Blue Gray
];

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

// Helper to get short wrestler name (first name only)
function getShortName(name: string | null): string {
  if (!name) return "";
  // Strip asterisk prefix and get first name
  const cleanName = name.startsWith("*") ? name.slice(1) : name;
  return cleanName.split(" ")[0] || cleanName;
}

// Helper to strip asterisk from wrestler name
function stripAsterisk(name: string | null): string {
  if (!name) return "";
  return name.startsWith("*") ? name.slice(1) : name;
}

export function RumblePropsDisplay({ gender, players, picks, matchResults }: RumblePropsDisplayProps) {
  // Define props to display - reordered: #1, #30, First Elim, Most Elim, Iron
  const wrestlerProps: PropConfig[] = [
    { id: "entrant_1", label: "#1 Entrant", type: "wrestler" },
    { id: "entrant_30", label: "#30 Entrant", type: "wrestler" },
    { id: "first_elimination", label: "First Elimination", type: "wrestler" },
    { id: "most_eliminations", label: "Most Eliminations", type: "wrestler" },
    { id: "longest_time", label: "Longest Time", type: "wrestler" },
  ];

  // Get player color by index
  const getPlayerColor = (playerId: string) => {
    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) return null;
    return PLAYER_COLORS[index % PLAYER_COLORS.length].hex;
  };

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
          {/* Header Row - Player Names with colored underlines */}
          <thead>
            <tr className="bg-card/80">
              <th className="p-5 text-left text-lg font-semibold text-muted-foreground border-b border-border/50 w-48">
                Prop
              </th>
              {players.map(player => (
                <th 
                  key={player.id} 
                  className="p-5 text-center border-b border-border/50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {player.display_name}
                    </span>
                    <div 
                      className="h-[3px] w-full rounded-full"
                      style={{ backgroundColor: getPlayerColor(player.id) || "#888" }}
                    />
                  </div>
                </th>
              ))}
              <th className="p-5 text-center border-b border-border/50 w-36">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-semibold text-success">Result</span>
                  <div className="h-[3px] w-full rounded-full bg-success/50" />
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {/* Wrestler Props Rows - Increased height and image size */}
            {wrestlerProps.map(prop => {
              const result = getResult(prop.id);
              return (
                <tr key={prop.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                  <td className="p-5 text-lg font-medium text-foreground">
                    {prop.label}
                  </td>
                  {players.map(player => {
                    const prediction = getPlayerPick(player.id, prop.id);
                    return (
                      <td 
                        key={player.id} 
                        className={cn(
                          "p-4 text-center transition-colors",
                          getCellBg(prediction, result)
                        )}
                      >
                        {prediction ? (
                          <div className="flex flex-col items-center gap-2">
                            <WrestlerImage 
                              name={stripAsterisk(prediction)} 
                              size="md" 
                            />
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {getShortName(prediction)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-2xl">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center bg-card/50">
                    {result ? (
                      <div className="flex flex-col items-center gap-2">
                        <WrestlerImage name={stripAsterisk(result)} size="md" />
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {getShortName(result)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-2xl">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Final Four Row - 2x2 grid layout */}
            <tr className="border-b border-border/30 hover:bg-card/30 transition-colors">
              <td className="p-5 text-lg font-medium text-foreground">
                Final Four
              </td>
              {players.map(player => {
                const fourPicks = getFinalFourPicks(player.id);
                return (
                  <td key={player.id} className="p-4">
                    {fourPicks.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-w-[120px] mx-auto">
                        {fourPicks.slice(0, 4).map((name, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <WrestlerImage 
                              name={stripAsterisk(name)} 
                              size="sm" 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-center block text-2xl">—</span>
                    )}
                  </td>
                );
              })}
              <td className="p-4 text-center bg-card/50">
                <span className="text-muted-foreground/50 text-2xl">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
