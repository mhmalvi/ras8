
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';

interface AtomicProtectedRouteProps {
  children: ReactNode;
}

const AtomicProtectedRoute = ({ children }: AtomicProtectedRouteProps) => {
  const { user, loading, initialized, error } = useAtomicAuth();
  const location = useLocation();

  // Show loading only while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Handle auth errors
  if (error) {
    console.error('🔒 Authentication error in protected route:', error);
    return <Navigate to="/auth" state={{ from: location, error }} replace />;
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    console.log('🔒 Authentication required, redirecting to auth page');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Special handling for master admin - ensure they go to master admin dashboard
  // But only if they're specifically trying to access the root or dashboard AND not already on master admin
  const currentPath = location.pathname;
  const isMasterAdmin = user.email === 'aalvi.hm@gmail.com';
  const isOnRootOrDashboard = currentPath === '/' || currentPath === '/dashboard';
  const isNotOnMasterAdmin = currentPath !== '/master-admin';
  
  if (isMasterAdmin && isOnRootOrDashboard && isNotOnMasterAdmin) {
    console.log('🔄 Master admin detected, redirecting to master admin dashboard');
    return <Navigate to="/master-admin" replace />;
  }

  // User is authenticated, render the protected content
  console.log('✅ User authenticated, rendering protected route');
  return <>{children}</>;
};

export default AtomicProtectedRoute;
