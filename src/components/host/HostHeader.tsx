import { Copy, Check, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

interface HostHeaderProps {
  code: string;
  onMenuClick: () => void;
}

export function HostHeader({ code, onMenuClick }: HostHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
        <Logo size="sm" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="gap-2"
          >
            <span className="font-bold text-primary">{code}</span>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
