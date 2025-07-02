
import { supabase } from '@/integrations/supabase/client';

interface N8nWorkflowTrigger {
  workflowName: string;
  webhookUrl: string;
  data: Record<string, any>;
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: string[];
  active: boolean;
  webhookUrl?: string;
}

interface N8nResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionId?: string;
}

export class N8nService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'https://n8n.yourserver.com';
    this.apiKey = process.env.N8N_API_KEY;
  }

  async triggerWorkflow(trigger: N8nWorkflowTrigger): Promise<N8nResponse> {
    try {
      console.log('🔄 Triggering n8n workflow via HTTP:', trigger.workflowName);
      console.log('📡 Webhook URL:', trigger.webhookUrl);
      console.log('📦 Payload:', trigger.data);

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Returns-Automation-SaaS/1.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...trigger.headers
      };

      const response = await fetch(trigger.webhookUrl, {
        method: trigger.method || 'POST',
        headers,
        body: JSON.stringify({
          ...trigger.data,
          timestamp: new Date().toISOString(),
          source: 'returns-automation-saas'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8n workflow trigger failed:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorText
        };
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('✅ N8n workflow triggered successfully');
      console.log('📥 Response:', responseData);

      // Log the activity to analytics
      await this.logWebhookActivity({
        webhookUrl: trigger.webhookUrl,
        workflowName: trigger.workflowName,
        payload: trigger.data,
        status: 'success',
        response: responseData
      });

      return {
        success: true,
        data: responseData,
        executionId: responseData.executionId
      };
    } catch (error) {
      console.error('💥 Error triggering n8n workflow:', error);
      
      // Log the error
      await this.logWebhookActivity({
        webhookUrl: trigger.webhookUrl,
        workflowName: trigger.workflowName,
        payload: trigger.data,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async processReturnWorkflow(returnData: any, webhookUrl?: string): Promise<N8nResponse> {
    const defaultWebhookUrl = `${this.baseUrl}/webhook/return-processing`;
    
    return await this.triggerWorkflow({
      workflowName: 'return-processing',
      webhookUrl: webhookUrl || defaultWebhookUrl,
      data: {
        returnId: returnData.id,
        merchantId: returnData.merchant_id,
        customerEmail: returnData.customer_email,
        reason: returnData.reason,
        orderValue: returnData.total_amount,
        status: returnData.status,
        items: returnData.items || [],
        metadata: {
          source: 'return_created',
          processedAt: new Date().toISOString()
        }
      }
    });
  }

  async processRetentionCampaign(customerData: any, webhookUrl?: string): Promise<N8nResponse> {
    const defaultWebhookUrl = `${this.baseUrl}/webhook/retention-campaign`;
    
    return await this.triggerWorkflow({
      workflowName: 'retention-campaign',
      webhookUrl: webhookUrl || defaultWebhookUrl,
      data: {
        customerEmail: customerData.email,
        customerName: customerData.name,
        lastOrderDate: customerData.lastOrderDate,
        totalSpent: customerData.totalSpent,
        merchantId: customerData.merchantId,
        campaignType: 'win_back',
        segmentation: {
          tier: customerData.tier || 'standard',
          daysSinceLastOrder: customerData.daysSinceLastOrder
        },
        metadata: {
          source: 'retention_automation',
          triggeredAt: new Date().toISOString()
        }
      }
    });
  }

  async processNotification(notificationData: any, webhookUrl?: string): Promise<N8nResponse> {
    const defaultWebhookUrl = `${this.baseUrl}/webhook/notification-dispatch`;
    
    return await this.triggerWorkflow({
      workflowName: 'notification-dispatch',
      webhookUrl: webhookUrl || defaultWebhookUrl,
      data: {
        type: notificationData.type,
        recipient: notificationData.recipient,
        subject: notificationData.subject,
        message: notificationData.message,
        channel: notificationData.channel || 'email',
        priority: notificationData.priority || 'normal',
        metadata: {
          ...notificationData.metadata,
          source: 'notification_system',
          queuedAt: new Date().toISOString()
        }
      }
    });
  }

  async processOrderSync(orderData: any, webhookUrl?: string): Promise<N8nResponse> {
    const defaultWebhookUrl = `${this.baseUrl}/webhook/order-sync`;
    
    return await this.triggerWorkflow({
      workflowName: 'order-sync',
      webhookUrl: webhookUrl || defaultWebhookUrl,
      data: {
        orderId: orderData.id,
        shopifyOrderId: orderData.shopify_order_id,
        customerEmail: orderData.customer_email,
        totalAmount: orderData.total_amount,
        status: orderData.status,
        items: orderData.items || [],
        metadata: {
          source: 'order_webhook',
          syncedAt: new Date().toISOString()
        }
      }
    });
  }

  private async logWebhookActivity(activityData: {
    webhookUrl: string;
    workflowName: string;
    payload: any;
    status: 'success' | 'error';
    response?: any;
    error?: string;
  }) {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'n8n_webhook_triggered',
          event_data: {
            workflow_name: activityData.workflowName,
            webhook_url: activityData.webhookUrl,
            status: activityData.status,
            payload_size: JSON.stringify(activityData.payload).length,
            error: activityData.error,
            has_response: !!activityData.response
          }
        });
    } catch (error) {
      console.error('Failed to log webhook activity:', error);
    }
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    // Enhanced automation rules with webhook URLs
    return [
      {
        id: '1',
        name: 'Auto-approve small returns',
        description: 'Automatically approve returns under $50 via n8n workflow',
        trigger: 'return_submitted',
        conditions: { amount: { less_than: 50 } },
        actions: ['approve_return', 'send_confirmation', 'update_inventory'],
        active: true,
        webhookUrl: `${this.baseUrl}/webhook/auto-approve-returns`
      },
      {
        id: '2',
        name: 'AI exchange suggestions',
        description: 'Generate AI-powered exchange suggestions and notify customer',
        trigger: 'return_approved',
        conditions: { reason: { includes: ['size', 'color', 'style'] } },
        actions: ['generate_ai_suggestion', 'notify_customer', 'log_suggestion'],
        active: true,
        webhookUrl: `${this.baseUrl}/webhook/ai-exchange-suggestions`
      },
      {
        id: '3',
        name: 'Follow-up reminders',
        description: 'Send automated follow-up reminders for pending returns',
        trigger: 'scheduled',
        conditions: { status: 'pending', age: { greater_than: '24h' } },
        actions: ['send_reminder', 'escalate_if_needed', 'log_event'],
        active: true,
        webhookUrl: `${this.baseUrl}/webhook/follow-up-reminders`
      },
      {
        id: '4',
        name: 'Customer retention campaign',
        description: 'Trigger retention workflows for customers with multiple returns',
        trigger: 'return_pattern_detected',
        conditions: { return_count: { greater_than: 3 }, days: { within: 30 } },
        actions: ['send_personalized_offer', 'flag_for_review', 'update_customer_tier'],
        active: false,
        webhookUrl: `${this.baseUrl}/webhook/retention-campaign`
      }
    ];
  }

  async testWebhookConnection(webhookUrl: string): Promise<N8nResponse> {
    return await this.triggerWorkflow({
      workflowName: 'connection-test',
      webhookUrl,
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from Returns Automation SaaS'
      }
    });
  }
}

export const n8nService = new N8nService();
