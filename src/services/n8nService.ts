
import { supabase } from '@/integrations/supabase/client';

interface N8nWorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'failed';
  data?: any;
  startedAt: string;
  finishedAt?: string;
}

interface N8nWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  merchantId: string;
}

interface RetentionCampaignTrigger {
  customerId: string;
  customerEmail: string;
  lastOrderDate: string;
  orderValue: number;
  inactiveDays: number;
  merchantId: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  type: string;
  webhookUrl?: string;
  triggers?: number;
  lastRun?: string;
  conditions?: Record<string, any>;
  actions?: string[];
  merchantId: string;
}

export class N8nService {
  private async loadMerchantConfiguration(merchantId: string) {
    try {
      const { data: configs, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !configs || configs.length === 0) {
        console.warn(`No n8n configuration found for merchant: ${merchantId}`);
        return null;
      }

      const configData = configs[0].event_data as any;
      return {
        baseUrl: configData.n8n_url || '',
        apiKey: configData.api_key || '',
        webhookSecret: configData.webhook_secret || ''
      };
    } catch (error) {
      console.warn(`Failed to load n8n configuration for merchant ${merchantId}:`, error);
      return null;
    }
  }

  async testConnection(baseUrl: string, apiKey?: string, merchantId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`🧪 Testing n8n connection for merchant ${merchantId}:`, baseUrl);
      
      const cleanUrl = baseUrl.replace(/\/$/, '');
      
      const testPayload = {
        test: true,
        source: 'returns_automation_saas',
        message: 'Connection test from Returns Automation Platform',
        timestamp: new Date().toISOString(),
        eventType: 'connection_test',
        merchantId: merchantId || 'test',
        data: {
          returnId: 'test-return-123',
          customerEmail: 'test@example.com',
          shopifyOrderId: 'test-order-456',
          status: 'test',
          reason: 'Connection test',
          totalAmount: 99.99,
          merchantId: merchantId,
          items: [{
            productId: 'test-product-789',
            productName: 'Test Product',
            quantity: 1,
            price: 99.99
          }]
        }
      };

      const webhookEndpoints = [
        'webhook/test-connection',
        'webhook/return-processing',
        'webhook/retention-campaign'
      ];

      let successfulTests = 0;
      const testResults = [];

      for (const endpoint of webhookEndpoints) {
        const webhookUrl = merchantId 
          ? `${cleanUrl}/${endpoint}?merchant=${merchantId}`
          : `${cleanUrl}/${endpoint}`;
        
        try {
          console.log(`🔗 Testing merchant-specific webhook: ${webhookUrl}`);
          
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
              'X-Merchant-ID': merchantId || 'test',
              ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(testPayload)
          });

          successfulTests++;
          testResults.push({ 
            endpoint, 
            status: 'success', 
            message: 'Request sent successfully (CORS mode)',
            merchantId 
          });
          console.log(`✅ Merchant webhook request sent: ${endpoint}`);

        } catch (error) {
          testResults.push({ 
            endpoint, 
            status: 'error', 
            message: 'Endpoint unreachable',
            merchantId 
          });
          console.warn(`❌ Merchant webhook test failed: ${endpoint}`, error);
        }
      }

      if (successfulTests > 0) {
        return {
          success: true,
          data: { 
            message: `Successfully sent test requests to ${successfulTests}/${webhookEndpoints.length} merchant-specific webhook endpoints.`,
            results: testResults,
            baseUrl: cleanUrl,
            merchantId,
            note: 'Check your n8n workflow execution history to verify webhook receipt.'
          }
        };
      } else {
        return {
          success: false,
          error: 'All webhook endpoints appear to be unreachable. Please verify your n8n server URL and that the server is running.'
        };
      }

    } catch (error) {
      console.error('💥 n8n connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to connect to n8n server'
      };
    }
  }

  async testWebhookConnection(webhookUrl: string, merchantId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`🧪 Testing specific merchant webhook: ${webhookUrl}`);
      
      const testPayload = {
        test: true,
        source: 'returns_automation_saas_webhook_test',
        message: 'Direct webhook test',
        timestamp: new Date().toISOString(),
        eventType: 'webhook_test',
        merchantId: merchantId || 'test',
        data: {
          returnId: 'webhook-test-123',
          customerEmail: 'webhook-test@example.com',
          merchantId: merchantId,
          testData: true
        }
      };

      // Append merchant ID to webhook URL if not already present
      const finalWebhookUrl = merchantId && !webhookUrl.includes('merchant=') 
        ? `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}merchant=${merchantId}`
        : webhookUrl;

      await fetch(finalWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': merchantId || 'test'
        },
        body: JSON.stringify(testPayload)
      });

      return {
        success: true,
        data: { 
          message: 'Test request sent to merchant webhook successfully (CORS mode)',
          webhookUrl: finalWebhookUrl,
          merchantId,
          note: 'Check your n8n workflow execution history to verify webhook receipt.'
        }
      };
    } catch (error) {
      console.error('💥 Merchant webhook test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed'
      };
    }
  }

  async triggerRetentionCampaign(data: RetentionCampaignTrigger): Promise<N8nWorkflowExecution> {
    const config = await this.loadMerchantConfiguration(data.merchantId);

    if (!config?.baseUrl) {
      throw new Error(`N8n configuration not found for merchant ${data.merchantId}. Please configure n8n connection first.`);
    }

    console.log(`🔄 Triggering retention campaign for merchant ${data.merchantId}:`, data.customerEmail);
    
    try {
      const webhookUrl = `${config.baseUrl}/webhook/retention-campaign?merchant=${data.merchantId}`;
      
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': data.merchantId,
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({
          customerData: data,
          merchantId: data.merchantId,
          timestamp: new Date().toISOString()
        })
      });

      // Log the campaign trigger with merchant ID
      await this.logAnalyticsEvent('retention_campaign_triggered', {
        customerId: data.customerId,
        inactiveDays: data.inactiveDays,
        orderValue: data.orderValue,
        merchantId: data.merchantId
      }, data.merchantId);

      console.log(`✅ Retention campaign triggered successfully for merchant ${data.merchantId}`);
      
      return {
        id: `exec_${Date.now()}`,
        workflowId: 'retention-campaign',
        status: 'success',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        data: { message: 'Campaign triggered successfully', merchantId: data.merchantId }
      };
    } catch (error) {
      throw new Error(`N8n workflow execution failed for merchant ${data.merchantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processShopifyWebhook(webhookData: N8nWebhookPayload): Promise<void> {
    const config = await this.loadMerchantConfiguration(webhookData.merchantId);

    if (!config?.baseUrl) {
      throw new Error(`N8n configuration not found for merchant ${webhookData.merchantId}. Please configure n8n connection first.`);
    }

    console.log(`📨 Processing Shopify webhook for merchant ${webhookData.merchantId}:`, webhookData.event);
    
    try {
      const webhookUrl = `${config.baseUrl}/webhook/shopify-webhook?merchant=${webhookData.merchantId}`;
      
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': webhookData.merchantId,
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({
          ...webhookData,
          merchantId: webhookData.merchantId
        })
      });

      // Log webhook processing with merchant ID
      await this.logAnalyticsEvent('webhook_processed', {
        event: webhookData.event,
        timestamp: webhookData.timestamp,
        merchantId: webhookData.merchantId
      }, webhookData.merchantId);

      console.log(`✅ Shopify webhook processed successfully for merchant ${webhookData.merchantId}`);
    } catch (error) {
      throw new Error(`Webhook processing failed for merchant ${webhookData.merchantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAutomationRules(merchantId: string): Promise<AutomationRule[]> {
    try {
      // Load merchant-specific automation rules
      const { data: rulesData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'automation_rule')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (rulesData && rulesData.length > 0) {
        return rulesData.map(rule => {
          const eventData = rule.event_data as any;
          return {
            id: rule.id,
            name: eventData.name || 'Unnamed Rule',
            description: eventData.description || 'No description',
            active: eventData.active || false,
            type: eventData.type || 'Rule-based',
            triggers: eventData.triggers || 0,
            lastRun: eventData.lastRun,
            merchantId: merchantId
          };
        });
      }

      // Return default rules for new merchants
      return [
        {
          id: 'auto-approve-small',
          name: 'Auto-approve returns under $50',
          description: 'Automatically approve return requests for orders under $50',
          active: false,
          type: 'Rule-based',
          triggers: 0,
          merchantId: merchantId,
          conditions: { maxAmount: 50 },
          actions: ['approve', 'notify-customer']
        },
        {
          id: 'ai-exchange-suggest',
          name: 'AI Exchange Suggestions',
          description: 'Generate AI-powered exchange recommendations for returned items',
          active: true,
          type: 'AI-powered',
          triggers: 0,
          merchantId: merchantId,
          conditions: { hasExchangeableItems: true },
          actions: ['generate-ai-suggestion', 'notify-merchant']
        },
        {
          id: 'email-followup',
          name: 'Return Follow-up Emails',
          description: 'Send follow-up emails to customers about return status',
          active: true,
          type: 'Time-based',
          triggers: 0,
          merchantId: merchantId,
          conditions: { statusChanged: true },
          actions: ['send-email', 'log-communication']
        }
      ];
    } catch (error) {
      console.error(`💥 Failed to get automation rules for merchant ${merchantId}:`, error);
      return [];
    }
  }

  private async logAnalyticsEvent(eventType: string, eventData: any, merchantId: string): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData,
        merchant_id: merchantId
      });
    } catch (error) {
      console.warn(`Failed to log analytics event for merchant ${merchantId}:`, error);
    }
  }
}

export const n8nService = new N8nService();
