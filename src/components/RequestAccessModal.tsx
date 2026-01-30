import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Play } from "lucide-react";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestAccessModal({ isOpen, onClose }: RequestAccessModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [playStyle, setPlayStyle] = useState<"Solo" | "Group" | "">("");
  const [groupSize, setGroupSize] = useState<"2-5" | "6-10" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !playStyle) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (playStyle === "Group" && !groupSize) {
      toast.error("Please select your group size");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("access_requests").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        play_style: playStyle,
        group_size: playStyle === "Group" ? groupSize : null,
      });

      if (error) throw error;

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting request:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setName("");
    setEmail("");
    setPlayStyle("");
    setGroupSize("");
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-ott-surface border-border">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-ott-accent mx-auto" />
            <DialogTitle className="text-xl">Request Received</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Thanks! We're manually spinning up parties to ensure a perfect experience tonight. 
              Watch your email for your unique Party Code.
            </DialogDescription>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
              <Button 
                onClick={handleClose}
                className="bg-ott-accent text-background hover:bg-ott-accent/90"
              >
                Got it
              </Button>
              <Button 
                onClick={() => {
                  handleClose();
                  navigate("/demo");
                }}
                variant="outline"
                className="border-border"
              >
                <Play className="w-4 h-4 mr-2" />
                Try the Demo
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request Access</DialogTitle>
              <DialogDescription>
                We're launching in limited access mode to ensure everything runs smoothly.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-ott-surface-elevated border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-ott-surface-elevated border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>How do you want to play?</Label>
                <Select value={playStyle} onValueChange={(val) => setPlayStyle(val as "Solo" | "Group")}>
                  <SelectTrigger className="bg-ott-surface-elevated border-border">
                    <SelectValue placeholder="Select play style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solo">Solo - Just me</SelectItem>
                    <SelectItem value="Group">Group - Hosting a party</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {playStyle === "Group" && (
                <div className="space-y-2">
                  <Label>Group Size</Label>
                  <Select value={groupSize} onValueChange={(val) => setGroupSize(val as "2-5" | "6-10")}>
                    <SelectTrigger className="bg-ott-surface-elevated border-border">
                      <SelectValue placeholder="How many guests?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-5">2-5 people</SelectItem>
                      <SelectItem value="6-10">6-10 people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Access"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
