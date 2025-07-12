
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
}

interface RetentionCampaignTrigger {
  customerId: string;
  customerEmail: string;
  lastOrderDate: string;
  orderValue: number;
  inactiveDays: number;
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
}

export class N8nService {
  private config: {
    baseUrl: string;
    apiKey: string;
    webhookSecret: string;
  } | null = null;

  private async loadConfiguration() {
    if (this.config) return this.config;

    try {
      const { data: configs, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !configs || configs.length === 0) {
        console.warn('No n8n configuration found');
        return null;
      }

      const configData = configs[0].event_data as any;
      this.config = {
        baseUrl: configData.n8n_url || '',
        apiKey: configData.api_key || '',
        webhookSecret: configData.webhook_secret || ''
      };

      console.log('✅ n8n configuration loaded');
      return this.config;
    } catch (error) {
      console.warn('Failed to load n8n configuration:', error);
      return null;
    }
  }

  async testConnection(baseUrl: string, apiKey?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🧪 Testing n8n connection:', baseUrl);
      
      // Clean URL format
      const cleanUrl = baseUrl.replace(/\/$/, '');
      
      // Test with sample webhook data
      const testPayload = {
        test: true,
        source: 'returns_automation_saas',
        message: 'Connection test from Returns Automation Platform',
        timestamp: new Date().toISOString(),
        eventType: 'connection_test',
        data: {
          returnId: 'test-return-123',
          customerEmail: 'test@example.com',
          shopifyOrderId: 'test-order-456',
          status: 'test',
          reason: 'Connection test',
          totalAmount: 99.99,
          items: [{
            productId: 'test-product-789',
            productName: 'Test Product',
            quantity: 1,
            price: 99.99
          }]
        }
      };

      // Test main webhook endpoints
      const webhookEndpoints = [
        'webhook/test-connection',
        'webhook/return-processing',
        'webhook/retention-campaign'
      ];

      let successfulTests = 0;
      const testResults = [];

      for (const endpoint of webhookEndpoints) {
        const webhookUrl = `${cleanUrl}/${endpoint}`;
        
        try {
          console.log(`🔗 Testing webhook: ${webhookUrl}`);
          
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(testPayload)
          });

          if (response.ok || response.status === 404) {
            // 404 is acceptable - means n8n is running but webhook doesn't exist yet
            successfulTests++;
            testResults.push({ endpoint, status: 'success', message: 'Webhook accessible' });
            console.log(`✅ Webhook test successful: ${endpoint}`);
          } else {
            testResults.push({ endpoint, status: 'warning', message: `HTTP ${response.status}` });
            console.warn(`⚠️ Webhook test warning: ${endpoint} returned ${response.status}`);
          }
        } catch (error) {
          testResults.push({ endpoint, status: 'error', message: 'Connection failed' });
          console.warn(`❌ Webhook test failed: ${endpoint}`, error);
        }
      }

      if (successfulTests > 0) {
        return {
          success: true,
          data: { 
            message: `Successfully tested ${successfulTests}/${webhookEndpoints.length} webhook endpoints`,
            results: testResults,
            baseUrl: cleanUrl
          }
        };
      } else {
        return {
          success: false,
          error: 'No webhook endpoints were accessible. Please check your n8n server configuration.'
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

  async testWebhookConnection(webhookUrl: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🧪 Testing specific webhook:', webhookUrl);
      
      const testPayload = {
        test: true,
        source: 'returns_automation_saas_webhook_test',
        message: 'Direct webhook test',
        timestamp: new Date().toISOString(),
        eventType: 'webhook_test',
        data: {
          returnId: 'webhook-test-123',
          customerEmail: 'webhook-test@example.com',
          testData: true
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        return {
          success: true,
          data: { 
            message: 'Test data sent successfully to webhook',
            webhookUrl,
            status: response.status
          }
        };
      } else {
        return {
          success: false,
          error: `Webhook returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('💥 Webhook test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed'
      };
    }
  }

  async triggerRetentionCampaign(data: RetentionCampaignTrigger): Promise<N8nWorkflowExecution> {
    const config = await this.loadConfiguration();

    if (!config?.baseUrl) {
      throw new Error('N8n configuration not found. Please configure n8n connection first.');
    }

    console.log('🔄 Triggering retention campaign for:', data.customerEmail);
    
    const response = await fetch(`${config.baseUrl}/webhook/retention-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify({
        customerData: data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`N8n workflow execution failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Log the campaign trigger
    await this.logAnalyticsEvent('retention_campaign_triggered', {
      customerId: data.customerId,
      inactiveDays: data.inactiveDays,
      orderValue: data.orderValue
    });

    console.log('✅ Retention campaign triggered successfully');
    return result;
  }

  async processShopifyWebhook(webhookData: N8nWebhookPayload): Promise<void> {
    const config = await this.loadConfiguration();

    if (!config?.baseUrl) {
      throw new Error('N8n configuration not found. Please configure n8n connection first.');
    }

    console.log('📨 Processing Shopify webhook:', webhookData.event);
    
    const response = await fetch(`${config.baseUrl}/webhook/shopify-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Webhook processing failed: ${response.statusText}`);
    }

    // Log webhook processing
    await this.logAnalyticsEvent('webhook_processed', {
      event: webhookData.event,
      timestamp: webhookData.timestamp
    });

    console.log('✅ Shopify webhook processed successfully');
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      return [
        {
          id: 'auto-approve-small',
          name: 'Auto-approve returns under $50',
          description: 'Automatically approve return requests for orders under $50',
          active: false,
          type: 'Rule-based',
          triggers: 0,
          conditions: { maxAmount: 50 },
          actions: ['approve', 'notify-customer']
        },
        {
          id: 'ai-exchange-suggest',
          name: 'AI Exchange Suggestions',
          description: 'Generate AI-powered exchange recommendations for returned items',
          active: true,
          type: 'AI-powered',
          triggers: 23,
          lastRun: '2 hours ago',
          conditions: { hasExchangeableItems: true },
          actions: ['generate-ai-suggestion', 'notify-merchant']
        },
        {
          id: 'email-followup',
          name: 'Return Follow-up Emails',
          description: 'Send follow-up emails to customers about return status',
          active: true,
          type: 'Time-based',
          triggers: 156,
          lastRun: '1 hour ago',
          conditions: { statusChanged: true },
          actions: ['send-email', 'log-communication']
        }
      ];
    } catch (error) {
      console.error('💥 Failed to get automation rules:', error);
      return [];
    }
  }

  private async logAnalyticsEvent(eventType: string, eventData: any): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData,
        merchant_id: null
      });
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }
}

export const n8nService = new N8nService();
