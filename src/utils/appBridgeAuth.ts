/**
 * App Bridge Authentication Manager
 * 
 * Handles secure session validation and authentication for embedded Shopify apps
 * using App Bridge session tokens and proper validation flows.
 */

import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';

export interface SessionValidationResult {
  isValid: boolean;
  shopDomain?: string;
  sessionToken?: string;
  error?: string;
}

export interface EmbeddedContext {
  shop: string;
  host: string;
  sessionToken?: string;
}

export class AppBridgeAuthManager {
  private app: any = null;
  private sessionToken: string | null = null;
  private lastValidation: number = 0;
  private validationInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeAppBridge();
  }

  /**
   * Initialize App Bridge with current context
   */
  private initializeAppBridge(): boolean {
    try {
      const context = this.getEmbeddedContext();
      if (!context) {
        console.log('📱 Not in embedded context, skipping App Bridge initialization');
        return false;
      }

      if (!import.meta.env.VITE_SHOPIFY_CLIENT_ID) {
        console.error('❌ VITE_SHOPIFY_CLIENT_ID not configured');
        return false;
      }

      this.app = createApp({
        apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID,
        host: context.host,
        forceRedirect: true
      });

      console.log('✅ App Bridge initialized for shop:', context.shop);
      return true;
    } catch (error) {
      console.error('❌ App Bridge initialization failed:', error);
      return false;
    }
  }

  /**
   * Get embedded context from URL parameters
   */
  getEmbeddedContext(): EmbeddedContext | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');

    if (!shop) return null;

    return {
      shop,
      host: host || '',
      sessionToken: this.sessionToken || undefined
    };
  }

  /**
   * Check if we're in an embedded context
   */
  isEmbedded(): boolean {
    const context = this.getEmbeddedContext();
    const isInFrame = typeof window !== 'undefined' && window.self !== window.top;
    
    return !!(context && (context.host || isInFrame));
  }

  /**
   * Get session token from App Bridge
   */
  async getSessionToken(): Promise<string | null> {
    try {
      if (!this.app) {
        const initialized = this.initializeAppBridge();
        if (!initialized) return null;
      }

      // Return cached token if still valid (within 5 minutes)
      const now = Date.now();
      if (this.sessionToken && (now - this.lastValidation) < this.validationInterval) {
        return this.sessionToken;
      }

      const token = await getSessionToken(this.app);
      
      if (token) {
        this.sessionToken = token;
        this.lastValidation = now;
        console.log('✅ App Bridge session token obtained');
        return token;
      }

      console.warn('⚠️ No session token received from App Bridge');
      return null;
    } catch (error) {
      console.error('❌ Failed to get App Bridge session token:', error);
      return null;
    }
  }

  /**
   * Validate session token with backend
   */
  async validateSessionToken(shopDomain?: string): Promise<SessionValidationResult> {
    try {
      const context = this.getEmbeddedContext();
      const shop = shopDomain || context?.shop;

      if (!shop) {
        return {
          isValid: false,
          error: 'No shop domain available for validation'
        };
      }

      // Get current session token
      const sessionToken = await this.getSessionToken();
      
      if (!sessionToken) {
        return {
          isValid: false,
          error: 'No session token available'
        };
      }

      // Validate with backend
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        'Shop': shop
      };

      console.log('🔍 Validating session token with backend:', { shop });

      const response = await fetch('/api/session/validate', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ 
          shop,
          embedded: true,
          timestamp: Date.now()
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        console.log('✅ Session token validation successful');
        return {
          isValid: true,
          shopDomain: shop,
          sessionToken
        };
      }

      console.warn('⚠️ Session token validation failed:', data);
      return {
        isValid: false,
        error: data.error || 'Validation failed',
        shopDomain: shop
      };

    } catch (error) {
      console.error('❌ Session token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Trigger top-level auth flow (breaks out of iframe)
   */
  triggerTopLevelAuth(shopDomain?: string): void {
    const context = this.getEmbeddedContext();
    const shop = shopDomain || context?.shop;
    const host = context?.host;

    if (!shop) {
      console.error('❌ Cannot trigger top-level auth: no shop domain');
      return;
    }

    const authUrl = new URL(`${window.location.origin}/auth/start`);
    authUrl.searchParams.set('shop', shop);
    if (host) {
      authUrl.searchParams.set('host', host);
    }

    console.log('🔄 Triggering top-level OAuth for embedded app:', { shop, host });

    // Try to break out to parent frame first
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = authUrl.toString();
        return;
      }
    } catch (e) {
      // Cross-origin frame access blocked, fallback
    }

    // Fallback: redirect current window
    window.location.href = authUrl.toString();
  }

  /**
   * Check if merchant is authenticated via session or backend
   */
  async checkMerchantAuthentication(): Promise<SessionValidationResult> {
    const context = this.getEmbeddedContext();
    
    if (!context) {
      return {
        isValid: false,
        error: 'Not in embedded context'
      };
    }

    // First try session token validation
    const sessionResult = await this.validateSessionToken(context.shop);
    
    if (sessionResult.isValid) {
      return sessionResult;
    }

    // Fallback: check with backend using shop parameter
    try {
      const response = await fetch(`/api/session/me?shop=${encodeURIComponent(context.shop)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok && data.authenticated) {
        console.log('✅ Backend authentication check passed for shop:', context.shop);
        return {
          isValid: true,
          shopDomain: context.shop
        };
      }

      console.log('❌ Backend authentication check failed:', data);
      return {
        isValid: false,
        error: data.error || 'Not authenticated',
        shopDomain: context.shop
      };

    } catch (error) {
      console.error('❌ Backend authentication check error:', error);
      return {
        isValid: false,
        error: 'Backend check failed',
        shopDomain: context.shop
      };
    }
  }

  /**
   * Handle authentication flow for embedded apps
   */
  async handleEmbeddedAuth(): Promise<'authenticated' | 'auth_required' | 'error'> {
    try {
      console.log('🔐 Handling embedded app authentication...');

      const authResult = await this.checkMerchantAuthentication();

      if (authResult.isValid) {
        console.log('✅ Embedded authentication successful');
        return 'authenticated';
      }

      // Authentication required - trigger OAuth
      console.log('🔄 Authentication required, triggering OAuth...');
      this.triggerTopLevelAuth(authResult.shopDomain);
      return 'auth_required';

    } catch (error) {
      console.error('❌ Embedded authentication error:', error);
      return 'error';
    }
  }

  /**
   * Refresh session token and clear cache
   */
  async refreshSession(): Promise<string | null> {
    this.sessionToken = null;
    this.lastValidation = 0;
    return this.getSessionToken();
  }

  /**
   * Clear cached authentication data
   */
  clearCache(): void {
    this.sessionToken = null;
    this.lastValidation = 0;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): Record<string, any> {
    const context = this.getEmbeddedContext();
    
    return {
      isEmbedded: this.isEmbedded(),
      hasApp: !!this.app,
      hasSessionToken: !!this.sessionToken,
      lastValidation: new Date(this.lastValidation).toISOString(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

// Global instance
export const appBridgeAuth = new AppBridgeAuthManager();

/**
 * React hook for App Bridge authentication
 */
export function useAppBridgeAuth() {
  return {
    isEmbedded: appBridgeAuth.isEmbedded(),
    getContext: () => appBridgeAuth.getEmbeddedContext(),
    validateSession: (shopDomain?: string) => appBridgeAuth.validateSessionToken(shopDomain),
    triggerAuth: (shopDomain?: string) => appBridgeAuth.triggerTopLevelAuth(shopDomain),
    checkAuth: () => appBridgeAuth.checkMerchantAuthentication(),
    handleAuth: () => appBridgeAuth.handleEmbeddedAuth(),
    refreshSession: () => appBridgeAuth.refreshSession(),
    getDebugInfo: () => appBridgeAuth.getDebugInfo()
  };
}