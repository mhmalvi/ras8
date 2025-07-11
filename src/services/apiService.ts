
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

// Import domain services
import { AuthService } from './authService';
import { MerchantService } from './merchantService';
import { AnalyticsService } from './analyticsService';
import { aiService } from './aiService';
import { stripeService } from './stripeService';
import { ReturnService } from './returnService';
import { MerchantReturnsService } from './merchantReturnsService';
import { NotificationService } from './notificationService';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Modernized ApiService - Acts as a Gateway Layer
 * Delegates to specialized domain services instead of handling logic directly
 */
export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://pvadajelveswdazwmvppk.supabase.co`;
  }

  // =================
  // AUTHENTICATION
  // =================
  
  async signUp(email: string, password: string, metadata?: any) {
    try {
      const result = await AuthService.signUp(email, password, metadata);
      return { data: result, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign up failed', success: false };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const result = await AuthService.signIn(email, password);
      return { data: result, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign in failed', success: false };
    }
  }

  async signOut() {
    try {
      await AuthService.signOut();
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed', success: false };
    }
  }

  // =================
  // MERCHANT OPERATIONS
  // =================

  async getCurrentMerchant() {
    try {
      const merchant = await MerchantService.getCurrentMerchant();
      return { data: merchant, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to get merchant', success: false };
    }
  }

  async testShopifyConnection(merchantId: string) {
    return MerchantService.testShopifyConnection(merchantId);
  }

  // =================
  // RETURNS PROCESSING
  // =================

  async processReturn(returnId: string, action: 'approve' | 'reject', reason?: string) {
    try {
      await MerchantReturnsService.updateReturnStatus(returnId, action === 'approve' ? 'approved' : 'rejected', reason);
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to process return', success: false };
    }
  }

  async generateAIRecommendation(returnData: {
    returnReason: string;
    productName: string;
    customerEmail: string;
    orderValue: number;
  }) {
    try {
      const recommendation = await aiService.generateExchangeRecommendation(returnData);
      return { data: recommendation, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to generate AI recommendation', success: false };
    }
  }

  // =================
  // ANALYTICS
  // =================

  async getAnalytics(merchantId: string, timeRange?: string) {
    try {
      const analytics = await AnalyticsService.getAnalytics(timeRange);
      return { data: analytics, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to get analytics', success: false };
    }
  }

  async generateAnalyticsInsights(timeframe: string = '30days') {
    return AnalyticsService.generateInsights(timeframe);
  }

  // =================
  // BILLING
  // =================

  async createCheckoutSession(merchantId: string, planId: string) {
    try {
      const session = await stripeService.createCheckoutSession(planId);
      return { data: session, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create checkout session', success: false };
    }
  }

  // =================
  // NOTIFICATIONS
  // =================

  async sendNotification(params: {
    type: 'return_status' | 'ai_suggestion' | 'return_approved' | 'return_rejected' | 'exchange_offer';
    recipientEmail: string;
    returnId: string;
    [key: string]: any;
  }) {
    return NotificationService.sendEmailNotification(params);
  }

  // =================
  // WEBHOOK HANDLING
  // =================

  async processShopifyWebhook(payload: any) {
    return invokeEdgeFunction('shopify-webhook', payload);
  }

  async handleWebhookEvent(event: any) {
    return invokeEdgeFunction('webhook-handler', event);
  }

  // =================
  // LEGACY SUPPORT (maintained for backward compatibility)
  // =================

  async request<T = any>(config: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    authenticated?: boolean;
  }): Promise<ApiResponse<T>> {
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
}

export const apiService = new ApiService();
