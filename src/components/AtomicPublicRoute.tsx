
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

  // If authenticated, redirect appropriately based on context
  if (user) {
    // For standalone users, redirect to dashboard instead of index to avoid Shopify detection
    const urlParams = new URLSearchParams(window.location.search);
    const hasShopifyParams = urlParams.has('shop') || urlParams.has('host');
    
    const redirectPath = hasShopifyParams ? '/' : '/dashboard';
    console.log('🔄 AtomicPublicRoute: User authenticated, redirecting to:', redirectPath);
    
    return <Navigate to={redirectPath} replace />;
  }

  // User is not authenticated, render the public content
  return <>{children}</>;
};

export default AtomicPublicRoute;
