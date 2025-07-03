
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

// Page imports
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Returns from "./pages/Returns";
import CustomerPortal from "./pages/CustomerPortal";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import TestData from "./pages/TestData";
import AIInsights from "./pages/AIInsights";
import Automations from "./pages/Automations";
import Performance from "./pages/Performance";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";
import ShopifyInstall from "./pages/ShopifyInstall";

const queryClient = new QueryClient();

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<ShopifyInstall />} />
              <Route path="/customer-portal" element={<CustomerPortal />} />
              
              {/* Protected routes with sidebar */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="flex-1 p-6">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/returns" element={<Returns />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/test-data" element={<TestData />} />
                          <Route path="/ai-insights" element={<AIInsights />} />
                          <Route path="/automations" element={<Automations />} />
                          <Route path="/performance" element={<Performance />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/security" element={<Security />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
