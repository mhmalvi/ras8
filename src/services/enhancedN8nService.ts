
import { supabase } from '@/integrations/supabase/client';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

interface EnhancedWebhookPayload extends WebhookPayload {
  data: {
    shopDomain?: string;
    merchantId: string;
    webhookData?: any;
    orderDetails?: any;
    returnDetails?: any;
    customerDetails?: any;
    itemDetails?: any[];
    campaignData?: any;
    test?: boolean;
    metadata?: {
      source: string;
      timestamp: string;
      topic: string;
      webhook_id?: string;
    };
  };
}

interface ReturnProcessingPayload {
  returnId: string;
  merchantId: string;
  customerEmail: string;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    action: string;
  }>;
}

interface RetentionCampaignPayload {
  customerId: string;
  customerEmail: string;
  merchantId: string;
  inactiveDays: number;
  lastOrderValue: number;
}

interface MerchantN8nConfig {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  merchantId: string;
}

export class EnhancedN8nService {
  private static merchantConfigs: Map<string, MerchantN8nConfig> = new Map();

  static async getMerchantConfig(merchantId: string): Promise<MerchantN8nConfig | null> {
    // CRITICAL: Always fetch merchant-specific config from database
    try {
      console.log(`🔍 Loading MERCHANT-SPECIFIC n8n config for: ${merchantId}`);
      
      const { data: config, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'n8n_configuration')
        .eq('merchant_id', merchantId) // CRITICAL: Merchant-specific isolation
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !config?.event_data) {
        console.warn(`❌ No MERCHANT-SPECIFIC n8n configuration found for: ${merchantId}`);
        return null;
      }

      const configData = config.event_data as any;
      const merchantConfig: MerchantN8nConfig = {
        baseUrl: configData.n8n_url || '',
        apiKey: configData.api_key || '',
        webhookSecret: configData.webhook_secret || '',
        merchantId: merchantId
      };

      // Cache the MERCHANT-SPECIFIC config
      this.merchantConfigs.set(merchantId, merchantConfig);
      
      console.log(`✅ MERCHANT-SPECIFIC n8n config loaded for: ${merchantId}`);
      console.log(`🌐 Merchant n8n URL: ${merchantConfig.baseUrl}`);
      
      return merchantConfig;
    } catch (error) {
      console.error(`💥 Failed to load MERCHANT-SPECIFIC n8n config for ${merchantId}:`, error);
      return null;
    }
  }

  static async sendWebhook(merchantId: string, endpoint: string, payload: EnhancedWebhookPayload): Promise<{ success: boolean; error?: string }> {
    const config = await this.getMerchantConfig(merchantId);

    if (!config?.baseUrl) {
      console.error(`❌ No MERCHANT-SPECIFIC n8n configuration found for: ${merchantId}`);
      return { success: false, error: `n8n not configured for merchant: ${merchantId}` };
    }

    try {
      // CRITICAL: Ensure merchantId is always in the payload for isolation
      payload.data.merchantId = merchantId;
      
      // CRITICAL: Merchant-specific webhook URL with isolation parameters
      const url = `${config.baseUrl.replace(/\/$/, '')}/${endpoint}?merchant=${merchantId}&tenant=${merchantId}&isolated=true`;
      console.log(`📤 Sending MERCHANT-SPECIFIC webhook to: ${url}`);

      const comprehensivePayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'returns_automation_saas',
        version: '2.0',
        merchantId, // CRITICAL: Merchant isolation
        multiTenant: true,
        tenantIsolated: true, // CRITICAL: Flag for isolation
        context: {
          application: 'returns_automation_saas',
          environment: 'production',
          webhook_version: '2.0',
          merchant_id: merchantId,
          tenant_isolated: true,
          merchant_specific: true, // CRITICAL: Isolation flag
          supported_events: [
            'orders/create',
            'orders/updated', 
            'orders/cancelled',
            'returns/created',
            'returns/approved',
            'returns/completed',
            'app/uninstalled'
          ]
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'returns-automation-saas',
          'X-Webhook-Version': '2.0',
          'X-Merchant-ID': merchantId, // CRITICAL: Merchant isolation header
          'X-Tenant-ID': merchantId, // CRITICAL: Tenant isolation header
          'X-Tenant-Isolated': 'true', // CRITICAL: Isolation flag header
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
          ...(config.webhookSecret && { 'X-Webhook-Secret': config.webhookSecret })
        },
        body: JSON.stringify(comprehensivePayload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ MERCHANT-SPECIFIC webhook failed for ${merchantId}: ${response.status} - ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      console.log(`✅ MERCHANT-SPECIFIC webhook sent successfully to ${endpoint} for merchant ${merchantId}`);
      return { success: true };

    } catch (error) {
      console.error(`💥 MERCHANT-SPECIFIC webhook error for ${endpoint} (merchant: ${merchantId}):`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async processReturnCreated(returnData: ReturnProcessingPayload): Promise<void> {
    console.log(`🔄 Processing return for MERCHANT: ${returnData.merchantId}`);
    
    const payload: EnhancedWebhookPayload = {
      event: 'return_created',
      data: {
        merchantId: returnData.merchantId, // CRITICAL: Merchant isolation
        returnDetails: returnData,
        metadata: {
          source: 'returns_automation_saas',
          timestamp: new Date().toISOString(),
          topic: 'returns/created',
          webhook_id: `return_${returnData.returnId}`
        }
      },
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const result = await this.sendWebhook(returnData.merchantId, 'webhook/return-processing', payload);
    
    // Log with STRICT merchant isolation
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: returnData.merchantId, // CRITICAL: Merchant isolation
      event_data: {
        webhook_type: 'return_processing',
        success: result.success,
        error: result.error,
        return_id: returnData.returnId,
        merchant_isolated: true, // CRITICAL: Isolation flag
        tenant_specific: true,
        payload_size: JSON.stringify(payload).length
      }
    });

    if (!result.success) {
      console.error(`❌ Failed to process return webhook for MERCHANT ${returnData.merchantId}:`, result.error);
    }
  }

  static async processRetentionCampaign(campaignData: RetentionCampaignPayload): Promise<void> {
    console.log(`🔄 Processing retention campaign for MERCHANT: ${campaignData.merchantId}`);
    
    const payload: EnhancedWebhookPayload = {
      event: 'retention_campaign',
      data: {
        merchantId: campaignData.merchantId, // CRITICAL: Merchant isolation
        customerDetails: {
          id: campaignData.customerId,
          email: campaignData.customerEmail
        },
        campaignData,
        metadata: {
          source: 'returns_automation_saas',
          timestamp: new Date().toISOString(),
          topic: 'retention/campaign',
          webhook_id: `retention_${campaignData.customerId}`
        }
      },
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const result = await this.sendWebhook(campaignData.merchantId, 'webhook/retention-campaign', payload);
    
    // Log with STRICT merchant isolation
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: campaignData.merchantId, // CRITICAL: Merchant isolation
      event_data: {
        webhook_type: 'retention_campaign',
        success: result.success,
        error: result.error,
        customer_id: campaignData.customerId,
        merchant_isolated: true, // CRITICAL: Isolation flag
        tenant_specific: true,
        payload_size: JSON.stringify(payload).length
      }
    });

    if (!result.success) {
      console.error(`❌ Failed to process retention campaign for MERCHANT ${campaignData.merchantId}:`, result.error);
    }
  }

  static async testMerchantWebhooks(merchantId: string): Promise<{ success: boolean; results: any[] }> {
    const config = await this.getMerchantConfig(merchantId);

    if (!config?.baseUrl) {
      console.error(`❌ No MERCHANT-SPECIFIC n8n configuration found for: ${merchantId}`);
      return { 
        success: false, 
        results: [{ error: `No MERCHANT-SPECIFIC n8n configuration found for merchant: ${merchantId}` }] 
      };
    }

    console.log(`🧪 Testing MERCHANT-SPECIFIC webhooks for: ${merchantId}`);
    console.log(`🌐 Using merchant n8n URL: ${config.baseUrl}`);

    const testPayload: EnhancedWebhookPayload = {
      event: 'connection_test',
      data: {
        test: true,
        merchantId, // CRITICAL: Merchant isolation
        webhookData: {
          id: 'test-webhook-123',
          test_mode: true,
          merchant_specific: true
        },
        orderDetails: {
          id: 'test-order-789',
          order_number: '#TEST1001',
          email: 'test@example.com',
          total_price: '99.99',
          currency: 'USD'
        },
        returnDetails: {
          id: 'test-return-456',
          order_id: 'test-order-789',
          status: 'requested',
          reason: 'Test return'
        },
        customerDetails: {
          id: 'test-customer-123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'Customer'
        },
        itemDetails: [{
          id: 'test-item-1',
          product_id: 'test-product-789',
          name: 'Test Product',
          quantity: 1,
          price: '99.99'
        }],
        metadata: {
          source: 'returns_automation_saas',
          timestamp: new Date().toISOString(),
          topic: 'connection_test',
          webhook_id: 'test-connection-123'
        }
      },
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const endpoints = [
      'webhook/test-connection',
      'webhook/return-processing',
      'webhook/retention-campaign',
      'webhook/shopify-webhook'
    ];

    const results = [];
    let allSuccess = true;

    for (const endpoint of endpoints) {
      const result = await this.sendWebhook(merchantId, endpoint, testPayload);
      results.push({ 
        endpoint, 
        merchantId,
        merchantSpecific: true,
        tenantIsolated: true, // CRITICAL: Isolation flag
        ...result,
        payload_size: JSON.stringify(testPayload).length,
        merchant_url: config.baseUrl // Show which merchant's n8n was used
      });
      if (!result.success) allSuccess = false;
    }

    console.log(`📊 MERCHANT-SPECIFIC webhook test results for ${merchantId}:`, results);
    return { success: allSuccess, results };
  }

  // Clear MERCHANT-SPECIFIC config cache
  static clearMerchantCache(merchantId: string): void {
    this.merchantConfigs.delete(merchantId);
    console.log(`🧹 Cleared MERCHANT-SPECIFIC n8n config cache for: ${merchantId}`);
  }

  // Clear all cached configs
  static clearAllCache(): void {
    this.merchantConfigs.clear();
    console.log('🧹 Cleared all n8n config cache');
  }
}
