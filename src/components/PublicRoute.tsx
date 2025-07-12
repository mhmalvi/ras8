
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state with timeout protection
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated after loading, redirect to dashboard (root)
  if (user) {
    return <Navigate to="/" replace />;
  }

  // User is not authenticated, render the public content
  return <>{children}</>;
};

export default PublicRoute;
