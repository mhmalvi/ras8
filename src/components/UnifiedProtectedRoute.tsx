/**
 * Unified Protected Route - Replaces fragmented authentication guards
 * 
 * This component consolidates all route protection logic into a single
 * authoritative guard that uses the landing resolver to make routing decisions.
 * Replaces AtomicProtectedRoute, MerchantProtectedRoute, etc.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { 
  resolveLandingRoute, 
  LandingDecision, 
  LandingContext,
  shouldRedirect,
  detectEmbeddedContext,
  extractShopDomain 
} from '@/utils/landingResolver';

interface UnifiedProtectedRouteProps {
  children: ReactNode;
  /**
   * Routes that should bypass protection (e.g., public pages, auth pages)
   */
  bypassProtection?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  /**
   * Custom error component
   */
  errorComponent?: ReactNode;
}

interface ProtectionState {
  decision: LandingDecision | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const UnifiedProtectedRoute = ({ 
  children, 
  bypassProtection = false,
  loadingComponent,
  errorComponent
}: UnifiedProtectedRouteProps) => {
  const { user, loading: authLoading, initialized: authInitialized, error: authError } = useAtomicAuth();
  const { isEmbedded } = useAppBridge();
  const location = useLocation();
  
  const [state, setState] = useState<ProtectionState>({
    decision: null,
    loading: true,
    error: null,
    initialized: false
  });

  // Resolve landing decision when user authentication is ready
  useEffect(() => {
    let isMounted = true;

    const resolveLanding = async () => {
      // Don't resolve if bypassing protection
      if (bypassProtection) {
        if (isMounted) {
          setState({
            decision: { route: location.pathname, reason: "integrated-active" },
            loading: false,
            error: null,
            initialized: true
          });
        }
        return;
      }

      // Don't resolve until auth is ready
      if (!authInitialized || authLoading) {
        return;
      }

      // Handle auth errors
      if (authError) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: `Authentication error: ${authError}`,
            loading: false,
            initialized: true
          }));
        }
        return;
      }

      // No user means redirect to auth
      if (!user) {
        if (isMounted) {
          setState({
            decision: { route: "/auth", reason: "no-merchant-link" },
            loading: false,
            error: null,
            initialized: true
          });
        }
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Build context for landing resolver
        const shopDomain = await extractShopDomain(user.id);
        const context: LandingContext = {
          userId: user.id,
          isEmbedded: isEmbedded || detectEmbeddedContext(),
          shopDomain,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        };

        console.log('🔍 Resolving landing for authenticated user:', {
          userId: user.id,
          currentPath: location.pathname,
          context: {
            isEmbedded: context.isEmbedded,
            shopDomain: context.shopDomain
          }
        });

        const decision = await resolveLandingRoute(context);

        if (isMounted) {
          setState({
            decision,
            loading: false,
            error: null,
            initialized: true
          });
        }

      } catch (error) {
        console.error('❌ Landing resolution failed:', error);
        if (isMounted) {
          setState({
            decision: { route: "/error", reason: "unexpected" },
            loading: false,
            error: error instanceof Error ? error.message : 'Landing resolution failed',
            initialized: true
          });
        }
      }
    };

    resolveLanding();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, authInitialized, authError, location.pathname, isEmbedded, bypassProtection]);

  // Show loading state
  if (!state.initialized || state.loading || authLoading || !authInitialized) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Checking authentication...
            </h3>
            <p className="text-sm text-gray-600">
              {authLoading ? 'Verifying your session' : 'Determining landing page'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle errors
  if (state.error || authError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Error
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {state.error || authError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if we need to redirect based on landing decision
  const { decision } = state;
  if (decision && shouldRedirect(decision, location.pathname)) {
    console.log('🚀 Redirecting based on landing decision:', {
      from: location.pathname,
      to: decision.route,
      reason: decision.reason
    });

    // Special handling for auth redirect with state
    if (decision.route === '/auth') {
      return <Navigate to="/auth" state={{ from: location, reason: decision.reason }} replace />;
    }

    return <Navigate to={decision.route} replace />;
  }

  // Special case: if we're on a route that doesn't match our decision but shouldn't redirect
  // (e.g., user is on /settings but decision says /dashboard), we allow it
  if (decision?.route !== location.pathname) {
    console.log('ℹ️ User on different route than decision suggests:', {
      currentPath: location.pathname,
      suggestedRoute: decision?.route,
      reason: decision?.reason,
      allowingAccess: true
    });
  }

  // User is authenticated and authorized, render protected content
  console.log('✅ Rendering protected content:', {
    userId: user?.id,
    currentPath: location.pathname,
    decision: decision?.reason
  });

  return <>{children}</>;
};

export default UnifiedProtectedRoute;

/**
 * Higher-order component for easy route protection
 */
export function withUnifiedProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    bypassProtection?: boolean;
    loadingComponent?: ReactNode;
    errorComponent?: ReactNode;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <UnifiedProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </UnifiedProtectedRoute>
    );
  };
}

/**
 * Hook for accessing landing decision in components
 */
export function useLandingDecision() {
  const { user } = useAtomicAuth();
  const [decision, setDecision] = useState<LandingDecision | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshDecision = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const shopDomain = await extractShopDomain(user.id);
      const context: LandingContext = {
        userId: user.id,
        isEmbedded: detectEmbeddedContext(),
        shopDomain,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      };
      
      const newDecision = await resolveLandingRoute(context);
      setDecision(newDecision);
    } catch (error) {
      console.error('Error refreshing landing decision:', error);
      setDecision({ route: "/error", reason: "unexpected" });
    } finally {
      setLoading(false);
    }
  };

  return {
    decision,
    loading,
    refreshDecision
  };
}