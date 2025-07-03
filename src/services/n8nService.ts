
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

export class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  async triggerRetentionCampaign(data: RetentionCampaignTrigger): Promise<N8nWorkflowExecution> {
    try {
      console.log('🔄 Triggering retention campaign for:', data.customerEmail);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/retention-campaign/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
      console.log('📨 Processing Shopify webhook:', webhookData.event);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/shopify-webhook/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
      console.log('⏰ Scheduling return follow-up for:', returnId);
      
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/return-followup/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/slack-notification/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
