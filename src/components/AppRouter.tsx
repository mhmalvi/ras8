
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/contexts/AuthContext';

// Import other pages that exist in the read-only files
import Returns from '@/pages/Returns';
import Analytics from '@/pages/Analytics';
import AIInsights from '@/pages/AIInsights';
import Customers from '@/pages/Customers';
import Products from '@/pages/Products';
import Settings from '@/pages/Settings';
import Automations from '@/pages/Automations';
import CustomerPortal from '@/pages/CustomerPortal';
import Notifications from '@/pages/Notifications';
import Performance from '@/pages/Performance';
import Security from '@/pages/Security';
import NotFound from '@/pages/NotFound';

const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Default route redirects to landing */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      
      {/* Public routes - only accessible when not authenticated */}
      <Route 
        path="/landing" 
        element={
          <ProtectedRoute requireAuth={false}>
            <Landing />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/auth" 
        element={
          <ProtectedRoute requireAuth={false}>
            <Auth />
          </ProtectedRoute>
        } 
      />
      
      {/* Customer portal - accessible without auth */}
      <Route path="/customer-portal" element={<CustomerPortal />} />
      
      {/* Protected routes - only accessible when authenticated */}
      <Route 
        path="/dashboard" 
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
        path="/ai-insights" 
        element={
          <ProtectedRoute>
            <AIInsights />
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
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
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
        path="/notifications" 
        element={
          <ProtectedRoute>
            <Notifications />
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
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
