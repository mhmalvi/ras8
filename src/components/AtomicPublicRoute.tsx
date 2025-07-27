
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';

interface AtomicPublicRouteProps {
  children: ReactNode;
}

const AtomicPublicRoute = ({ children }: AtomicPublicRouteProps) => {
  const { user, loading, initialized } = useAtomicAuth();

  // Show loading only while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard (root)
  if (user) {
    // User already authenticated, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  // User is not authenticated, render the public content
  return <>{children}</>;
};

export default AtomicPublicRoute;
