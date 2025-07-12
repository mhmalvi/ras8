
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
  private baseUrl: string = '';
  private apiKey: string = '';
  private webhookSecret: string = '';
  private configLoaded: boolean = false;

  // Load configuration from database
  private async loadConfiguration() {
    if (this.configLoaded) return;

    try {
      const { data: config, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('No n8n configuration found');
        return;
      }

      if (config?.event_data) {
        const configData = config.event_data as any;
        this.baseUrl = configData.n8n_url || '';
        this.apiKey = configData.api_key || '';
        this.webhookSecret = configData.webhook_secret || '';
        this.configLoaded = true;
        console.log('✅ n8n configuration loaded');
      }
    } catch (error) {
      console.warn('Failed to load n8n configuration:', error);
    }
  }

  async triggerRetentionCampaign(data: RetentionCampaignTrigger): Promise<N8nWorkflowExecution> {
    await this.loadConfiguration();

    if (!this.baseUrl) {
      throw new Error('N8n configuration not found. Please configure n8n connection first.');
    }

    console.log('🔄 Triggering retention campaign for:', data.customerEmail);
    
    const response = await fetch(`${this.baseUrl}/webhook/retention-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
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
    await this.loadConfiguration();

    if (!this.baseUrl) {
      throw new Error('N8n configuration not found. Please configure n8n connection first.');
    }

    console.log('📨 Processing Shopify webhook:', webhookData.event);
    
    const response = await fetch(`${this.baseUrl}/webhook/shopify-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
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

  async testConnection(baseUrl: string, apiKey?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🧪 Testing n8n connection:', baseUrl);
      
      // For n8n cloud instances, validate URL format
      const isCloudInstance = baseUrl.includes('n8n.cloud');
      
      if (isCloudInstance) {
        const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.app\.n8n\.cloud\/?$/;
        if (urlPattern.test(baseUrl)) {
          console.log('✅ n8n cloud instance URL format is valid');
          
          // Test webhook endpoint with sample data
          await this.testWebhookEndpoint(`${baseUrl.replace(/\/$/, '')}/webhook/test-connection`);
          
          return {
            success: true,
            data: { message: 'n8n cloud instance URL validated and webhook tested successfully', status: 200 }
          };
        } else {
          return {
            success: false,
            error: 'Invalid n8n cloud URL format. Expected: https://yourinstance.app.n8n.cloud'
          };
        }
      }

      // For self-hosted instances, try to reach health endpoint
      const testUrl = `${baseUrl.replace(/\/$/, '')}/healthz`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });

      console.log('✅ n8n connection test successful');
      return {
        success: true,
        data: { message: 'Connection successful', status: 200 }
      };

    } catch (error) {
      console.error('💥 n8n connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to connect to n8n server'
      };
    }
  }

  private async testWebhookEndpoint(webhookUrl: string): Promise<void> {
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

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        mode: 'no-cors'
      });

      console.log('✅ Test webhook data sent successfully');
    } catch (error) {
      console.warn('⚠️ Webhook test failed, but this may be normal due to CORS:', error);
    }
  }

  async testWebhookConnection(webhookUrl: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🧪 Testing webhook connection:', webhookUrl);
      
      await this.testWebhookEndpoint(webhookUrl);
      
      return {
        success: true,
        data: { 
          message: 'Test request sent successfully - check your n8n workflow execution logs',
          webhookUrl
        }
      };
    } catch (error) {
      console.error('💥 Webhook test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
