import { supabase } from '@/integrations/supabase/client';

export interface ShopifyIntegrationTest {
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  details?: any;
  errorMessage?: string;
  duration?: number;
}

export interface ShopifyValidationResult {
  success: boolean;
  overallStatus: 'success' | 'warning' | 'failed';
  shopDomain: string;
  testType: string;
  totalDuration: number;
  timestamp: string;
  tests: ShopifyIntegrationTest[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

export interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ShopifyOrderLookupResult {
  success: boolean;
  order?: ShopifyOrder;
  error?: string;
  message?: string;
}

export class EnhancedShopifyService {
  /**
   * Test Shopify integration with comprehensive validation
   */
  static async validateIntegration(
    shopDomain: string,
    accessToken: string,
    testType: string = 'full'
  ): Promise<ShopifyValidationResult> {
    try {
      console.log(`🔍 Testing Shopify integration for ${shopDomain} - Type: ${testType}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-integration-validator', {
        body: {
          shopDomain: shopDomain.replace('.myshopify.com', '') + '.myshopify.com',
          accessToken,
          testType
        }
      });

      if (error) {
        throw new Error(`Validation failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Shopify validation error:', error);
      throw error;
    }
  }

  /**
   * Look up a specific order using enhanced order lookup
   */
  static async lookupOrder(
    orderNumber: string,
    customerEmail: string,
    shopDomain?: string,
    accessToken?: string
  ): Promise<ShopifyOrderLookupResult> {
    try {
      console.log(`🔍 Looking up order ${orderNumber} for ${customerEmail}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-order-lookup', {
        body: {
          orderNumber: orderNumber.replace('#', ''),
          customerEmail: customerEmail.toLowerCase(),
          shopDomain: shopDomain ? shopDomain.replace('.myshopify.com', '') + '.myshopify.com' : undefined,
          accessToken
        }
      });

      if (error) {
        throw new Error(`Order lookup failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Order lookup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to lookup order'
      };
    }
  }

  /**
   * Sync orders from Shopify to local database
   */
  static async syncOrdersFromShopify(merchantId: string, limit: number = 50): Promise<{
    success: boolean;
    syncedCount: number;
    error?: string;
  }> {
    try {
      console.log(`🔄 Syncing orders for merchant ${merchantId}`);
      
      // Get merchant's Shopify credentials
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, access_token')
        .eq('id', merchantId)
        .single();

      if (merchantError || !merchant) {
        throw new Error('Merchant not found or missing Shopify credentials');
      }

      // Use enhanced Shopify webhook function for syncing
      const { data, error } = await supabase.functions.invoke('enhanced-shopify-webhook', {
        body: {
          action: 'sync_orders',
          merchantId,
          shopDomain: merchant.shop_domain,
          accessToken: merchant.access_token,
          limit
        }
      });

      if (error) {
        throw new Error(`Order sync failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Order sync error:', error);
      return {
        success: false,
        syncedCount: 0,
        error: error instanceof Error ? error.message : 'Failed to sync orders'
      };
    }
  }

  /**
   * Test webhook processing with real Shopify data
   */
  static async testWebhookProcessing(
    shopDomain: string,
    accessToken: string,
    webhookTopic: string = 'orders/create'
  ): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log(`🔗 Testing webhook processing for ${webhookTopic}`);
      
      const { data, error } = await supabase.functions.invoke('test-merchant-webhook', {
        body: {
          shopDomain: shopDomain.replace('.myshopify.com', '') + '.myshopify.com',
          accessToken,
          topic: webhookTopic
        }
      });

      if (error) {
        throw new Error(`Webhook test failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Webhook test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Webhook test failed'
      };
    }
  }

  /**
   * Verify HMAC signature for webhook security
   */
  static async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      // This would typically be done server-side, but for testing we can simulate
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const signatureData = encoder.encode(payload);
      
      // Extract the actual signature (remove "sha256=" prefix if present)
      const cleanSignature = signature.replace('sha256=', '');
      const signatureBytes = new Uint8Array(
        cleanSignature.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        signatureData
      );

      return isValid;
    } catch (error) {
      console.error('HMAC verification error:', error);
      return false;
    }
  }

  /**
   * Get comprehensive integration status
   */
  static async getIntegrationStatus(merchantId: string): Promise<{
    connected: boolean;
    shopDomain?: string;
    lastSync?: string;
    webhooksConfigured: boolean;
    issues: string[];
  }> {
    try {
      // Get merchant data
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, access_token, updated_at')
        .eq('id', merchantId)
        .single();

      if (merchantError || !merchant) {
        return {
          connected: false,
          webhooksConfigured: false,
          issues: ['Merchant not found']
        };
      }

      const issues: string[] = [];
      
      if (!merchant.access_token) {
        issues.push('No access token configured');
      }

      if (!merchant.shop_domain) {
        issues.push('No shop domain configured');
      }

      // Check for recent order activity
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSync = recentOrders?.[0]?.created_at;
      
      if (!lastSync) {
        issues.push('No recent order synchronization');
      }

      return {
        connected: !!merchant.access_token && !!merchant.shop_domain,
        shopDomain: merchant.shop_domain,
        lastSync,
        webhooksConfigured: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Integration status error:', error);
      return {
        connected: false,
        webhooksConfigured: false,
        issues: ['Failed to check integration status']
      };
    }
  }

  /**
   * Test real store connection and permissions
   */
  static async testStoreConnection(
    shopDomain: string,
    accessToken: string
  ): Promise<{
    success: boolean;
    storeInfo?: {
      name: string;
      domain: string;
      email: string;
      currency: string;
      plan: string;
    };
    permissions?: string[];
    error?: string;
  }> {
    try {
      // Use the validator to test connection
      const result = await this.validateIntegration(shopDomain, accessToken, 'api');
      
      const connectionTest = result.tests.find(t => t.name === 'Shopify API Connection');
      
      if (connectionTest?.status === 'success' && connectionTest.details) {
        const details = connectionTest.details || {};
        return {
          success: true,
          storeInfo: {
            name: details.shopName || 'Unknown',
            domain: details.domain || shopDomain,
            email: details.email || 'Unknown',
            currency: details.currency || 'USD',
            plan: details.planName || 'Unknown'
          }
        };
      } else {
        return {
          success: false,
          error: connectionTest?.errorMessage || 'Connection test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection'
      };
    }
  }
}