import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Check, X, Clock, LogOut, RefreshCw, Users, UserCheck, XCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OttLogoImage } from "@/components/logo";
import { ActivePartiesTab } from "@/components/admin/ActivePartiesTab";
import { WrestlerDatabaseTab } from "@/components/admin/WrestlerDatabaseTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccessRequest {
  id: string;
  created_at: string;
  name: string;
  email: string;
  play_style: string;
  group_size: string | null;
  status: string;
  party_code: string | null;
  rejected_at: string | null;
}

function generatePartyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Check admin role
      const { data: hasRole } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

      if (!hasRole) {
        toast.error("Access denied");
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setIsAuthorized(true);
      fetchRequests();
    } catch (err) {
      console.error("Auth check failed:", err);
      navigate("/admin/login");
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: AccessRequest) => {
    setApprovingId(request.id);
    
    try {
      const code = generatePartyCode();
      
      // Create the party with null host_user_id - the actual host will claim it when they join
      const { error: partyError } = await supabase
        .from("parties")
        .insert({
          code: code,
          host_session_id: `admin-approved-${request.id}`,
          host_user_id: null, // Leave null for host to claim when they join
          status: "pre_event",
        });

      if (partyError) {
        // If party creation fails, try with a new code (might be collision)
        console.error("Party creation error:", partyError);
        throw new Error("Failed to create party. Try again.");
      }
      
      // Update the access request with the code
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          party_code: code,
          approved_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success(`Approved! Party ${code} created.`);
      fetchRequests();
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request: AccessRequest) => {
    setRejectingId(request.id);
    
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Request rejected");
      fetchRequests();
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject request");
    } finally {
      setRejectingId(null);
    }
  };

  const handleEmailCode = (request: AccessRequest) => {
    const isHost = request.play_style === "Group";
    const joinUrl = isHost
      ? `https://therumbleapp.com/join?code=${request.party_code}&host=true`
      : `https://therumbleapp.com/join?code=${request.party_code}`;
    
    const subject = encodeURIComponent(`Your Royal Rumble Party Code: ${request.party_code}`);
    const body = encodeURIComponent(
      `Hi ${request.name},\n\n` +
      `Here is your access code: ${request.party_code}\n\n` +
      `Click here to get started: ${joinUrl}\n\n` +
      `See you at the Rumble!`
    );
    window.open(`mailto:${request.email}?subject=${subject}&body=${body}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-ott-accent text-background">Pending</Badge>;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ott-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OttLogoImage size="xs" />
            <span className="font-bold text-lg">Commissioner Mode</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-ott-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="text-3xl font-bold text-ott-accent">{pendingCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-ott-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Approved</span>
            </div>
            <div className="text-3xl font-bold text-success">{approvedCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-ott-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Rejected</span>
            </div>
            <div className="text-3xl font-bold text-destructive">{rejectedCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-ott-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <div className="text-3xl font-bold">{requests.length}</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="wrestlers" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Wrestlers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6 space-y-4">
            {/* Refresh button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Requests Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No access requests yet
              </div>
            ) : (
              <div className="bg-ott-surface border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ott-surface-elevated border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Style</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Code</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-ott-surface-elevated/50 transition-colors">
                          <td className="px-4 py-3">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="px-4 py-3 font-medium">{request.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{request.email}</td>
                          <td className="px-4 py-3 text-sm">
                            {request.play_style}
                            {request.group_size && ` (${request.group_size})`}
                          </td>
                          <td className="px-4 py-3">
                            {request.party_code ? (
                              <code className="text-ott-accent font-mono text-sm bg-ott-accent/10 px-2 py-1 rounded">
                                {request.party_code}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {request.status === "pending" ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(request)}
                                    disabled={approvingId === request.id || rejectingId === request.id}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    {approvingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(request)}
                                    disabled={approvingId === request.id || rejectingId === request.id}
                                  >
                                    {rejectingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <X className="w-4 h-4 mr-1" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </>
                              ) : request.status === "approved" && request.party_code ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmailCode(request)}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  Email Code
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="parties" className="mt-6">
            <ActivePartiesTab />
          </TabsContent>

          <TabsContent value="wrestlers" className="mt-6">
            <WrestlerDatabaseTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
