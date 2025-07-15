
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AtomicAuthProvider } from '@/contexts/AtomicAuthContext';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from 'react-error-boundary';
import AtomicProtectedRoute from '@/components/AtomicProtectedRoute';
import AtomicPublicRoute from '@/components/AtomicPublicRoute';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Returns from '@/pages/Returns';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import CustomerPortal from '@/pages/CustomerPortal';
import Automations from '@/pages/Automations';
import MasterAdmin from '@/pages/MasterAdmin';
import DebugPanel from '@/pages/DebugPanel';
import Database from '@/pages/Database';
import Logs from '@/pages/Logs';
import ApiMonitor from '@/pages/ApiMonitor';
import UserManagement from '@/pages/UserManagement';
import SystemReports from '@/pages/SystemReports';
import SupportCenter from '@/pages/SupportCenter';
import AIInsights from '@/pages/AIInsights';
import Customers from '@/pages/Customers';
import Products from '@/pages/Products';
import Performance from '@/pages/Performance';
import Billing from '@/pages/Billing';
import Notifications from '@/pages/Notifications';
import Security from '@/pages/Security';
import Integrations from '@/pages/Integrations';
import Webhooks from '@/pages/Webhooks';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4 p-6 max-w-md">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  </div>
);

const AtomicAppRouter = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('💥 App Error:', error, errorInfo);
      }}
    >
      <AtomicAuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={<Index />} />
            <Route path="/return-portal" element={<CustomerPortal />} />
            
            {/* Auth Route - only accessible when logged out */}
            <Route 
              path="/auth" 
              element={
                <AtomicPublicRoute>
                  <Auth />
                </AtomicPublicRoute>
              } 
            />
            
            {/* Master Admin Routes - highest security */}
            <Route 
              path="/master-admin" 
              element={
                <AtomicProtectedRoute>
                  <MasterAdmin />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/debug" 
              element={
                <AtomicProtectedRoute>
                  <DebugPanel />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/database" 
              element={
                <AtomicProtectedRoute>
                  <Database />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/logs" 
              element={
                <AtomicProtectedRoute>
                  <Logs />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/api-monitor" 
              element={
                <AtomicProtectedRoute>
                  <ApiMonitor />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/user-management" 
              element={
                <AtomicProtectedRoute>
                  <UserManagement />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/system-reports" 
              element={
                <AtomicProtectedRoute>
                  <SystemReports />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/support" 
              element={
                <AtomicProtectedRoute>
                  <SupportCenter />
                </AtomicProtectedRoute>
              } 
            />
            
            {/* Protected Routes - Dashboard is at root "/" */}
            <Route 
              path="/" 
              element={
                <AtomicProtectedRoute>
                  <Dashboard />
                </AtomicProtectedRoute>
              } 
            />
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
              path="/ai-insights" 
              element={
                <AtomicProtectedRoute>
                  <AIInsights />
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
              path="/products" 
              element={
                <AtomicProtectedRoute>
                  <Products />
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
              path="/notifications" 
              element={
                <AtomicProtectedRoute>
                  <Notifications />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/automations" 
              element={
                <AtomicProtectedRoute>
                  <Automations />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/security" 
              element={
                <AtomicProtectedRoute>
                  <Security />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/integrations" 
              element={
                <AtomicProtectedRoute>
                  <Integrations />
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
            
            {/* Error/Fallback Routes */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                  <p className="text-muted-foreground mb-4">You don't have permission to access this resource.</p>
                  <a href="/auth" className="text-primary hover:underline">Sign In</a>
                </div>
              </div>
            } />
            
            <Route path="/loading" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              </div>
            } />
            
            <Route path="/error" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-red-600 mb-2">An Error Occurred</h2>
                  <p className="text-muted-foreground mb-4">We're sorry, something went wrong.</p>
                  <a href="/" className="text-primary hover:underline">Go to Dashboard</a>
                </div>
              </div>
            } />
            
            {/* Catch all - redirect to dashboard for authenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster />
      </AtomicAuthProvider>
    </ErrorBoundary>
  );
};

export default AtomicAppRouter;
