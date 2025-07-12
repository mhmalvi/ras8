
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
    merchantId?: string;
    webhookData?: any;
    orderDetails?: any;
    returnDetails?: any;
    customerDetails?: any;
    itemDetails?: any[];
    test?: boolean; // Added test property
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

export class EnhancedN8nService {
  private static baseUrl: string = '';
  private static apiKey: string = '';
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      const { data: config, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'n8n_configuration')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !config?.event_data) {
        console.warn('No n8n configuration found');
        return;
      }

      const configData = config.event_data as any;
      this.baseUrl = configData.n8n_url || '';
      this.apiKey = configData.api_key || '';
      this.initialized = true;

      console.log('✅ Enhanced n8n service initialized');
    } catch (error) {
      console.error('Failed to initialize n8n service:', error);
    }
  }

  static async sendWebhook(endpoint: string, payload: EnhancedWebhookPayload): Promise<{ success: boolean; error?: string }> {
    await this.initialize();

    if (!this.baseUrl) {
      return { success: false, error: 'n8n not configured' };
    }

    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint}`;
      console.log(`📤 Sending enhanced webhook to: ${url}`);

      const enhancedPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'returns_automation_saas',
        version: '2.0',
        // Add comprehensive event context
        context: {
          application: 'returns_automation_saas',
          environment: 'production',
          webhook_version: '2.0',
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
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(enhancedPayload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ Enhanced webhook failed: ${response.status} - ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      console.log(`✅ Enhanced webhook sent successfully to ${endpoint}`);
      return { success: true };

    } catch (error) {
      console.error(`💥 Enhanced webhook error for ${endpoint}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async processReturnCreated(returnData: ReturnProcessingPayload): Promise<void> {
    const payload: EnhancedWebhookPayload = {
      event: 'return_created',
      data: {
        ...returnData,
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

    const result = await this.sendWebhook('webhook/return-processing', payload);
    
    // Log the attempt with enhanced details
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: returnData.merchantId,
      event_data: {
        webhook_type: 'return_processing',
        success: result.success,
        error: result.error,
        return_id: returnData.returnId,
        enhanced_payload: true,
        payload_size: JSON.stringify(payload).length
      }
    });

    if (!result.success) {
      console.error('Failed to process return webhook:', result.error);
    }
  }

  static async processRetentionCampaign(campaignData: RetentionCampaignPayload): Promise<void> {
    const payload: EnhancedWebhookPayload = {
      event: 'retention_campaign',
      data: {
        ...campaignData,
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

    const result = await this.sendWebhook('webhook/retention-campaign', payload);
    
    // Log the attempt with enhanced details
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: campaignData.merchantId,
      event_data: {
        webhook_type: 'retention_campaign',
        success: result.success,
        error: result.error,
        customer_id: campaignData.customerId,
        enhanced_payload: true,
        payload_size: JSON.stringify(payload).length
      }
    });

    if (!result.success) {
      console.error('Failed to process retention campaign:', result.error);
    }
  }

  static async testAllWebhooks(): Promise<{ success: boolean; results: any[] }> {
    await this.initialize();

    const testPayload: EnhancedWebhookPayload = {
      event: 'connection_test',
      data: {
        test: true,
        merchantId: 'test-merchant-456',
        webhookData: {
          id: 'test-webhook-123',
          test_mode: true
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
      const result = await this.sendWebhook(endpoint, testPayload);
      results.push({ 
        endpoint, 
        ...result,
        payload_size: JSON.stringify(testPayload).length,
        enhanced: true
      });
      if (!result.success) allSuccess = false;
    }

    return { success: allSuccess, results };
  }
}
