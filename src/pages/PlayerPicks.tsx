import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerSession } from "@/lib/session";
import { PickCardStack } from "@/components/picks/PickCardStack";
import { toast } from "sonner";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";

interface PartyData {
  status: string;
}

export default function PlayerPicks() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = getPlayerSession();
  const { mensEntrants, womensEntrants, isLoading: configLoading } = usePlatformConfig();

  const [party, setParty] = useState<PartyData | null>(null);
  const [existingPicks, setExistingPicks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code || !session?.playerId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const { data: partyData, error: partyError } = await supabase
          .from("parties")
          .select("status")
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
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [code, session?.playerId, navigate]);

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const isLocked = party?.status === "live" || party?.status === "completed";

  return (
    <PickCardStack
      partyCode={code || ""}
      playerId={session?.playerId || ""}
      displayName={session?.displayName || "Player"}
      isLocked={isLocked}
      existingPicks={existingPicks}
      mensEntrants={mensEntrants}
      womensEntrants={womensEntrants}
    />
  );
}
