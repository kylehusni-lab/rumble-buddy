import { Copy, Check, Menu, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HostHeaderProps {
  code: string;
  onMenuClick: () => void;
}

export function HostHeader({ code, onMenuClick }: HostHeaderProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const joinUrl = `${window.location.origin}/player/join?code=${code}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Join link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
        {/* Back to Home */}
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </Button>
        
        {/* Group Code - centered */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="font-bold text-lg">Group #{code}</span>
          {copied ? (
            <Check size={16} className="text-success" />
          ) : (
            <Copy size={16} className="text-muted-foreground" />
          )}
        </button>
        
        {/* Menu */}
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu size={24} />
        </Button>
      </div>
    </div>
  );
}
