/**
 * Shopify Installation Utilities
 * Handles automatic shop detection, OAuth flow, and installation tracking
 */

export interface ShopInfo {
  shop: string;
  domain: string;
  isValid: boolean;
  source: 'url' | 'referrer' | 'manual' | 'detected';
}

export interface InstallationState {
  step: 'detecting' | 'ready' | 'authorizing' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  shop?: string;
  error?: string;
}

/**
 * Auto-detect shop domain from various sources
 */
export const detectShopDomain = (): ShopInfo | null => {
  // Method 1: Check URL parameters (most reliable)
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromUrl = urlParams.get('shop');
  
  if (shopFromUrl) {
    return {
      shop: shopFromUrl,
      domain: ensureShopifyDomain(shopFromUrl),
      isValid: validateShopDomain(shopFromUrl),
      source: 'url'
    };
  }

  // Method 2: Check referrer (when coming from Shopify admin)
  const referrer = document.referrer;
  if (referrer) {
    const shopFromReferrer = extractShopFromReferrer(referrer);
    if (shopFromReferrer) {
      return {
        shop: shopFromReferrer,
        domain: ensureShopifyDomain(shopFromReferrer),
        isValid: validateShopDomain(shopFromReferrer),
        source: 'referrer'
      };
    }
  }

  // Method 3: Check localStorage (previous installations)
  const savedShop = localStorage.getItem('shopify_shop');
  if (savedShop) {
    return {
      shop: savedShop,
      domain: ensureShopifyDomain(savedShop),
      isValid: validateShopDomain(savedShop),
      source: 'detected'
    };
  }

  return null;
};

/**
 * Extract shop domain from Shopify admin referrer URL
 */
export const extractShopFromReferrer = (referrer: string): string | null => {
  try {
    const url = new URL(referrer);
    
    // Pattern 1: admin.shopify.com/store/{shop}/...
    const adminMatch = url.pathname.match(/^\/store\/([^\/]+)/);
    if (adminMatch && url.hostname === 'admin.shopify.com') {
      return `${adminMatch[1]}.myshopify.com`;
    }

    // Pattern 2: {shop}.myshopify.com/admin/...
    const shopifyMatch = url.hostname.match(/^([^.]+)\.myshopify\.com$/);
    if (shopifyMatch) {
      return url.hostname;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Ensure shop domain has .myshopify.com suffix
 */
export const ensureShopifyDomain = (shop: string): string => {
  if (!shop) return '';
  
  // Remove protocol if present
  shop = shop.replace(/^https?:\/\//, '');
  
  // Add .myshopify.com if not present
  if (!shop.includes('.myshopify.com')) {
    return `${shop}.myshopify.com`;
  }
  
  return shop;
};

/**
 * Validate shop domain format
 */
export const validateShopDomain = (shop: string): boolean => {
  if (!shop) return false;
  
  const domain = ensureShopifyDomain(shop);
  
  // Basic validation: should be a valid Shopify domain
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]\.myshopify\.com$/;
  return shopifyDomainRegex.test(domain);
};

/**
 * Generate Shopify OAuth URL
 */
export const generateOAuthUrl = (shop: string, state?: string): string => {
  const domain = ensureShopifyDomain(shop);
  const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scopes = 'read_orders,write_orders,read_customers,read_products,write_draft_orders,read_inventory,read_locations';
  
  // Validate required environment variables
  if (!clientId) {
    console.error('❌ Missing VITE_SHOPIFY_CLIENT_ID environment variable');
    throw new Error('Shopify Client ID not configured. Please check your environment variables.');
  }
  
  const generatedState = state || generateState();
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: generatedState,
  });

  const oauthUrl = `https://${domain}/admin/oauth/authorize?${params.toString()}`;
  
  // Debug logging
  console.log('🔐 Generated OAuth URL:', {
    shop: domain,
    clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
    redirectUri,
    scopes,
    state: generatedState,
    url: oauthUrl
  });

  return oauthUrl;
};

/**
 * Generate random state for OAuth security
 */
export const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Start OAuth flow with shop domain
 */
export const startOAuthFlow = (shop: string, next?: string): void => {
  const shopInfo = {
    shop,
    domain: ensureShopifyDomain(shop),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    next: next || ''
  };

  // Store shop info for callback
  localStorage.setItem('shopify_shop', shopInfo.domain);
  localStorage.setItem('shopify_install_info', JSON.stringify(shopInfo));
  
  // Store next parameter for OAuth callback
  if (next) {
    localStorage.setItem('oauth_next_url', next);
  }

  // Generate OAuth URL and redirect
  const oauthUrl = generateOAuthUrl(shopInfo.domain);
  
  console.log('🚀 Starting OAuth flow:', {
    shop: shopInfo.domain,
    next,
    oauthUrl: oauthUrl.substring(0, 100) + '...'
  });

  window.location.href = oauthUrl;
};

/**
 * Track installation analytics
 */
export const trackInstallationStep = (step: string, shop?: string, additionalData?: any): void => {
  const event = {
    step,
    shop,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    ...additionalData
  };

  console.log(`📊 Installation Step: ${step}`, event);
  
  // Store in localStorage for debugging
  const steps = JSON.parse(localStorage.getItem('installation_steps') || '[]');
  steps.push(event);
  localStorage.setItem('installation_steps', JSON.stringify(steps.slice(-10))); // Keep last 10 steps
};

/**
 * Check if app is already installed
 */
export const checkExistingInstallation = async (shop: string): Promise<boolean> => {
  try {
    // This would typically check with your backend
    // For now, we'll check localStorage
    const savedShop = localStorage.getItem('shopify_shop');
    return savedShop === ensureShopifyDomain(shop);
  } catch {
    return false;
  }
};

/**
 * Get installation progress state
 */
export const getInstallationState = (): InstallationState => {
  const saved = localStorage.getItem('installation_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fall through to default
    }
  }

  return {
    step: 'detecting',
    progress: 0,
    message: 'Initializing...'
  };
};

/**
 * Update installation state
 */
export const updateInstallationState = (state: Partial<InstallationState>): void => {
  const current = getInstallationState();
  const updated = { ...current, ...state };
  
  localStorage.setItem('installation_state', JSON.stringify(updated));
  
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('installationStateChange', { 
    detail: updated 
  }));
};