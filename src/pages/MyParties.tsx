import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogOut, Crown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartyMembership {
  player_id: string;
  party_code: string;
  display_name: string;
  points: number;
  status: string | null;
  is_host: boolean;
}

export default function MyParties() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [parties, setParties] = useState<PartyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }

    if (user) {
      fetchParties();
    }
  }, [user, authLoading, navigate]);

  const fetchParties = async () => {
    try {
      // Fetch player records for current user
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, party_code, display_name, points")
        .eq("user_id", user!.id);

      if (playerError) throw playerError;

      if (!playerData || playerData.length === 0) {
        setParties([]);
        setIsLoading(false);
        return;
      }

      // Fetch party statuses
      const partyCodes = playerData.map(p => p.party_code);
      const { data: partyData, error: partyError } = await supabase
        .from("parties_public")
        .select("code, status")
        .in("code", partyCodes);

      if (partyError) throw partyError;

      // Check which parties user is host of
      const { data: hostData } = await supabase
        .from("parties")
        .select("code")
        .eq("host_user_id", user!.id);

      const hostCodes = new Set(hostData?.map(p => p.code) || []);

      // Combine data
      const combined: PartyMembership[] = playerData.map(player => {
        const partyInfo = partyData?.find(p => p.code === player.party_code);
        return {
          player_id: player.id,
          party_code: player.party_code,
          display_name: player.display_name,
          points: player.points,
          status: partyInfo?.status || "pre_event",
          is_host: hostCodes.has(player.party_code),
        };
      });

      setParties(combined);
    } catch (err) {
      console.error("Error fetching parties:", err);
      toast.error("Failed to load your parties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handlePartyClick = (party: PartyMembership) => {
    if (party.is_host) {
      navigate(`/host/setup/${party.party_code}`);
    } else {
      navigate(`/player/dashboard/${party.party_code}`);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "live":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Live</Badge>;
      case "ended":
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="outline">Pre-Event</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg space-y-6 pt-8">
        <Logo size="lg" />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Parties</h1>
            <p className="text-muted-foreground text-sm">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {parties.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">No parties yet</h2>
              <p className="text-muted-foreground text-sm">
                Join a party to start making picks and competing with friends
              </p>
            </div>
            <Button onClick={() => navigate("/join")} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Join a Party
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {parties.map((party) => (
              <button
                key={party.player_id}
                onClick={() => handlePartyClick(party)}
                className="w-full bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {party.is_host ? (
                        <Crown className="h-5 w-5 text-primary" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{party.party_code}</span>
                        {party.is_host && (
                          <Badge variant="outline" className="text-xs">Host</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {party.display_name} - {party.points} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(party.status)}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </button>
            ))}

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate("/join")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Join Another Party
            </Button>
          </div>
        )}
      </div>

      <LegalFooter />
    </div>
  );
}
