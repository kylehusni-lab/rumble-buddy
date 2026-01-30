import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Eagerly load the homepage for fast initial render
import HomePage from "./pages/HomePage";

// Lazy load all other pages to reduce initial bundle size
const JoinParty = lazy(() => import("./pages/JoinParty"));
const DemoMode = lazy(() => import("./pages/DemoMode"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PlayerJoin = lazy(() => import("./pages/PlayerJoin"));
const PlayerAuth = lazy(() => import("./pages/PlayerAuth"));
const PlayerPicks = lazy(() => import("./pages/PlayerPicks"));
const PlayerDashboard = lazy(() => import("./pages/PlayerDashboard"));
const HostVerifyPin = lazy(() => import("./pages/HostVerifyPin"));
const HostSetup = lazy(() => import("./pages/HostSetup"));
const HostControl = lazy(() => import("./pages/HostControl"));
const TvDisplay = lazy(() => import("./pages/TvDisplay"));
const ViewAllPicks = lazy(() => import("./pages/ViewAllPicks"));
const PlatformAdminVerify = lazy(() => import("./pages/PlatformAdminVerify"));
const WrestlerAdmin = lazy(() => import("./pages/WrestlerAdmin"));
const Legal = lazy(() => import("./pages/Legal"));
const SoloSetup = lazy(() => import("./pages/SoloSetup"));
const SoloPicks = lazy(() => import("./pages/SoloPicks"));
const SoloDashboard = lazy(() => import("./pages/SoloDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Homepage loads eagerly */}
            <Route path="/" element={<HomePage />} />
            
            {/* All other routes are lazy loaded */}
            <Route path="/join" element={<JoinParty />} />
            <Route path="/demo" element={<DemoMode />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/player/join" element={<PlayerJoin />} />
            <Route path="/player/auth" element={<PlayerAuth />} />
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
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/solo/setup" element={<SoloSetup />} />
            <Route path="/solo/picks" element={<SoloPicks />} />
            <Route path="/solo/dashboard" element={<SoloDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
