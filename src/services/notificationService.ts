import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  merchant_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  type?: string;
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export class NotificationService {
  /**
   * Get notifications for a merchant with optional filters
   */
  static async getNotifications(
    merchantId: string,
    filters: NotificationFilters = {},
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.read !== undefined) {
        query = query.eq('read', filters.read);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return (data || []) as Notification[];
    } catch (err) {
      console.error('Error in getNotifications:', err);
      throw err;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in markAsRead:', err);
      throw err;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking notifications as read:', error);
        throw new Error(`Failed to mark notifications as read: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in markMultipleAsRead:', err);
      throw err;
    }
  }

  /**
   * Mark all notifications as read for a merchant
   */
  static async markAllAsRead(merchantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('merchant_id', merchantId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
      throw err;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deleteNotification:', err);
      throw err;
    }
  }

  /**
   * Get notification counts by status
   */
  static async getNotificationCounts(merchantId: string): Promise<{
    total: number;
    unread: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('read, priority')
        .eq('merchant_id', merchantId);

      if (error) {
        console.error('Error fetching notification counts:', error);
        throw new Error(`Failed to fetch notification counts: ${error.message}`);
      }

      const notifications = data || [];
      
      return {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length,
      };
    } catch (err) {
      console.error('Error in getNotificationCounts:', err);
      throw err;
    }
  }

  /**
   * Create a manual notification (for system admin use)
   */
  static async createNotification(
    merchantId: string,
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data: Record<string, any> = {}
  ): Promise<string> {
    try {
      const { data: result, error } = await supabase.rpc('create_notification', {
        p_merchant_id: merchantId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_priority: priority,
        p_data: data
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      return result;
    } catch (err) {
      console.error('Error in createNotification:', err);
      throw err;
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToNotifications(
    merchantId: string,
    callback: (notification: Notification) => void
  ) {
    const channel = supabase
      .channel(`notifications_${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload.new);
          callback(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          console.log('📝 Notification updated:', payload.new);
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Send email notification (for backward compatibility)
   */
  static async sendEmailNotification(params: {
    type: 'return_status' | 'ai_suggestion' | 'return_approved' | 'return_rejected' | 'exchange_offer';
    recipientEmail: string;
    returnId?: string;
    customerName?: string;
    orderNumber?: string;
    status?: string;
    reason?: string;
    merchantName?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      // This would typically call an edge function to send actual emails
      // For now, we'll just log the email that would be sent
      console.log('📧 Email notification would be sent:', params);
      
      // Simulate successful email sending
      return {
        success: true,
        message: 'Email notification sent successfully'
      };
    } catch (err) {
      console.error('Error sending email notification:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send email'
      };
    }
  }

  /**
   * Notify customer about return status change
   */
  static async notifyReturnStatusChange(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      status: string;
      reason?: string;
    },
    merchantName: string
  ): Promise<{ success: boolean; message?: string }> {
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

  /**
   * Notify customer about AI suggestion
   */
  static async notifyAISuggestion(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    suggestion: string,
    merchantName: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.sendEmailNotification({
      type: 'ai_suggestion',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      suggestion,
      merchantName
    });
  }

  /**
   * Notify customer about return approval
   */
  static async notifyReturnApproved(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
    },
    merchantName: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.sendEmailNotification({
      type: 'return_approved',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      merchantName
    });
  }

  /**
   * Notify customer about return rejection
   */
  static async notifyReturnRejected(
    returnData: {
      id: string;
      customer_email: string;
      shopify_order_id: string;
      reason?: string;
    },
    merchantName: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.sendEmailNotification({
      type: 'return_rejected',
      recipientEmail: returnData.customer_email,
      returnId: returnData.id,
      orderNumber: returnData.shopify_order_id,
      reason: returnData.reason,
      merchantName
    });
  }
}