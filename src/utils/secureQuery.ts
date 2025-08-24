import { supabase } from "@/integrations/supabase/client";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";

/**
 * Secure query wrapper that automatically adds merchant_id filtering
 */
export class SecureQuery {
  private merchantId: string;

  constructor(merchantId: string) {
    if (!merchantId) {
      throw new Error('Merchant ID required for secure queries');
    }
    this.merchantId = merchantId;
  }

  /**
   * Create a query builder with automatic merchant scoping
   */
  from(table: string) {
    return supabase
      .from(table)
      .eq('merchant_id', this.merchantId);
  }

  /**
   * Query related tables through joins (for tables without direct merchant_id)
   */
  fromRelated(table: string, relationTable: string, relationField: string) {
    return supabase
      .from(table)
      .select(`*, ${relationTable}!inner(merchant_id)`)
      .eq(`${relationTable}.merchant_id`, this.merchantId);
  }

  /**
   * Get the merchant ID for this secure query instance
   */
  getMerchantId(): string {
    return this.merchantId;
  }
}

/**
 * Hook to get secure query instance
 */
export function useSecureQuery() {
  const { profile } = useMerchantProfile();
  
  if (!profile?.merchant_id) {
    throw new Error('No merchant context available');
  }
  
  return new SecureQuery(profile.merchant_id);
}

/**
 * Secure query for customer portal (email-based)
 */
export function useCustomerQuery(customerEmail: string) {
  return {
    orders: () => supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customerEmail),
      
    returns: () => supabase
      .from('returns')
      .select('*')
      .eq('customer_email', customerEmail)
  };
}

/**
 * Utility function to create secure cache keys with merchant isolation
 */
export function createSecureCacheKey(baseKey: string, merchantId: string, ...additionalParams: string[]): string {
  if (!merchantId) {
    throw new Error('Merchant ID required for secure cache keys');
  }
  const params = additionalParams.length > 0 ? `-${additionalParams.join('-')}` : '';
  return `${baseKey}-${merchantId}${params}`;
}

/**
 * Predefined secure cache key patterns for common data types
 */
export const SecureCacheKeys = {
  products: (merchantId: string, filters?: string) => 
    createSecureCacheKey('products', merchantId, filters || 'all'),
  
  orders: (merchantId: string, status?: string) => 
    createSecureCacheKey('orders', merchantId, status || 'all'),
  
  returns: (merchantId: string, status?: string) => 
    createSecureCacheKey('returns', merchantId, status || 'all'),
  
  customers: (merchantId: string, segment?: string) => 
    createSecureCacheKey('customers', merchantId, segment || 'all'),
  
  analytics: (merchantId: string, dateRange?: string, eventType?: string) => 
    createSecureCacheKey('analytics', merchantId, dateRange || 'default', eventType || 'all'),
  
  dashboard: (merchantId: string, period?: string) => 
    createSecureCacheKey('dashboard-metrics', merchantId, period || 'current'),
  
  aiInsights: (merchantId: string, type?: string) => 
    createSecureCacheKey('ai-insights', merchantId, type || 'all'),
  
  userProfile: (userId: string, merchantId: string) => 
    createSecureCacheKey('user-profile', merchantId, userId)
};

/**
 * Cache invalidation patterns for merchant-specific data
 */
export const SecureCachePatterns = {
  allMerchantData: (merchantId: string) => merchantId,
  merchantProducts: (merchantId: string) => `products-${merchantId}`,
  merchantOrders: (merchantId: string) => `orders-${merchantId}`,
  merchantReturns: (merchantId: string) => `returns-${merchantId}`,
  merchantAnalytics: (merchantId: string) => `analytics-${merchantId}`,
  merchantDashboard: (merchantId: string) => `dashboard-metrics-${merchantId}`
};

/**
 * Validate that a user has proper merchant context
 */
export function validateMerchantContext(profile: any): { isValid: boolean; merchantId?: string; error?: string } {
  if (!profile) {
    return { isValid: false, error: 'No user profile available' };
  }

  if (!profile.merchant_id) {
    return { isValid: false, error: 'No merchant context available' };
  }

  return { isValid: true, merchantId: profile.merchant_id };
}

/**
 * Secure data fetching hook pattern
 */
export function useSecureDataFetch<T>(
  queryKey: string[],
  fetchFn: (secureQuery: SecureQuery) => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { profile } = useMerchantProfile();
  const merchantId = profile?.merchant_id;

  // This would integrate with React Query or SWR
  // For now, we'll provide the pattern
  const queryKeyWithMerchant = [...queryKey, merchantId];
  
  return {
    queryKey: queryKeyWithMerchant,
    enabled: options?.enabled && !!merchantId,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes default
    fetchFn: async () => {
      if (!merchantId) {
        throw new Error('No merchant context');
      }
      const secureQuery = new SecureQuery(merchantId);
      return fetchFn(secureQuery);
    }
  };
}