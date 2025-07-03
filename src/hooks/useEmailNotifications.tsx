
import { useCallback } from 'react';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export const useEmailNotifications = () => {
  const { profile } = useProfile();
  const { toast } = useToast();

  const getMerchantName = useCallback(() => {
    // Try to get merchant name from profile or settings
    return profile?.merchant_id ? 'Your Store' : 'Returns Platform';
  }, [profile]);

  const sendReturnStatusNotification = useCallback(async (
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      status: string;
      reason?: string;
    }
  ) => {
    try {
      const result = await NotificationService.notifyReturnStatusChange(
        returnData,
        getMerchantName()
      );

      if (result.success) {
        toast({
          title: "Customer Notified",
          description: `Status update sent to ${returnData.customer_email}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send return status notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }, [getMerchantName, toast]);

  const sendAISuggestionNotification = useCallback(async (
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    suggestion: string
  ) => {
    try {
      const result = await NotificationService.notifyAISuggestion(
        returnData,
        suggestion,
        getMerchantName()
      );

      if (result.success) {
        toast({
          title: "AI Suggestion Sent",
          description: `Smart recommendation sent to ${returnData.customer_email}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send AI suggestion notification:', error);
      return { success: false, error: 'Failed to send AI suggestion' };
    }
  }, [getMerchantName, toast]);

  const sendReturnApprovalNotification = useCallback(async (
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    }
  ) => {
    try {
      const result = await NotificationService.notifyReturnApproved(
        returnData,
        getMerchantName()
      );

      if (result.success) {
        toast({
          title: "Approval Sent",
          description: `Return approval sent to ${returnData.customer_email}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send return approval notification:', error);
      return { success: false, error: 'Failed to send approval' };
    }
  }, [getMerchantName, toast]);

  const sendReturnRejectionNotification = useCallback(async (
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      reason?: string;
    }
  ) => {
    try {
      const result = await NotificationService.notifyReturnRejected(
        returnData,
        getMerchantName()
      );

      if (result.success) {
        toast({
          title: "Customer Notified",
          description: `Update sent to ${returnData.customer_email}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send return rejection notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }, [getMerchantName, toast]);

  return {
    sendReturnStatusNotification,
    sendAISuggestionNotification,
    sendReturnApprovalNotification,
    sendReturnRejectionNotification
  };
};
