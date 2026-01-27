import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PlayerJoin from "./pages/PlayerJoin";
import PlayerPicks from "./pages/PlayerPicks";
import PlayerDashboard from "./pages/PlayerDashboard";
import HostVerifyPin from "./pages/HostVerifyPin";
import HostSetup from "./pages/HostSetup";
import HostControl from "./pages/HostControl";
import TvDisplay from "./pages/TvDisplay";
import PlatformAdmin from "./pages/PlatformAdmin";
import PlatformAdminVerify from "./pages/PlatformAdminVerify";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/player/join" element={<PlayerJoin />} />
          <Route path="/player/picks/:code" element={<PlayerPicks />} />
          <Route path="/player/dashboard/:code" element={<PlayerDashboard />} />
          <Route path="/host/verify-pin/:code" element={<HostVerifyPin />} />
          <Route path="/host/setup/:code" element={<HostSetup />} />
          <Route path="/host/control/:code" element={<HostControl />} />
          <Route path="/tv/:code" element={<TvDisplay />} />
          <Route path="/platform-admin" element={<PlatformAdmin />} />
          <Route path="/platform-admin/verify" element={<PlatformAdminVerify />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
