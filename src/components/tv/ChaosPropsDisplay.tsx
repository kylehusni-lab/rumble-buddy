import { WrestlerImage } from "./WrestlerImage";
import { cn } from "@/lib/utils";
import { CHAOS_PROPS } from "@/lib/constants";
import { Check, X } from "lucide-react";

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

interface ChaosPropsDisplayProps {
  gender: "mens" | "womens";
  players: Player[];
  picks: Pick[];
  matchResults: MatchResult[];
}

export function ChaosPropsDisplay({ gender, players, picks, matchResults }: ChaosPropsDisplayProps) {
  // Get pick for a specific player and prop
  const getPlayerPick = (playerId: string, propIndex: number): string | null => {
    const matchId = `${gender}_chaos_prop_${propIndex + 1}`;
    const pick = picks.find(p => p.player_id === playerId && p.match_id === matchId);
    return pick?.prediction || null;
  };

  // Get result for a prop
  const getResult = (propIndex: number): string | null => {
    const matchId = `${gender}_chaos_prop_${propIndex + 1}`;
    const result = matchResults.find(r => r.match_id === matchId);
    return result?.result || null;
  };

  // Get cell background based on correctness
  const getCellBg = (prediction: string | null, result: string | null): string => {
    if (!prediction || !result) return "";
    if (prediction === result) return "bg-success/30";
    return "bg-destructive/30";
  };

  return (
    <div className="h-full">
      {/* Chaos Props Table */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          {/* Header Row - Player Names */}
          <thead>
            <tr className="bg-card/80">
              <th className="p-4 text-left text-base font-semibold text-muted-foreground border-b border-border/50 w-56">
                Chaos Prop
              </th>
              {players.map(player => (
                <th 
                  key={player.id} 
                  className="p-4 text-center text-base font-semibold text-primary border-b border-border/50"
                >
                  {player.display_name}
                </th>
              ))}
              <th className="p-4 text-center text-base font-semibold text-success border-b border-border/50 w-28">
                Result
              </th>
            </tr>
          </thead>
          
          <tbody>
            {CHAOS_PROPS.map((prop, index) => {
              const result = getResult(index);
              return (
                <tr key={prop.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                  <td className="p-4">
                    <div className="text-base font-medium text-foreground">{prop.shortName}</div>
                    <div className="text-sm text-muted-foreground">{prop.question}</div>
                  </td>
                  {players.map(player => {
                    const prediction = getPlayerPick(player.id, index);
                    return (
                      <td 
                        key={player.id} 
                        className={cn("p-4 text-center transition-colors", getCellBg(prediction, result))}
                      >
                        {prediction ? (
                          <div className="flex justify-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg",
                              prediction === "YES" 
                                ? "bg-success/20 text-success" 
                                : "bg-destructive/20 text-destructive"
                            )}>
                              {prediction === "YES" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center bg-card/50">
                    {result ? (
                      <span className={cn(
                        "inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg",
                        result === "YES" 
                          ? "bg-success/20 text-success" 
                          : "bg-destructive/20 text-destructive"
                      )}>
                        {result === "YES" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">TBD</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
