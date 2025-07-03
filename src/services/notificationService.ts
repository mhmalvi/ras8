
import { supabase } from '@/integrations/supabase/client';

export interface EmailNotificationParams {
  type: 'return_status' | 'ai_suggestion' | 'return_approved' | 'return_rejected' | 'exchange_offer';
  recipientEmail: string;
  customerName?: string;
  returnId: string;
  orderNumber?: string;
  status?: string;
  aiSuggestion?: string;
  reason?: string;
  merchantName?: string;
}

export class NotificationService {
  static async sendEmailNotification(params: EmailNotificationParams): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
  }> {
    try {
      console.log('🔔 Sending email notification:', params.type);
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: params
      });

      if (error) {
        console.error('❌ Email notification failed:', error);
        throw error;
      }

      console.log('✅ Email notification sent successfully');
      return {
        success: true,
        emailId: data?.emailId
      };
    } catch (error) {
      console.error('💥 Error in email notification service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async notifyReturnStatusChange(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      status: string;
      reason?: string;
    },
    merchantName?: string
  ) {
    return this.sendEmailNotification({
      type: 'return_status',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      status: returnData.status,
      reason: returnData.reason,
      merchantName
    });
  }

  static async notifyAISuggestion(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    suggestion: string,
    merchantName?: string
  ) {
    return this.sendEmailNotification({
      type: 'ai_suggestion',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      aiSuggestion: suggestion,
      merchantName
    });
  }

  static async notifyReturnApproved(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    merchantName?: string
  ) {
    return this.sendEmailNotification({
      type: 'return_approved',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      merchantName
    });
  }

  static async notifyReturnRejected(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      reason?: string;
    },
    merchantName?: string
  ) {
    return this.sendEmailNotification({
      type: 'return_rejected',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      reason: returnData.reason,
      merchantName
    });
  }

  static async notifyExchangeOffer(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    exchangeOffer: string,
    merchantName?: string
  ) {
    return this.sendEmailNotification({
      type: 'exchange_offer',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      aiSuggestion: exchangeOffer,
      merchantName
    });
  }
}
