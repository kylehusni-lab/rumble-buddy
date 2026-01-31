import { useState, useEffect } from "react";
import { Loader2, Users, Calendar, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PartyManagementModal } from "./PartyManagementModal";

interface Party {
  code: string;
  host_session_id: string;
  host_user_id: string | null;
  status: string;
  created_at: string;
  event_started_at: string | null;
  member_count: number;
  host_email: string | null;
  host_display_name: string | null;
  is_demo: boolean;
  email_sent: boolean;
}

export function ActivePartiesTab() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_all_parties");

      if (error) throw error;
      setParties((data as Party[]) || []);
    } catch (err) {
      console.error("Fetch parties error:", err);
      toast.error("Failed to load parties");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePartyCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateParty = async () => {
    setIsCreating(true);
    try {
      const code = generatePartyCode();
      const { error } = await supabase.rpc("admin_create_party", { p_code: code });

      if (error) throw error;

      toast.success(`Party created! Code: ${code}`);
      fetchParties();
    } catch (err) {
      console.error("Create party error:", err);
      toast.error("Failed to create party");
    } finally {
      setIsCreating(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Parties ({parties.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchParties}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreateParty} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Create Party
          </Button>
        </div>
      </div>

      {/* Parties Table */}
      {parties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No parties created yet
        </div>
      ) : (
        <div className="bg-ott-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ott-surface-elevated border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Host</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Members</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parties.map((party) => (
                  <tr key={party.code} className="hover:bg-ott-surface-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-ott-accent font-mono text-sm bg-ott-accent/10 px-2 py-1 rounded">
                        {party.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {party.is_demo ? (
                        <Badge variant="outline" className="border-ott-accent text-ott-accent">Demo</Badge>
                      ) : (
                        <Badge variant="secondary">Regular</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(party.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {party.host_display_name || party.host_email || (
                        <span className="text-muted-foreground">Admin-created</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{party.member_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(party.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedParty(party)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Party Management Modal */}
      {selectedParty && (
        <PartyManagementModal
          party={selectedParty}
          isOpen={!!selectedParty}
          onClose={() => setSelectedParty(null)}
          onUpdate={fetchParties}
        />
      )}
    </div>
  );
}
