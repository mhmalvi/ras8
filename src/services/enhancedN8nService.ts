
import { supabase } from '@/integrations/supabase/client';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
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

  static async sendWebhook(endpoint: string, payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
    await this.initialize();

    if (!this.baseUrl) {
      return { success: false, error: 'n8n not configured' };
    }

    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint}`;
      console.log(`📤 Sending webhook to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: 'returns_automation_saas'
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ Webhook failed: ${response.status} - ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      console.log(`✅ Webhook sent successfully to ${endpoint}`);
      return { success: true };

    } catch (error) {
      console.error(`💥 Webhook error for ${endpoint}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async processReturnCreated(returnData: ReturnProcessingPayload): Promise<void> {
    const payload: WebhookPayload = {
      event: 'return_created',
      data: returnData,
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const result = await this.sendWebhook('webhook/return-processing', payload);
    
    // Log the attempt
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: returnData.merchantId,
      event_data: {
        webhook_type: 'return_processing',
        success: result.success,
        error: result.error,
        return_id: returnData.returnId
      }
    });

    if (!result.success) {
      console.error('Failed to process return webhook:', result.error);
    }
  }

  static async processRetentionCampaign(campaignData: RetentionCampaignPayload): Promise<void> {
    const payload: WebhookPayload = {
      event: 'retention_campaign',
      data: campaignData,
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const result = await this.sendWebhook('webhook/retention-campaign', payload);
    
    // Log the attempt
    await supabase.from('analytics_events').insert({
      event_type: 'webhook_triggered',
      merchant_id: campaignData.merchantId,
      event_data: {
        webhook_type: 'retention_campaign',
        success: result.success,
        error: result.error,
        customer_id: campaignData.customerId
      }
    });

    if (!result.success) {
      console.error('Failed to process retention campaign:', result.error);
    }
  }

  static async testAllWebhooks(): Promise<{ success: boolean; results: any[] }> {
    await this.initialize();

    const testPayload: WebhookPayload = {
      event: 'connection_test',
      data: {
        test: true,
        returnId: 'test-return-123',
        merchantId: 'test-merchant-456',
        customerEmail: 'test@example.com'
      },
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas'
    };

    const endpoints = [
      'webhook/test-connection',
      'webhook/return-processing',
      'webhook/retention-campaign'
    ];

    const results = [];
    let allSuccess = true;

    for (const endpoint of endpoints) {
      const result = await this.sendWebhook(endpoint, testPayload);
      results.push({ endpoint, ...result });
      if (!result.success) allSuccess = false;
    }

    return { success: allSuccess, results };
  }
}
