
import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

interface ApiRequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  authenticated?: boolean;
}

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://pvadajelveswdazwmvppk.supabase.co`;
  }

  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const { endpoint, method = 'GET', body, headers = {}, authenticated = true } = config;

      // Get auth token if authenticated request
      let authHeaders = {};
      if (authenticated) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders = {
            'Authorization': `Bearer ${session.access_token}`
          };
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...headers
        },
        ...(body && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      return {
        data,
        success: true
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown API error',
        success: false
      };
    }
  }

  // Shopify API methods
  async testShopifyConnection(merchantId: string): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/shopify-connection-test',
      method: 'POST',
      body: { merchantId }
    });
  }

  async processShopifyWebhook(payload: any): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/shopify-webhook',
      method: 'POST',
      body: payload,
      authenticated: false
    });
  }

  // Returns processing methods
  async processReturn(returnId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/process-return',
      method: 'POST',
      body: { returnId, action, reason }
    });
  }

  async generateAIRecommendation(returnData: any): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/generate-exchange-recommendation',
      method: 'POST',
      body: returnData
    });
  }

  // Analytics methods
  async getAnalytics(merchantId: string, timeRange?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    
    return this.request({
      endpoint: `/functions/v1/analytics?${params.toString()}`,
      method: 'GET'
    });
  }

  // Billing methods
  async createCheckoutSession(merchantId: string, planId: string): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/create-checkout',
      method: 'POST',
      body: { merchantId, planId }
    });
  }

  async handleWebhookEvent(event: any): Promise<ApiResponse> {
    return this.request({
      endpoint: '/functions/v1/webhook-handler',
      method: 'POST',
      body: event,
      authenticated: false
    });
  }
}

export const apiService = new ApiService();
