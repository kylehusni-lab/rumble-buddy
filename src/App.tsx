import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// New OTT Pages
import HomePage from "./pages/HomePage";
import JoinParty from "./pages/JoinParty";
import DemoMode from "./pages/DemoMode";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Existing Pages (preserved)
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
          {/* New OTT Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinParty />} />
          <Route path="/demo" element={<DemoMode />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Preserved Player/Host Routes */}
          <Route path="/player/join" element={<PlayerJoin />} />
          <Route path="/player/picks/:code" element={<PlayerPicks />} />
          <Route path="/player/dashboard/:code" element={<PlayerDashboard />} />
          <Route path="/host/verify-pin/:code" element={<HostVerifyPin />} />
          <Route path="/host/setup/:code" element={<HostSetup />} />
          <Route path="/host/control/:code" element={<HostControl />} />
          <Route path="/host/:code/picks" element={<ViewAllPicks />} />
          <Route path="/tv/:code" element={<TvDisplay />} />
          
          {/* Preserved Admin/Platform Routes */}
          <Route path="/platform-admin/verify" element={<PlatformAdminVerify />} />
          <Route path="/admin/wrestlers" element={<WrestlerAdmin />} />
          <Route path="/legal" element={<Legal />} />

          {/* Preserved Solo Routes */}
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
