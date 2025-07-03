
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
  private configLoaded: boolean = false;

  constructor() {
    this.baseUrl = 'https://n8n.yourserver.com'; // Default fallback
    this.loadConfiguration();
  }

  private async loadConfiguration() {
    try {
      const { data: config, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .single();

      if (!error && config?.event_data) {
        const configData = config.event_data as { n8n_url?: string; api_key?: string };
        if (configData.n8n_url) {
          this.baseUrl = configData.n8n_url;
        }
        if (configData.api_key) {
          this.apiKey = configData.api_key;
        }
      }
      this.configLoaded = true;
    } catch (error) {
      console.error('Failed to load n8n configuration:', error);
      this.configLoaded = true; // Set to true to prevent infinite loading
    }
  }

  private async ensureConfigLoaded() {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
  }

  async triggerWorkflow(trigger: N8nWorkflowTrigger): Promise<N8nResponse> {
    await this.ensureConfigLoaded();
    
    try {
      console.log('🔄 Triggering n8n workflow via HTTP:', trigger.workflowName);
      console.log('📡 Webhook URL:', trigger.webhookUrl);
      console.log('📦 Payload:', trigger.data);

      // Log the webhook trigger attempt immediately
      await this.logWebhookActivity({
        webhookUrl: trigger.webhookUrl,
        workflowName: trigger.workflowName,
        payload: trigger.data,
        status: 'pending'
      });

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Returns-Automation-SaaS/1.0',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
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
        
        // Log the failure
        await this.logWebhookActivity({
          webhookUrl: trigger.webhookUrl,
          workflowName: trigger.workflowName,
          payload: trigger.data,
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`
        });

        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorText
        };
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('✅ N8n workflow triggered successfully');
      console.log('📥 Response:', responseData);

      // Log the success
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

  private async logWebhookActivity(activityData: {
    webhookUrl: string;
    workflowName: string;
    payload: any;
    status: 'success' | 'error' | 'pending';
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
            has_response: !!activityData.response,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log webhook activity:', error);
    }
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    await this.ensureConfigLoaded();
    
    // Enhanced automation rules with webhook URLs using configured base URL
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
      }
    ];
  }
}

export const n8nService = new N8nService();
