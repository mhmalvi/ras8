import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Returns from "./pages/Returns";
import CustomerPortal from "./pages/CustomerPortal";
import ShopifyInstall from "./pages/ShopifyInstall";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AIInsights from "./pages/AIInsights";
import Automations from "./pages/Automations";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Performance from "./pages/Performance";
import Security from "./pages/Security";
import Notifications from "./pages/Notifications";
import TestData from "./pages/TestData";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import "./App.css";

// Create QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Default landing page */}
              <Route path="/landing" element={<Landing />} />
              
              {/* Public routes */}
              <Route path="/customer-portal" element={<CustomerPortal />} />
              <Route path="/shopify/install" element={<ShopifyInstall />} />
              
              {/* Auth routes */}
              <Route 
                path="/auth" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Auth />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/returns" 
                element={
                  <ProtectedRoute>
                    <Returns />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-insights" 
                element={
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/automations" 
                element={
                  <ProtectedRoute>
                    <Automations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/performance" 
                element={
                  <ProtectedRoute>
                    <Performance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/security" 
                element={
                  <ProtectedRoute>
                    <Security />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/test-data" 
                element={
                  <ProtectedRoute>
                    <TestData />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;