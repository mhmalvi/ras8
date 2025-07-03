import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sonner } from 'sonner';

import { Auth } from "@/pages/Auth";
import { AuthCallback } from "@/pages/AuthCallback";
import { Index } from "@/pages/Index";
import { Dashboard } from "@/pages/Dashboard";
import { Returns } from "@/pages/Returns";
import { Analytics } from "@/pages/Analytics";
import { AIInsights } from "@/pages/AIInsights";
import { Settings } from "@/pages/Settings";
import { CustomerPortal } from "@/pages/CustomerPortal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const queryClient = new QueryClient();

function App() {
  return (
    <GlobalErrorBoundary level="global">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/returns" element={
                <ProtectedRoute>
                  <Returns />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/ai-insights" element={
                <ProtectedRoute>
                  <AIInsights />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Customer Portal */}
              <Route path="/customer-portal" element={<CustomerPortal />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
