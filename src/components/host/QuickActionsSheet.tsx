import { useNavigate } from "react-router-dom";
import { ClipboardList, Hash, LogOut, LayoutDashboard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { clearPlayerSession, getPlayerSession, setPlayerSession, getSessionId } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function QuickActionsSheet({ open, onOpenChange, code }: QuickActionsSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOpenTv = () => {
    window.open(`/tv/${code}`, "_blank");
    onOpenChange(false);
  };

  const handleCopyCode = () => {
    const joinUrl = `${window.location.origin}/player/join?code=${code}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success("Join link copied!");
    onOpenChange(false);
  };

  const handleViewPicks = () => {
    navigate(`/host/${code}/picks`);
    onOpenChange(false);
  };

  const handleNumberAssignments = () => {
    toast.info("Number Assignments - Coming soon");
    onOpenChange(false);
  };

  const ensurePlayerSession = async (): Promise<boolean> => {
    const session = getPlayerSession();
    if (session?.playerId && session.partyCode === code) {
      return true;
    }
    
    // If we have an authenticated user, try to look up their player record
    if (user) {
      const { data: player } = await supabase
        .from("players")
        .select("id, display_name, email")
        .eq("party_code", code)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (player) {
        // Update the session with the correct player data
        setPlayerSession({
          sessionId: getSessionId(),
          authUserId: user.id,
          playerId: player.id,
          partyCode: code,
          displayName: player.display_name,
          email: player.email,
          isHost: false,
        });
        return true;
      }
    }
    
    return false;
  };

  const handleMakeMyPicks = async () => {
    const hasPlayer = await ensurePlayerSession();
    if (hasPlayer) {
      navigate(`/player/picks/${code}`);
    } else {
      toast.info("Please join the group first");
      navigate(`/player/join?code=${code}&host=true`);
    }
    onOpenChange(false);
  };

  const handleMyDashboard = async () => {
    const hasPlayer = await ensurePlayerSession();
    if (hasPlayer) {
      navigate(`/player/dashboard/${code}`);
    } else {
      toast.info("Please join the group first");
      navigate(`/player/join?code=${code}&host=true`);
    }
    onOpenChange(false);
  };

  const handleGoToHub = () => {
    onOpenChange(false);
    navigate("/my-parties");
  };

  const handleSignOut = () => {
    clearPlayerSession();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const actions = [
    {
      icon: LayoutDashboard,
      title: "My Dashboard",
      subtitle: "Back to all parties",
      onClick: handleGoToHub,
    },
    {
      icon: ClipboardList,
      title: "View All Picks",
      subtitle: "See predictions",
      onClick: handleViewPicks,
    },
    {
      icon: Hash,
      title: "Number Assignments",
      subtitle: "Who owns what",
      onClick: handleNumberAssignments,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 mt-6">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <action.icon className="text-primary flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold">{action.title}</div>
                <div className="text-sm text-muted-foreground">{action.subtitle}</div>
              </div>
            </button>
          ))}

          <div className="border-t border-border my-4" />

          <button
            onClick={handleSignOut}
            className="w-full p-4 flex items-center gap-3 rounded-lg hover:bg-muted transition-colors text-left text-destructive"
          >
            <LogOut size={20} />
            <div>
              <div className="font-semibold">Sign Out</div>
              <div className="text-sm opacity-70">Clear PIN session</div>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
