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
import ViewAllPicks from "./pages/ViewAllPicks";

import PlatformAdminVerify from "./pages/PlatformAdminVerify";
import WrestlerAdmin from "./pages/WrestlerAdmin";
import Legal from "./pages/Legal";
import SoloSetup from "./pages/SoloSetup";
import SoloPicks from "./pages/SoloPicks";
import SoloDashboard from "./pages/SoloDashboard";

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
          <Route path="/host/:code/picks" element={<ViewAllPicks />} />
          <Route path="/tv/:code" element={<TvDisplay />} />
          
          <Route path="/platform-admin/verify" element={<PlatformAdminVerify />} />
          <Route path="/admin/wrestlers" element={<WrestlerAdmin />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/solo/setup" element={<SoloSetup />} />
          <Route path="/solo/picks" element={<SoloPicks />} />
          <Route path="/solo/dashboard" element={<SoloDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
