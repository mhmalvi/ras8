
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Returns from '@/pages/Returns';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import CustomerPortal from '@/pages/CustomerPortal';
import Automations from '@/pages/Automations';
import MasterAdmin from '@/pages/MasterAdmin';

const AppRouter = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<Index />} />
          <Route path="/return-portal" element={<CustomerPortal />} />
          
          {/* Auth Route - only accessible when logged out */}
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } 
          />
          
          {/* Master Admin Route */}
          <Route 
            path="/master-admin" 
            element={
              <ProtectedRoute>
                <MasterAdmin />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Dashboard is at root "/" */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/automations" 
            element={
              <ProtectedRoute>
                <Automations />
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
          
          {/* Catch all - redirect to dashboard for authenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster />
    </AuthProvider>
  );
};

export default AppRouter;
