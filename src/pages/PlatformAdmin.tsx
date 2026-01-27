import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, LogOut, Plus, X, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlatformAdmin() {
  const navigate = useNavigate();
  const { mensEntrants, womensEntrants, isLoading: configLoading, refetch } = usePlatformConfig();
  
  const [mensEntrantsList, setMensEntrantsList] = useState<string[]>([]);
  const [womensEntrantsList, setWomensEntrantsList] = useState<string[]>([]);
  const [newMensEntrant, setNewMensEntrant] = useState("");
  const [newWomensEntrant, setNewWomensEntrant] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Verify session on mount
  useEffect(() => {
    const session = localStorage.getItem("platform_admin_session");
    const expiresAt = localStorage.getItem("platform_admin_expires");

    if (!session || !expiresAt || new Date(expiresAt) < new Date()) {
      localStorage.removeItem("platform_admin_session");
      localStorage.removeItem("platform_admin_expires");
      navigate("/platform-admin/verify");
    }
  }, [navigate]);

  // Initialize local state from platform config
  useEffect(() => {
    if (!configLoading) {
      setMensEntrantsList([...mensEntrants]);
      setWomensEntrantsList([...womensEntrants]);
    }
  }, [configLoading, mensEntrants, womensEntrants]);

  const handleLogout = () => {
    localStorage.removeItem("platform_admin_session");
    localStorage.removeItem("platform_admin_expires");
    navigate("/");
  };

  const handleAddMensEntrant = () => {
    if (!newMensEntrant.trim()) return;
    if (mensEntrantsList.includes(newMensEntrant.trim())) {
      toast.error("Wrestler already in list");
      return;
    }
    setMensEntrantsList([...mensEntrantsList, newMensEntrant.trim()]);
    setNewMensEntrant("");
    setHasChanges(true);
  };

  const handleRemoveMensEntrant = (index: number) => {
    setMensEntrantsList(mensEntrantsList.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleAddWomensEntrant = () => {
    if (!newWomensEntrant.trim()) return;
    if (womensEntrantsList.includes(newWomensEntrant.trim())) {
      toast.error("Wrestler already in list");
      return;
    }
    setWomensEntrantsList([...womensEntrantsList, newWomensEntrant.trim()]);
    setNewWomensEntrant("");
    setHasChanges(true);
  };

  const handleRemoveWomensEntrant = (index: number) => {
    setWomensEntrantsList(womensEntrantsList.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem("platform_admin_session");
      
      const { error } = await supabase.functions.invoke("update-platform-config", {
        body: {
          token,
          mensEntrants: mensEntrantsList,
          womensEntrants: womensEntrantsList,
        },
      });

      if (error) {
        throw error;
      }

      await refetch();
      setHasChanges(false);
      toast.success("Configuration saved!");
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">Platform Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="hero"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo size="sm" />
          <p className="text-center text-muted-foreground text-sm mt-2">
            Manage global Rumble entrant lists
          </p>
        </motion.div>

        <Tabs defaultValue="mens" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="mens" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Men's ({mensEntrantsList.length})
            </TabsTrigger>
            <TabsTrigger value="womens" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Women's ({womensEntrantsList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mens">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add wrestler name..."
                  value={newMensEntrant}
                  onChange={(e) => setNewMensEntrant(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMensEntrant()}
                />
                <Button onClick={handleAddMensEntrant} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {mensEntrantsList.map((entrant, index) => (
                    <motion.div
                      key={`${entrant}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm font-medium">{entrant}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMensEntrant(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="womens">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add wrestler name..."
                  value={newWomensEntrant}
                  onChange={(e) => setNewWomensEntrant(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWomensEntrant()}
                />
                <Button onClick={handleAddWomensEntrant} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {womensEntrantsList.map((entrant, index) => (
                    <motion.div
                      key={`${entrant}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm font-medium">{entrant}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveWomensEntrant(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto"
          >
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? "Saving Changes..." : "Save All Changes"}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
