import React, { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMerchantSession } from '../contexts/MerchantSessionContext';

interface MerchantProtectedRouteProps {
  children: ReactNode;
}

export default function MerchantProtectedRoute({ children }: MerchantProtectedRouteProps) {
  const { session, isAuthenticated, loading, error } = useMerchantSession();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');
  const embedded = searchParams.get('embedded');
  
  const isEmbedded = embedded === '1' || !!host;

  console.log('🔍 MerchantProtectedRoute Analysis:', {
    isEmbedded,
    shop,
    host: host ? 'present' : 'missing',
    currentPath: location.pathname,
    search: location.search,
    isAuthenticated,
    loading,
    merchantId: session?.merchantId,
    shopDomain: session?.shopDomain
  });

  // Show loading state while validating session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For embedded apps with shop parameter but no valid session, redirect to OAuth
  if (isEmbedded && shop && !isAuthenticated) {
    console.log('🔄 Embedded app without session, redirecting to OAuth');
    const installUrl = `/shopify/install?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host || '')}`;
    return <Navigate to={installUrl} replace />;
  }

  // For embedded apps with valid session, verify shop domain matches
  if (isEmbedded && shop && isAuthenticated && session) {
    if (session.shopDomain !== shop) {
      console.log('⚠️ Shop domain mismatch, redirecting to OAuth');
      const installUrl = `/shopify/install?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host || '')}`;
      return <Navigate to={installUrl} replace />;
    }
    
    console.log('✅ Embedded app with valid session, allowing access');
    return <>{children}</>;
  }

  // For standalone apps (non-embedded) without authentication, redirect to auth
  if (!isEmbedded && !isAuthenticated) {
    console.log('🔄 Standalone app without session, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // For authenticated standalone apps, allow access
  if (!isEmbedded && isAuthenticated) {
    console.log('✅ Standalone app with valid session, allowing access');
    return <>{children}</>;
  }

  // Handle embedded apps without shop parameter
  if (isEmbedded && !shop) {
    console.log('❌ Embedded app without shop parameter');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid App Access</h1>
          <p className="text-gray-600">This app must be accessed from within Shopify Admin.</p>
        </div>
      </div>
    );
  }

  // If we reach here, there's an unexpected state
  console.error('❌ Unexpected authentication state:', { isEmbedded, shop, isAuthenticated, error });
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">{error || 'Unable to validate session'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}