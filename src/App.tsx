import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AtomicAuthProvider } from "@/contexts/AtomicAuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Returns from "./pages/Returns";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Customers from "./pages/Customers";
import Notifications from "./pages/Notifications";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import MasterAdmin from "./pages/MasterAdmin";
import AtomicProtectedRoute from "./components/AtomicProtectedRoute";
import Webhooks from "./pages/Webhooks";
import WebhookDashboard from "./pages/WebhookDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AtomicAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <AtomicProtectedRoute>
                  <Dashboard />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/returns"
              element={
                <AtomicProtectedRoute>
                  <Returns />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <AtomicProtectedRoute>
                  <Analytics />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/webhooks"
              element={
                <AtomicProtectedRoute>
                  <Webhooks />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/webhook-dashboard"
              element={
                <AtomicProtectedRoute>
                  <WebhookDashboard />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <AtomicProtectedRoute>
                  <Performance />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <AtomicProtectedRoute>
                  <Customers />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <AtomicProtectedRoute>
                  <Notifications />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <AtomicProtectedRoute>
                  <Billing />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AtomicProtectedRoute>
                  <Settings />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <AtomicProtectedRoute>
                  <Support />
                </AtomicProtectedRoute>
              }
            />
            <Route
              path="/master-admin"
              element={
                <AtomicProtectedRoute>
                  <MasterAdmin />
                </AtomicProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AtomicAuthProvider>
  </QueryClientProvider>
);

export default App;
