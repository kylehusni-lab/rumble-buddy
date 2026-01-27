import { useNavigate } from "react-router-dom";
import { Tv, Copy, ClipboardList, Hash, LogOut, Trophy, Edit3 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { clearPlayerSession, getPlayerSession } from "@/lib/session";

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function QuickActionsSheet({ open, onOpenChange, code }: QuickActionsSheetProps) {
  const navigate = useNavigate();

  const handleOpenTv = () => {
    window.open(`/tv/${code}`, "_blank");
    onOpenChange(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
    onOpenChange(false);
  };

  const handleViewPicks = () => {
    toast.info("View All Picks - Coming soon");
    onOpenChange(false);
  };

  const handleNumberAssignments = () => {
    toast.info("Number Assignments - Coming soon");
    onOpenChange(false);
  };

  const handleMakeMyPicks = () => {
    const session = getPlayerSession();
    if (session?.playerId) {
      navigate(`/player/picks/${code}`);
    } else {
      toast.info("Please join the party first");
      navigate(`/player/join?code=${code}&host=true`);
    }
    onOpenChange(false);
  };

  const handleMyDashboard = () => {
    const session = getPlayerSession();
    if (session?.playerId) {
      navigate(`/player/dashboard/${code}`);
    } else {
      toast.info("Please join the party first");
      navigate(`/player/join?code=${code}&host=true`);
    }
    onOpenChange(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem(`party_${code}_pin`);
    clearPlayerSession();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const actions = [
    {
      icon: Edit3,
      title: "Make My Picks",
      subtitle: "Submit your predictions",
      onClick: handleMakeMyPicks,
    },
    {
      icon: Trophy,
      title: "My Dashboard",
      subtitle: "View your numbers & points",
      onClick: handleMyDashboard,
    },
    {
      icon: Tv,
      title: "TV Display",
      subtitle: "Open in new tab",
      onClick: handleOpenTv,
    },
    {
      icon: Copy,
      title: "Copy Party Code",
      subtitle: `Code: ${code}`,
      onClick: handleCopyCode,
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
