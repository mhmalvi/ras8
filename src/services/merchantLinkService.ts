/**
 * Merchant Link Service - Server-side validation for Shopify connections
 * This service provides authoritative merchant link validation
 */

import { supabase } from '@/integrations/supabase/client';

export interface MerchantLinkStatus {
  hasActiveMerchantLink: boolean;
  merchantStatus: 'active' | 'revoked' | 'pending' | 'none';
  shopDomain?: string;
  merchantId?: string;
  reason?: string;
}

export interface MerchantLinkValidationOptions {
  requireShopMatch?: string; // If provided, validates shop domain matches
  allowPending?: boolean; // Whether to allow pending status as valid
}

/**
 * Validates merchant link for a given user
 * This is the authoritative server-side check
 */
export async function validateMerchantLink(
  userId: string,
  options: MerchantLinkValidationOptions = {}
): Promise<MerchantLinkStatus> {
  try {
    // Query merchant records for this user
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, shop_domain, access_token, token_encrypted_at, plan_type, settings, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error querying merchant links:', error);
      return {
        hasActiveMerchantLink: false,
        merchantStatus: 'none',
        reason: 'Database query failed'
      };
    }

    // No merchants found
    if (!merchants || merchants.length === 0) {
      return {
        hasActiveMerchantLink: false,
        merchantStatus: 'none',
        reason: 'No merchant records found'
      };
    }

    // Get the most recent merchant record (in case of multiple stores)
    const merchant = merchants[0];

    // Check if access token exists and is encrypted
    if (!merchant.access_token || !merchant.token_encrypted_at) {
      return {
        hasActiveMerchantLink: false,
        merchantStatus: 'pending',
        shopDomain: merchant.shop_domain,
        merchantId: merchant.id,
        reason: 'Access token missing or not encrypted'
      };
    }

    // If shop match is required, validate it
    if (options.requireShopMatch && merchant.shop_domain !== options.requireShopMatch) {
      return {
        hasActiveMerchantLink: false,
        merchantStatus: 'none',
        shopDomain: merchant.shop_domain,
        merchantId: merchant.id,
        reason: `Shop domain mismatch: expected ${options.requireShopMatch}, got ${merchant.shop_domain}`
      };
    }

    // TODO: Add token validation call to Shopify API
    // For now, assume active if token exists and is recent
    const tokenAge = Date.now() - new Date(merchant.token_encrypted_at).getTime();
    const maxTokenAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (tokenAge > maxTokenAge) {
      return {
        hasActiveMerchantLink: false,
        merchantStatus: 'revoked',
        shopDomain: merchant.shop_domain,
        merchantId: merchant.id,
        reason: 'Token too old, likely expired'
      };
    }

    // Token appears valid
    return {
      hasActiveMerchantLink: true,
      merchantStatus: 'active',
      shopDomain: merchant.shop_domain,
      merchantId: merchant.id
    };

  } catch (error) {
    console.error('Merchant link validation error:', error);
    return {
      hasActiveMerchantLink: false,
      merchantStatus: 'none',
      reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validates merchant session from JWT or App Bridge token
 */
export async function validateMerchantSession(
  sessionData: any,
  options: MerchantLinkValidationOptions = {}
): Promise<MerchantLinkStatus> {
  if (!sessionData || !sessionData.merchantId) {
    return {
      hasActiveMerchantLink: false,
      merchantStatus: 'none',
      reason: 'No session data or merchant ID'
    };
  }

  // For JWT sessions, check if it's expired
  if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
    return {
      hasActiveMerchantLink: false,
      merchantStatus: 'revoked',
      shopDomain: sessionData.shopDomain,
      merchantId: sessionData.merchantId,
      reason: 'Session expired'
    };
  }

  // If shop match required, validate
  if (options.requireShopMatch && sessionData.shopDomain !== options.requireShopMatch) {
    return {
      hasActiveMerchantLink: false,
      merchantStatus: 'none',
      shopDomain: sessionData.shopDomain,
      merchantId: sessionData.merchantId,
      reason: `Shop domain mismatch in session`
    };
  }

  // Session appears valid
  return {
    hasActiveMerchantLink: true,
    merchantStatus: 'active',
    shopDomain: sessionData.shopDomain,
    merchantId: sessionData.merchantId
  };
}

/**
 * Determines redirect target based on authentication state and merchant link status
 */
export function getRedirectTarget(
  isAuthenticated: boolean,
  merchantLinkStatus: MerchantLinkStatus,
  isEmbedded: boolean,
  shop?: string,
  host?: string,
  next?: string
): string {
  const params = new URLSearchParams();
  
  // Add shop and host if available
  if (shop) params.set('shop', shop);
  if (host) params.set('host', host);
  if (next) params.set('next', next);

  // Not authenticated
  if (!isAuthenticated) {
    if (isEmbedded && shop) {
      return `/shopify/install?${params.toString()}`;
    }
    return `/auth`;
  }

  // Authenticated but no merchant link
  if (!merchantLinkStatus.hasActiveMerchantLink) {
    switch (merchantLinkStatus.merchantStatus) {
      case 'revoked':
        params.set('reason', 'revoked');
        return `/reconnect?${params.toString()}`;
      
      case 'pending':
        if (isEmbedded && shop) {
          return `/shopify/install?${params.toString()}`;
        }
        return `/connect-shopify`;
      
      case 'none':
      default:
        if (isEmbedded && shop) {
          return `/shopify/install?${params.toString()}`;
        }
        return `/connect-shopify`;
    }
  }

  // Has active merchant link - check for shop domain mismatch
  if (shop && merchantLinkStatus.shopDomain !== shop) {
    params.set('reason', 'mismatch');
    return `/reconnect?${params.toString()}`;
  }

  // All good - go to requested page or dashboard
  return next || '/dashboard';
}

/**
 * Hook-like function for use in React components
 */
export function useMerchantLinkValidation() {
  return {
    validateMerchantLink,
    validateMerchantSession,
    getRedirectTarget
  };
}