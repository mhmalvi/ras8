import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { validateMerchantSession, getRedirectTarget, MerchantLinkStatus } from '@/services/merchantLinkService';

interface AtomicProtectedRouteProps {
  children: ReactNode;
}

const AtomicProtectedRoute = ({ children }: AtomicProtectedRouteProps) => {
  const { user, loading, initialized, error } = useAtomicAuth();
  const { isEmbedded } = useAppBridge();
  const location = useLocation();
  const { profile } = useMerchantProfile();
  const [merchantLinkStatus, setMerchantLinkStatus] = useState<MerchantLinkStatus | null>(null);
  const [validatingMerchantLink, setValidatingMerchantLink] = useState(true);
  
  // For embedded apps, check if we have shop parameters
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');

  // Unified merchant link validation
  useEffect(() => {
    const validateMerchantLink = async () => {
      // Skip validation if not authenticated or still loading
      if (!initialized || loading || !user) {
        setValidatingMerchantLink(false);
        return;
      }

      try {
        let status: MerchantLinkStatus;
        
        // For embedded apps, validate session via API
        if (isEmbedded && shop) {
          const response = await fetch(`/api/session/me?shop=${encodeURIComponent(shop)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (response.ok) {
            const sessionData = await response.json();
            if (sessionData.authenticated && sessionData.session) {
              status = await validateMerchantSession(sessionData.session, {
                requireShopMatch: shop
              });
            } else {
              status = { hasActiveMerchantLink: false, merchantStatus: 'none', reason: 'No session data' };
            }
          } else {
            status = { hasActiveMerchantLink: false, merchantStatus: 'revoked', reason: 'Session API failed' };
          }
        } else {
          // For standalone users, validate against user profile
          // This will be enhanced when we implement the user-merchant link table
          status = { hasActiveMerchantLink: false, merchantStatus: 'none', reason: 'Standalone user needs connection' };
        }

        console.log('🔍 Merchant link validation result:', { status, isEmbedded, shop, user: !!user });
        setMerchantLinkStatus(status);
      } catch (error) {
        console.error('Error validating merchant link:', error);
        setMerchantLinkStatus({
          hasActiveMerchantLink: false,
          merchantStatus: 'none',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setValidatingMerchantLink(false);
      }
    };

    validateMerchantLink();
  }, [initialized, loading, user, isEmbedded, shop]);

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
  
  // Show loading while validating merchant link
  if (validatingMerchantLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Validating merchant connection...</span>
        </div>
      </div>
    );
  }

  // Handle auth errors
  if (error) {
    console.error('🔒 Authentication error in protected route:', error);
    return <Navigate to="/auth" state={{ from: location, error }} replace />;
  }

  // If not authenticated, redirect to auth
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    const redirectTarget = getRedirectTarget(false, 
      { hasActiveMerchantLink: false, merchantStatus: 'none' }, 
      isEmbedded, shop, host, next
    );
    return <Navigate to={redirectTarget} replace />;
  }
  
  // If authenticated but no merchant link validation yet, wait
  if (!merchantLinkStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Validating access...</span>
        </div>
      </div>
    );
  }
  
  // If authenticated but no valid merchant link, redirect appropriately
  if (!merchantLinkStatus.hasActiveMerchantLink) {
    const next = `${location.pathname}${location.search}`;
    const redirectTarget = getRedirectTarget(true, merchantLinkStatus, isEmbedded, shop, host, next);
    console.log('🔄 Redirecting due to merchant link issue:', { merchantLinkStatus, redirectTarget });
    return <Navigate to={redirectTarget} replace />;
  }

  // Special handling for master admin - ensure they go to master admin dashboard
  // But only if they're specifically trying to access the root or dashboard AND not already on master admin
  const currentPath = location.pathname;
  const isMasterAdmin = profile?.role === 'master_admin';
  const isOnRootOrDashboard = currentPath === '/' || currentPath === '/dashboard';
  const isNotOnMasterAdmin = currentPath !== '/master-admin';
  
  if (isMasterAdmin && isOnRootOrDashboard && isNotOnMasterAdmin) {
    // Master admin role detected, redirect to admin dashboard
    return <Navigate to="/master-admin" replace />;
  }

  // User is authenticated and has valid merchant link, render the protected content
  console.log('✅ Access granted:', { user: !!user, merchantLink: merchantLinkStatus.hasActiveMerchantLink, shop, currentPath });
  return <>{children}</>;
};

export default AtomicProtectedRoute;