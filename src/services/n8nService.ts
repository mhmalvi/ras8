
import { supabase } from '@/integrations/supabase/client';

interface N8nWorkflowTrigger {
  workflowName: string;
  data: Record<string, any>;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: string[];
  active: boolean;
}

export class N8nService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
  }

  async triggerWorkflow(trigger: N8nWorkflowTrigger): Promise<boolean> {
    try {
      console.log('🔄 Triggering n8n workflow:', trigger.workflowName);

      // Use webhook URL if available, otherwise skip
      const webhookUrl = `${this.baseUrl}/webhook/${trigger.workflowName}`;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(trigger.data)
      });

      if (!response.ok) {
        console.warn('⚠️ N8n workflow trigger failed:', response.statusText);
        return false;
      }

      console.log('✅ N8n workflow triggered successfully');
      return true;
    } catch (error) {
      console.error('💥 Error triggering n8n workflow:', error);
      return false;
    }
  }

  async processReturnWorkflow(returnData: any): Promise<void> {
    await this.triggerWorkflow({
      workflowName: 'return-processing',
      data: {
        returnId: returnData.id,
        merchantId: returnData.merchant_id,
        customerEmail: returnData.customer_email,
        reason: returnData.reason,
        orderValue: returnData.total_amount,
        timestamp: new Date().toISOString()
      }
    });
  }

  async processRetentionCampaign(customerData: any): Promise<void> {
    await this.triggerWorkflow({
      workflowName: 'retention-campaign',
      data: {
        customerEmail: customerData.email,
        lastOrderDate: customerData.lastOrderDate,
        totalSpent: customerData.totalSpent,
        merchantId: customerData.merchantId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async processNotification(notificationData: any): Promise<void> {
    await this.triggerWorkflow({
      workflowName: 'notification-dispatch',
      data: {
        type: notificationData.type,
        recipient: notificationData.recipient,
        message: notificationData.message,
        metadata: notificationData.metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    // Mock automation rules - in production these would come from n8n API
    return [
      {
        id: '1',
        name: 'Auto-approve small returns',
        description: 'Automatically approve returns under $50',
        trigger: 'return_submitted',
        conditions: { amount: { less_than: 50 } },
        actions: ['approve_return', 'send_confirmation'],
        active: true
      },
      {
        id: '2',
        name: 'AI exchange suggestions',
        description: 'Generate AI-powered exchange suggestions for returns',
        trigger: 'return_approved',
        conditions: { reason: { includes: ['size', 'color', 'style'] } },
        actions: ['generate_ai_suggestion', 'notify_customer'],
        active: true
      },
      {
        id: '3',
        name: 'Follow-up reminders',
        description: 'Send follow-up reminders for pending returns',
        trigger: 'scheduled',
        conditions: { status: 'pending', age: { greater_than: '24h' } },
        actions: ['send_reminder', 'log_event'],
        active: true
      }
    ];
  }
}

export const n8nService = new N8nService();
