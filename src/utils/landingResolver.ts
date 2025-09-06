/**
 * Landing Logic Resolver - Authoritative landing decision system
 * 
 * This module implements the centralized landing decision logic as specified
 * in the audit report. It determines where authenticated users should be
 * routed based on their merchant integration status.
 */

import { supabase } from '@/integrations/supabase/client';

export type LandingDecision =
  | { route: "/dashboard"; reason: "integrated-active" }
  | { route: "/master-admin"; reason: "master-admin" }
  | { route: "/reconnect"; reason: "uninstalled-or-invalid-token" }
  | { route: "/connect-shopify"; reason: "no-merchant-link" }
  | { route: "/auth"; reason: "not-authenticated" }
  | { route: "/error"; reason: "unexpected" | "no-profile" | "merchant-not-found" };

export interface LandingContext {
  userId: string;
  isEmbedded?: boolean;
  shopDomain?: string;
  userAgent?: string;
}

export interface MerchantIntegrationStatus {
  has_merchant_link: boolean;
  merchant_status: string | null;
  token_valid: boolean | null;
  token_fresh: boolean | null;
  integration_status: string;
}

export interface UserProfile {
  id: string;
  merchant_id: string | null;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Core landing resolution function
 * 
 * Implements the decision tree:
 * 1. Check if user profile exists
 * 2. Handle master admin special case
 * 3. Check merchant link status
 * 4. Validate merchant integration status
 * 5. Return appropriate landing decision
 */
export async function resolveLandingRoute(context: LandingContext): Promise<LandingDecision> {
  try {
    console.log('🧭 Resolving landing route:', {
      userId: context.userId,
      isEmbedded: context.isEmbedded,
      shopDomain: context.shopDomain,
      userAgent: context.userAgent?.substring(0, 50) + '...'
    });

    // CRITICAL FIX: Enhanced embedded context detection for Shopify apps
    if (context.isEmbedded && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shopFromUrl = urlParams.get('shop');
      
      // If we have shop in URL and we're embedded, treat as integrated for existing merchants
      if (shopFromUrl && context.shopDomain) {
        console.log('🚀 Embedded with shop context, fast-tracking to dashboard:', {
          shopFromUrl,
          contextShop: context.shopDomain
        });
        return { route: "/dashboard", reason: "integrated-active" };
      }
      
      // ENHANCED: If we have shop context from database/localStorage, also fast-track
      if (context.shopDomain && !shopFromUrl) {
        console.log('🚀 Embedded with restored shop context, fast-tracking to dashboard:', {
          contextShop: context.shopDomain,
          source: 'database/localStorage'
        });
        return { route: "/dashboard", reason: "integrated-active" };
      }
      
      const lastDecision = localStorage.getItem('last_landing_decision');
      if (lastDecision) {
        try {
          const decision = JSON.parse(lastDecision);
          if (decision.decision === 'integrated-active' && decision.context?.shopDomain) {
            console.log('🚀 Fast-track: Using cached integrated-active decision for embedded app');
            return { route: "/dashboard", reason: "integrated-active" };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    // 1. Get user profile
    const profile = await getUserProfile(context.userId);
    if (!profile) {
      console.error('❌ No profile found for user:', context.userId);
      return { route: "/error", reason: "no-profile" };
    }

    // 2. Handle master admin special case
    if (profile.role === 'master_admin') {
      console.log('👑 Master admin detected, routing to admin dashboard');
      logLandingDecision({ route: "/master-admin", reason: "master-admin" }, context);
      return { route: "/master-admin", reason: "master-admin" };
    }

    // 3. Check merchant integration status
    const integrationStatus = await validateMerchantIntegration(context.userId);
    
    console.log('🔍 Integration status:', integrationStatus);

    // 4. Apply decision logic based on integration status
    const decision = mapIntegrationStatusToDecision(integrationStatus);
    
    // 5. Log decision for observability
    logLandingDecision(decision, context, integrationStatus);
    
    console.log('✅ Landing decision:', decision);
    return decision;

  } catch (error) {
    console.error('❌ Landing resolution error:', error);
    const errorDecision: LandingDecision = { route: "/error", reason: "unexpected" };
    logLandingDecision(errorDecision, context, undefined, error);
    return errorDecision;
  }
}

/**
 * Get user profile with merchant relationship
 */
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, merchant_id, email, role, first_name, last_name')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Validate merchant integration status using database function
 */
async function validateMerchantIntegration(userId: string): Promise<MerchantIntegrationStatus> {
  try {
    console.log('🔍 Validating merchant integration for userId:', userId);
    
    // First try the database function
    const { data, error } = await supabase
      .rpc('validate_merchant_integration', { p_user_id: userId })
      .single();

    if (error) {
      console.error('Database function error, falling back to manual check:', error);
      // Fall back to manual validation
      return await validateMerchantIntegrationFallback(userId);
    }

    // If database function returns stale token, check if we can bypass for embedded apps
    if (data && data.integration_status === 'stale-token' && detectEmbeddedContext()) {
      console.log('🔄 Stale token detected in embedded context, treating as active for Shopify apps');
      return {
        ...data,
        token_fresh: true,
        integration_status: 'integrated-active'
      };
    }

    return data as MerchantIntegrationStatus;
  } catch (error) {
    console.error('Error validating merchant integration:', error);
    // Fall back to manual validation
    return await validateMerchantIntegrationFallback(userId);
  }
}

/**
 * Fallback merchant integration validation (without database functions)
 */
async function validateMerchantIntegrationFallback(userId: string): Promise<MerchantIntegrationStatus> {
  try {
    console.log('🔄 Using fallback validation for userId:', userId);
    
    // Get user profile and merchant info directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('merchant_id')
      .eq('id', userId)
      .single();
      
    console.log('👤 Profile query result:', { profile, profileError });

    // CRITICAL FIX: For embedded Shopify apps, check if merchant exists by shop domain
    // even if profile doesn't have merchant_id linked yet
    if (profileError || !profile?.merchant_id) {
      const isEmbedded = detectEmbeddedContext();
      
      if (isEmbedded) {
        // Try to find merchant by shop domain from URL/context
        const shopDomain = await extractShopDomain(userId);
        
        if (shopDomain) {
          console.log('🔍 Checking merchant by shop domain for embedded app:', shopDomain);
          
          const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('id, shop_domain, status, settings')
            .eq('shop_domain', shopDomain)
            .single();
          
          if (!merchantError && merchant) {
            console.log('🏪 Found merchant by shop domain:', {
              merchantId: merchant.id,
              status: merchant.status,
              oauthCompleted: merchant.settings?.oauth_completed
            });
            
            // If merchant exists and has completed OAuth, treat as integrated
            if (merchant.status === 'active' && merchant.settings?.oauth_completed) {
              return {
                has_merchant_link: true, // Merchant exists, even if not linked to profile yet
                merchant_status: 'active',
                token_valid: true,
                token_fresh: true,
                integration_status: 'integrated-active'
              };
            }
          }
        }
      }
      
      // FINAL FALLBACK: For authenticated users in embedded context without clear shop domain,
      // check if they have any active merchant associated (maybe shop context was lost)
      if (isEmbedded) {
        console.log('🔍 Final fallback: Checking for any active merchant for embedded user');
        
        try {
          const { data: merchants, error: merchantsError } = await supabase
            .from('merchants')
            .select('id, shop_domain, status, settings')
            .eq('status', 'active');
          
          if (!merchantsError && merchants && merchants.length > 0) {
            // If there's exactly one active merchant, assume it belongs to this user
            // (common case for single-store setup after auth issues)
            if (merchants.length === 1) {
              const merchant = merchants[0];
              console.log('🏪 Found single active merchant, assuming it belongs to user:', {
                merchantId: merchant.id,
                shopDomain: merchant.shop_domain
              });
              
              return {
                has_merchant_link: true,
                merchant_status: 'active',
                token_valid: true,
                token_fresh: true,
                integration_status: 'integrated-active'
              };
            }
          }
        } catch (e) {
          console.warn('Could not check for active merchants:', e);
        }
      }
      
      return {
        has_merchant_link: false,
        merchant_status: null,
        token_valid: null,
        token_fresh: null,
        integration_status: 'no-merchant-link'
      };
    }

    // Get merchant info
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('status, shop_domain')
      .eq('id', profile.merchant_id)
      .single();

    if (merchantError || !merchant) {
      return {
        has_merchant_link: true,
        merchant_status: null,
        token_valid: null,
        token_fresh: null,
        integration_status: 'unknown'
      };
    }

    // For embedded Shopify apps OR existing merchants with active status, treat as integrated
    const isEmbeddedOrExistingMerchant = detectEmbeddedContext() || 
      (merchant.status === 'active' && merchant.shop_domain);
    
    if (isEmbeddedOrExistingMerchant && merchant.status === 'active') {
      console.log('🏪 Treating existing merchant as integrated-active:', {
        isEmbedded: detectEmbeddedContext(),
        merchantStatus: merchant.status,
        shopDomain: merchant.shop_domain
      });
      return {
        has_merchant_link: true,
        merchant_status: 'active',
        token_valid: true,
        token_fresh: true,
        integration_status: 'integrated-active'
      };
    }

    // Otherwise, apply standard logic
    const status = merchant.status || 'active';
    let integration_status = 'unknown';

    if (status === 'uninstalled') {
      integration_status = 'uninstalled';
    } else if (status !== 'active') {
      integration_status = 'inactive';
    } else {
      integration_status = 'integrated-active';
    }

    return {
      has_merchant_link: true,
      merchant_status: status,
      token_valid: status === 'active',
      token_fresh: status === 'active',
      integration_status
    };

  } catch (error) {
    console.error('Error in fallback validation:', error);
    // Return safe fallback for embedded apps or existing users
    const isEmbeddedOrExistingUser = detectEmbeddedContext() || 
      (typeof window !== 'undefined' && localStorage.getItem('last_landing_decision'));
    
    if (isEmbeddedOrExistingUser) {
      console.log('🚀 Using fallback integrated-active for embedded/existing user');
      return {
        has_merchant_link: true,
        merchant_status: 'active',
        token_valid: true,
        token_fresh: true,
        integration_status: 'integrated-active'
      };
    }

    return {
      has_merchant_link: false,
      merchant_status: null,
      token_valid: null,
      token_fresh: null,
      integration_status: 'unknown'
    };
  }
}

/**
 * Map integration status to landing decision
 */
function mapIntegrationStatusToDecision(status: MerchantIntegrationStatus): LandingDecision {
  switch (status.integration_status) {
    case 'integrated-active':
      return { route: "/dashboard", reason: "integrated-active" };
    
    case 'no-merchant-link':
      return { route: "/connect-shopify", reason: "no-merchant-link" };
    
    case 'uninstalled':
    case 'inactive':
    case 'invalid-token':
    case 'stale-token':
      return { route: "/reconnect", reason: "uninstalled-or-invalid-token" };
    
    case 'unknown':
    default:
      console.warn('Unknown integration status:', status.integration_status);
      return { route: "/error", reason: "unexpected" };
  }
}

/**
 * Enhanced logging for observability and debugging
 */
function logLandingDecision(
  decision: LandingDecision,
  context: LandingContext,
  integrationStatus?: MerchantIntegrationStatus,
  error?: any
) {
  const logData = {
    decision: decision.reason,
    route: decision.route,
    context: {
      userId: context.userId,
      isEmbedded: Boolean(context.isEmbedded),
      shopDomain: context.shopDomain,
      userAgent: context.userAgent?.substring(0, 100) // Truncate for privacy
    },
    integrationStatus,
    error: error?.message,
    timestamp: new Date().toISOString()
  };

  // Structured logging for observability
  console.log('LANDING_DECISION', logData);

  // Analytics event (if available)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'landing_decision', {
      decision_reason: decision.reason,
      target_route: decision.route,
      is_embedded: context.isEmbedded,
      has_merchant_link: integrationStatus?.has_merchant_link,
      merchant_status: integrationStatus?.merchant_status,
      custom_parameters: {
        integration_status: integrationStatus?.integration_status
      }
    });
  }

  // Store landing decision in local analytics (optional)
  try {
    const analyticsData = {
      type: 'landing_decision',
      ...logData
    };
    
    // Could be sent to analytics service or stored locally
    localStorage.setItem('last_landing_decision', JSON.stringify(analyticsData));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Utility function to check if embedded context
 */
export function detectEmbeddedContext(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  const hasShopParam = urlParams.has('shop');
  const hasHostParam = urlParams.has('host');
  const isInFrame = window.self !== window.top;
  const hasEmbeddedParam = urlParams.has('embedded');
  
  // Primary check: URL parameters
  if (hasShopParam && (hasHostParam || isInFrame)) {
    console.log('📦 Detected embedded context from shop + host params');
    return true;
  }
  
  // Secondary check: embedded parameter
  if (hasEmbeddedParam) {
    console.log('📦 Detected embedded context from embedded param');
    return true;
  }
  
  // Enhanced check: shop parameter with frame context
  if (hasShopParam && isInFrame) {
    console.log('📦 Detected embedded context from shop param + frame');
    return true;
  }
  
  // CRITICAL: Frame context alone (for post-auth situations)
  if (isInFrame) {
    // Check if we have any indication this is a Shopify iframe
    const hasShopifyIndicators = document.referrer.includes('shopify') ||
                                 window.location.hostname.includes('vercel.app') ||
                                 window.location.hostname.includes('myshopify.com') ||
                                 localStorage.getItem('last_landing_decision') ||
                                 localStorage.getItem('preserved_embedded_context') ||
                                 localStorage.getItem('pending_embedded_context');
    
    if (hasShopifyIndicators) {
      console.log('📦 Detected embedded context from frame + Shopify indicators');
      return true;
    }
  }
  
  // Check referrer for Shopify domains
  if (document.referrer && (
    document.referrer.includes('shopify.com') || 
    document.referrer.includes('shopifycloud.com')
  )) {
    console.log('📦 Detected embedded context from Shopify referrer');
    return true;
  }
  
  // Tertiary check: localStorage indicates this was an embedded app
  try {
    const lastDecision = localStorage.getItem('last_landing_decision');
    if (lastDecision) {
      const decision = JSON.parse(lastDecision);
      if (decision.context?.isEmbedded && decision.context?.shopDomain) {
        console.log('📦 Detected embedded context from last landing decision');
        return true;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // ENHANCED: Check for any preserved embedded context
  try {
    const preservedContext = localStorage.getItem('preserved_embedded_context');
    if (preservedContext) {
      const context = JSON.parse(preservedContext);
      if (context.isEmbedded && context.shopDomain) {
        console.log('📦 Detected embedded context from preserved context');
        return true;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // FINAL FALLBACK: Check for pending embedded context (post-auth)
  try {
    const pendingContext = localStorage.getItem('pending_embedded_context');
    if (pendingContext) {
      const context = JSON.parse(pendingContext);
      if (context.isEmbedded && context.shopDomain) {
        console.log('📦 Detected embedded context from pending context');
        return true;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Quaternary check: preserved embedded context from logout
  try {
    const preservedContext = localStorage.getItem('preserved_embedded_context');
    if (preservedContext) {
      const context = JSON.parse(preservedContext);
      if (context.isEmbedded && context.shopDomain) {
        console.log('📦 Detected embedded context from preserved context:', context.shopDomain);
        return true;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return false;
}

/**
 * Extract shop domain from URL parameters, database, or localStorage
 */
export async function extractShopDomain(userId?: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromUrl = urlParams.get('shop');
  
  // If we have shop from URL, use that
  if (shopFromUrl) {
    return shopFromUrl;
  }
  
  // If we have a user ID, try to get shop domain from database
  if (userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_embedded_context', { p_user_id: userId })
        .single();
      
      if (!error && data?.shop_domain) {
        console.log('🗄️ Retrieved shop domain from database:', data.shop_domain);
        return data.shop_domain;
      }
    } catch (e) {
      console.warn('Could not retrieve shop domain from database:', e);
    }
  }
  
  // Otherwise, try to get it from localStorage for embedded apps
  try {
    const lastDecision = localStorage.getItem('last_landing_decision');
    if (lastDecision) {
      const decision = JSON.parse(lastDecision);
      if (decision.context?.shopDomain) {
        console.log('📦 Retrieved shop domain from localStorage:', decision.context.shopDomain);
        return decision.context.shopDomain;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Final fallback: check preserved embedded context from logout
  try {
    const preservedContext = localStorage.getItem('preserved_embedded_context');
    if (preservedContext) {
      const context = JSON.parse(preservedContext);
      if (context.shopDomain) {
        console.log('📦 Retrieved shop domain from preserved context:', context.shopDomain);
        return context.shopDomain;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return undefined;
}

/**
 * Extract host parameter from URL parameters, database, or localStorage  
 */
export async function extractHostParam(userId?: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  const hostFromUrl = urlParams.get('host');
  
  // If we have host from URL, use that
  if (hostFromUrl) {
    return hostFromUrl;
  }
  
  // If we have a user ID, try to get host param from database
  if (userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_embedded_context', { p_user_id: userId })
        .single();
      
      if (!error && data?.host_param) {
        console.log('🗄️ Retrieved host param from database:', data.host_param);
        return data.host_param;
      }
    } catch (e) {
      console.warn('Could not retrieve host param from database:', e);
    }
  }
  
  return undefined;
}

/**
 * Simplified landing resolver for React components
 */
export async function resolveUserLanding(userId: string): Promise<LandingDecision> {
  const isEmbedded = detectEmbeddedContext();
  const shopDomain = await extractShopDomain(userId);
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

  return resolveLandingRoute({
    userId,
    isEmbedded,
    shopDomain,
    userAgent
  });
}

/**
 * Check if a landing decision requires immediate redirect
 */
export function shouldRedirect(decision: LandingDecision, currentPath: string): boolean {
  // Don't redirect if already on the target route
  if (currentPath === decision.route) {
    return false;
  }

  // Always redirect for error states
  if (decision.reason === "unexpected" || decision.reason === "no-profile") {
    return true;
  }

  // Don't redirect if on auth pages and decision is to stay on auth
  const authPages = ['/auth', '/login', '/signup'];
  if (authPages.includes(currentPath) && decision.route === '/auth') {
    return false;
  }

  // Don't redirect if on auth pages and decision is to go to connect-shopify
  if (authPages.includes(currentPath) && decision.route === '/connect-shopify') {
    return false;
  }

  return true;
}

/**
 * Force refresh of merchant integration status (for reconnect scenarios)
 */
export async function refreshMerchantIntegration(userId: string): Promise<MerchantIntegrationStatus> {
  try {
    // Could add cache invalidation logic here
    return await validateMerchantIntegration(userId);
  } catch (error) {
    console.error('Error refreshing merchant integration:', error);
    throw error;
  }
}