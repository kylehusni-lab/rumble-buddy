import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TourProvider, TourOverlay } from "@/components/tour";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";

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

const HostSetup = lazy(() => import("./pages/HostSetup"));
const HostControl = lazy(() => import("./pages/HostControl"));
const TvDisplay = lazy(() => import("./pages/TvDisplay"));
const ViewAllPicks = lazy(() => import("./pages/ViewAllPicks"));

const Legal = lazy(() => import("./pages/Legal"));
const SoloSetup = lazy(() => import("./pages/SoloSetup"));
const SoloPicks = lazy(() => import("./pages/SoloPicks"));
const SoloDashboard = lazy(() => import("./pages/SoloDashboard"));
const SoloTvDisplay = lazy(() => import("./pages/SoloTvDisplay"));
const PickHistory = lazy(() => import("./pages/PickHistory"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SignIn = lazy(() => import("./pages/SignIn"));
const MyParties = lazy(() => import("./pages/MyParties"));

const queryClient = new QueryClient();

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      toast.error("An unexpected error occurred. Please try again.");
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <GlobalErrorHandler>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TourProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <TourOverlay />
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
                  
                  <Route path="/host/setup/:code" element={<HostSetup />} />
                  <Route path="/host/control/:code" element={<HostControl />} />
                  <Route path="/host/:code/picks" element={<ViewAllPicks />} />
                  <Route path="/tv/:code" element={<TvDisplay />} />
                  
                  
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/my-parties" element={<MyParties />} />

                  <Route path="/solo/setup" element={<SoloSetup />} />
                  <Route path="/solo/picks" element={<SoloPicks />} />
                  <Route path="/solo/dashboard" element={<SoloDashboard />} />
                  <Route path="/solo/tv" element={<SoloTvDisplay />} />
                  <Route path="/pick-history" element={<PickHistory />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TourProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorHandler>
  </ErrorBoundary>
);

export default App;
