
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
import DebugPanel from '@/pages/DebugPanel';
import Database from '@/pages/Database';
import Logs from '@/pages/Logs';
import ApiMonitor from '@/pages/ApiMonitor';
import UserManagement from '@/pages/UserManagement';
import SystemReports from '@/pages/SystemReports';
import SupportCenter from '@/pages/SupportCenter';

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
          
          {/* Master Admin Routes - completely isolated */}
          <Route 
            path="/master-admin" 
            element={<MasterAdmin />}
          />
          <Route 
            path="/debug" 
            element={<DebugPanel />}
          />
          <Route 
            path="/database" 
            element={<Database />}
          />
          <Route 
            path="/logs" 
            element={<Logs />}
          />
          <Route 
            path="/api-monitor" 
            element={<ApiMonitor />}
          />
          <Route 
            path="/user-management" 
            element={<UserManagement />}
          />
          <Route 
            path="/system-reports" 
            element={<SystemReports />}
          />
          <Route 
            path="/support" 
            element={<SupportCenter />}
          />
          
          {/* Protected Merchant Routes - isolated from master admin */}
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
