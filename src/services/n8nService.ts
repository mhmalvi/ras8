
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
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Initialize with empty values - will be loaded from database configuration
    this.baseUrl = '';
    this.apiKey = '';
  }

  // Load configuration from database
  private async loadConfiguration() {
    try {
      const { data: config, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('No n8n configuration found');
        return;
      }

      if (config?.event_data) {
        const configData = config.event_data as any;
        this.baseUrl = configData.n8n_url || 'http://localhost:5678';
        // API key would be loaded from secure storage in production
      }
    } catch (error) {
      console.warn('Failed to load n8n configuration:', error);
    }
  }

  async triggerRetentionCampaign(data: RetentionCampaignTrigger): Promise<N8nWorkflowExecution> {
    try {
      // Ensure configuration is loaded
      if (!this.baseUrl) {
        await this.loadConfiguration();
      }

      if (!this.baseUrl) {
        throw new Error('N8n configuration not found. Please configure n8n connection first.');
      }

      console.log('🔄 Triggering retention campaign for:', data.customerEmail);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/retention-campaign/execute`, {
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
    } catch (error) {
      console.error('💥 Retention campaign trigger failed:', error);
      throw error;
    }
  }

  async processShopifyWebhook(webhookData: N8nWebhookPayload): Promise<void> {
    try {
      // Ensure configuration is loaded
      if (!this.baseUrl) {
        await this.loadConfiguration();
      }

      if (!this.baseUrl) {
        throw new Error('N8n configuration not found. Please configure n8n connection first.');
      }

      console.log('📨 Processing Shopify webhook:', webhookData.event);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/shopify-webhook/execute`, {
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
    } catch (error) {
      console.error('💥 Webhook processing failed:', error);
      throw error;
    }
  }

  async scheduleReturnFollowUp(returnId: string, customerEmail: string, delayHours: number = 24): Promise<void> {
    try {
      // Ensure configuration is loaded
      if (!this.baseUrl) {
        await this.loadConfiguration();
      }

      if (!this.baseUrl) {
        throw new Error('N8n configuration not found. Please configure n8n connection first.');
      }

      console.log('⏰ Scheduling return follow-up for:', returnId);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/return-followup/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          returnId,
          customerEmail,
          delayHours,
          scheduledAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Follow-up scheduling failed: ${response.statusText}`);
      }

      console.log('✅ Return follow-up scheduled successfully');
    } catch (error) {
      console.error('💥 Follow-up scheduling failed:', error);
      throw error;
    }
  }

  async sendSlackNotification(channel: string, message: string, data?: any): Promise<void> {
    try {
      // Ensure configuration is loaded
      if (!this.baseUrl) {
        await this.loadConfiguration();
      }

      if (!this.baseUrl) {
        console.warn('N8n not configured, skipping Slack notification');
        return;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/workflows/slack-notification/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          channel,
          message,
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }

      console.log('✅ Slack notification sent successfully');
    } catch (error) {
      console.error('💥 Slack notification failed:', error);
      // Don't throw error for notifications - they're not critical
    }
  }

  async getWorkflowStatus(executionId: string): Promise<N8nWorkflowExecution> {
    try {
      // Ensure configuration is loaded
      if (!this.baseUrl) {
        await this.loadConfiguration();
      }

      if (!this.baseUrl) {
        throw new Error('N8n configuration not found. Please configure n8n connection first.');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('💥 Failed to get workflow status:', error);
      throw error;
    }
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      // Return default automation rules for MVP
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

  async testConnection(baseUrl: string, apiKey?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🧪 Testing n8n connection:', baseUrl);
      
      const testUrl = `${baseUrl.replace(/\/$/, '')}/healthz`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-N8N-API-KEY': apiKey })
        }
      });

      if (response.ok) {
        console.log('✅ n8n connection test successful');
        return {
          success: true,
          data: { message: 'Connection successful', status: response.status }
        };
      } else {
        return {
          success: false,
          error: `Connection failed: ${response.statusText} (${response.status})`
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
      console.log('🧪 Testing webhook connection:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook connection' }
        })
      });

      console.log('✅ Webhook test request sent');
      
      return {
        success: true,
        data: { message: 'Test request sent successfully - check your n8n workflow execution logs' }
      };
    } catch (error) {
      console.error('💥 Webhook test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async logAnalyticsEvent(eventType: string, eventData: any): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData,
        merchant_id: null // System events don't belong to a specific merchant
      });
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }
}

export const n8nService = new N8nService();
