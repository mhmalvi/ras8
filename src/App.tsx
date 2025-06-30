
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Returns from "./pages/Returns";
import Analytics from "./pages/Analytics";
import AIInsights from "./pages/AIInsights";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Performance from "./pages/Performance";
import Notifications from "./pages/Notifications";
import Automations from "./pages/Automations";
import CustomerPortal from "./pages/CustomerPortal";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Index />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
