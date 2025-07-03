
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import all pages
import Index from "./pages/Index";
import Returns from "./pages/Returns";
import Analytics from "./pages/Analytics";
import AIInsights from "./pages/AIInsights";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Automations from "./pages/Automations";
import Security from "./pages/Security";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import CustomerPortal from "./pages/CustomerPortal";
import TestData from "./pages/TestData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/portal" element={<CustomerPortal />} />
            
            {/* Protected routes with sidebar */}
            <Route path="/*" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/returns" element={<Returns />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/ai-insights" element={<AIInsights />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/performance" element={<Performance />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/automations" element={<Automations />} />
                        <Route path="/security" element={<Security />} />
                        <Route path="/test-data" element={<TestData />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
