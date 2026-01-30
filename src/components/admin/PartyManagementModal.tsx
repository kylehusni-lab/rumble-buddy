import { useState, useEffect } from "react";
import { X, Loader2, Trash2, UserPlus, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Party {
  code: string;
  status: string;
  created_at: string;
  event_started_at: string | null;
  member_count: number;
  host_display_name: string | null;
  is_demo: boolean;
}

interface Member {
  id: string;
  display_name: string;
  email: string;
  points: number;
  joined_at: string;
  user_id: string | null;
}

interface PartyManagementModalProps {
  party: Party;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PartyManagementModal({
  party,
  isOpen,
  onClose,
  onUpdate,
}: PartyManagementModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, party.code]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_party_members", {
        p_party_code: party.code,
      });

      if (error) throw error;
      setMembers((data as Member[]) || []);
    } catch (err) {
      console.error("Fetch members error:", err);
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!confirm(`Remove ${member.display_name} from this party? This will delete all their picks.`)) {
      return;
    }

    setRemovingId(member.id);
    try {
      const { error } = await supabase.rpc("admin_remove_player", {
        p_player_id: member.id,
      });

      if (error) throw error;

      toast.success(`${member.display_name} removed from party`);
      fetchMembers();
      onUpdate();
    } catch (err) {
      console.error("Remove member error:", err);
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pre_event":
        return <Badge variant="secondary">Pre-Event</Badge>;
      case "live":
        return <Badge className="bg-success">Live</Badge>;
      case "ended":
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <code className="text-ott-accent font-mono bg-ott-accent/10 px-3 py-1 rounded text-lg">
              {party.code}
            </code>
            {party.is_demo && (
              <Badge variant="outline" className="border-ott-accent text-ott-accent">Demo</Badge>
            )}
            {getStatusBadge(party.status)}
          </DialogTitle>
        </DialogHeader>

        {/* Party Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{members.length} members</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Created {formatDate(party.created_at)}</span>
          </div>
          {party.event_started_at && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Event started {formatDate(party.event_started_at)}</span>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Party Members
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members yet
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-ott-surface border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{member.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-ott-accent">{member.points} pts</div>
                      <div className="text-xs text-muted-foreground">
                        Joined {formatDate(member.joined_at)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removingId === member.id}
                    >
                      {removingId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
