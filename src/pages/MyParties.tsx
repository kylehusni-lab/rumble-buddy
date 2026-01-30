import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogOut, Crown, ChevronRight, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PartyMembership {
  player_id: string;
  party_code: string;
  display_name: string;
  points: number;
  status: string | null;
  is_host: boolean;
  is_demo: boolean | null;
}

export default function MyParties() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [parties, setParties] = useState<PartyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hostedOpen, setHostedOpen] = useState(true);
  const [joinedOpen, setJoinedOpen] = useState(true);

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

      // Fetch party statuses including is_demo
      const partyCodes = playerData.map(p => p.party_code);
      const { data: partyData, error: partyError } = await supabase
        .from("parties_public")
        .select("code, status, is_demo")
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
          is_demo: partyInfo?.is_demo || false,
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
      // Demo parties skip PIN verification
      if (party.is_demo) {
        localStorage.setItem(`party_${party.party_code}_pin`, "verified");
        navigate(`/host/setup/${party.party_code}`);
      } else {
        navigate(`/host/verify-pin/${party.party_code}`);
      }
    } else {
      navigate(`/player/dashboard/${party.party_code}`);
    }
  };

  const getStatusBadge = (status: string | null, isDemo: boolean | null) => {
    const badges = [];
    
    if (isDemo) {
      badges.push(
        <Badge key="demo" variant="outline" className="bg-muted/50 text-muted-foreground">
          Demo
        </Badge>
      );
    }
    
    switch (status) {
      case "live":
        badges.push(<Badge key="status" className="bg-primary/20 text-primary border-primary/30">Live</Badge>);
        break;
      case "ended":
        badges.push(<Badge key="status" variant="secondary">Ended</Badge>);
        break;
      default:
        badges.push(<Badge key="status" variant="outline">Pre-Event</Badge>);
    }
    
    return <div className="flex items-center gap-2">{badges}</div>;
  };

  // Split parties into hosted and joined
  const hostedParties = parties.filter(p => p.is_host);
  const joinedParties = parties.filter(p => !p.is_host);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const PartyCard = ({ party }: { party: PartyMembership }) => (
    <button
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
            </div>
            <p className="text-sm text-muted-foreground">
              {party.display_name} - {party.points} pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(party.status, party.is_demo)}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  );

  const SectionHeader = ({ 
    title, 
    count, 
    icon: Icon, 
    isOpen, 
    onToggle 
  }: { 
    title: string; 
    count: number; 
    icon: React.ElementType;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <CollapsibleTrigger asChild onClick={onToggle}>
      <button className="w-full flex items-center justify-between py-3 px-1 group">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-semibold">{title}</span>
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} 
        />
      </button>
    </CollapsibleTrigger>
  );

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
          <div className="space-y-4">
            {/* Hosted Parties Section */}
            {hostedParties.length > 0 && (
              <Collapsible open={hostedOpen} onOpenChange={setHostedOpen}>
                <SectionHeader 
                  title="My Hosted Parties" 
                  count={hostedParties.length} 
                  icon={Crown}
                  isOpen={hostedOpen}
                  onToggle={() => setHostedOpen(!hostedOpen)}
                />
                <CollapsibleContent className="space-y-2">
                  {hostedParties.map((party) => (
                    <PartyCard key={party.player_id} party={party} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Joined Parties Section */}
            {joinedParties.length > 0 && (
              <Collapsible open={joinedOpen} onOpenChange={setJoinedOpen}>
                <SectionHeader 
                  title="Parties I've Joined" 
                  count={joinedParties.length} 
                  icon={Users}
                  isOpen={joinedOpen}
                  onToggle={() => setJoinedOpen(!joinedOpen)}
                />
                <CollapsibleContent className="space-y-2">
                  {joinedParties.map((party) => (
                    <PartyCard key={party.player_id} party={party} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

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
