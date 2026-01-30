import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RingIcon } from "@/components/logo";

// PlayerJoin now redirects to PlayerAuth for proper email/password authentication
export default function PlayerJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partyCode = searchParams.get("code") || "";
  const isHostJoining = searchParams.get("host") === "true";

  useEffect(() => {
    if (!partyCode) {
      navigate("/");
      return;
    }

    // Redirect to the new auth flow
    const params = new URLSearchParams();
    params.set("code", partyCode);
    if (isHostJoining) {
      params.set("host", "true");
    }
    navigate(`/player/auth?${params.toString()}`, { replace: true });
  }, [partyCode, isHostJoining, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="relative z-10 text-center space-y-4">
        <RingIcon size={56} className="mx-auto" />
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
