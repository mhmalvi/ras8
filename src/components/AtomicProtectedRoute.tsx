
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { supabase } from '@/integrations/supabase/client';

interface AtomicProtectedRouteProps {
  children: ReactNode;
}

const AtomicProtectedRoute = ({ children }: AtomicProtectedRouteProps) => {
  const { user, loading, initialized, error } = useAtomicAuth();
  const { isEmbedded } = useAppBridge();
  const location = useLocation();
  const { profile } = useMerchantProfile(); // Move ALL hooks to the top
  const [shopifySessionValid, setShopifySessionValid] = useState(false);
  const [validatingShopifySession, setValidatingShopifySession] = useState(true);
  
  // For embedded apps, check if we have shop parameters
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');

  // Validate Shopify session for embedded apps
  useEffect(() => {
    const validateShopifySession = async () => {
      if (!isEmbedded || !shop) {
        setValidatingShopifySession(false);
        return;
      }
      
      try {
        // Check if we have a valid merchant record for this shop
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id, shop_domain, settings')
          .eq('shop_domain', shop)
          .single();
          
        if (merchant && merchant.settings?.oauth_completed) {
          console.log('✅ Valid Shopify session found for shop:', shop);
          setShopifySessionValid(true);
        } else {
          console.log('❌ No authenticated user - merchant record:', { merchant, hasSettings: !!merchant?.settings, oauthCompleted: merchant?.settings?.oauth_completed });
          setShopifySessionValid(false);
        }
      } catch (error) {
        console.error('Error validating Shopify session:', error);
        setShopifySessionValid(false);
      } finally {
        setValidatingShopifySession(false);
      }
    };

    validateShopifySession();
  }, [isEmbedded, shop]);

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
  
  // Show loading while validating Shopify session for embedded apps
  if (isEmbedded && validatingShopifySession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Validating Shopify session...</span>
        </div>
      </div>
    );
  }

  // Handle auth errors
  if (error) {
    console.error('🔒 Authentication error in protected route:', error);
    return <Navigate to="/auth" state={{ from: location, error }} replace />;
  }

  // If not authenticated, handle differently for embedded vs standalone apps
  if (!user) {
    // For embedded apps with valid shop parameters AND valid Shopify session, allow access
    if (isEmbedded && shop && shopifySessionValid) {
      console.log('🏪 Embedded app with valid Shopify session, allowing access:', { shop, host });
      return <>{children}</>;
    }
    
    // For embedded apps without valid session, redirect to OAuth flow
    if (isEmbedded && shop && !shopifySessionValid) {
      const installUrl = `/shopify/install?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host || '')}`;
      return <Navigate to={installUrl} replace />;
    }
    
    // For standalone apps or embedded apps without shop, require authentication
    return <Navigate to="/auth" state={{ from: location }} replace />;
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

  // User is authenticated, render the protected content
  // User authenticated, render protected content
  return <>{children}</>;
};

export default AtomicProtectedRoute;
