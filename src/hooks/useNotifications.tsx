import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { NotificationService, type Notification, type NotificationFilters } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotifications = (filters: NotificationFilters = {}) => {
  const { profile } = useMerchantProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  const merchantId = profile?.merchant_id;

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Load notifications from the database
  const loadNotifications = useCallback(async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load notifications and counts in parallel
      const [notificationsData, countsData] = await Promise.all([
        NotificationService.getNotifications(merchantId, memoizedFilters),
        NotificationService.getNotificationCounts(merchantId)
      ]);

      setNotifications(notificationsData);
      setCounts(countsData);

      console.log(`📊 Loaded ${notificationsData.length} notifications`);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [merchantId, memoizedFilters]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

      console.log(`✅ Marked notification ${notificationId} as read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await NotificationService.markMultipleAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update counts
      const unreadCount = notificationIds.filter(id => 
        notifications.find(n => n.id === id && !n.read)
      ).length;

      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - unreadCount)
      }));

      console.log(`✅ Marked ${notificationIds.length} notifications as read`);
      toast.success(`Marked ${notificationIds.length} notifications as read`);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!merchantId) return;

    try {
      await NotificationService.markAllAsRead(merchantId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: 0
      }));

      console.log('✅ Marked all notifications as read');
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  }, [merchantId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update counts
      setCounts(prev => ({
        total: Math.max(0, prev.total - 1),
        unread: deletedNotification && !deletedNotification.read 
          ? Math.max(0, prev.unread - 1) 
          : prev.unread,
        high: deletedNotification?.priority === 'high' 
          ? Math.max(0, prev.high - 1) 
          : prev.high,
        medium: deletedNotification?.priority === 'medium' 
          ? Math.max(0, prev.medium - 1) 
          : prev.medium,
        low: deletedNotification?.priority === 'low' 
          ? Math.max(0, prev.low - 1) 
          : prev.low,
      }));

      console.log(`🗑️ Deleted notification ${notificationId}`);
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Handle real-time notification updates
  useEffect(() => {
    if (!merchantId) return;

    console.log(`🔄 Setting up real-time subscription for merchant: ${merchantId}`);

    const channel = NotificationService.subscribeToNotifications(
      merchantId,
      (notification) => {
        console.log('🔔 Real-time notification received:', notification);
        
        // Add new notification to the list
        setNotifications(prev => {
          // Check if notification already exists (to prevent duplicates)
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            // Update existing notification
            return prev.map(n => n.id === notification.id ? notification : n);
          } else {
            // Add new notification to the beginning
            return [notification, ...prev];
          }
        });

        // Update counts if it's a new unread notification
        if (!notification.read) {
          setCounts(prev => ({
            total: prev.total + 1,
            unread: prev.unread + 1,
            high: notification.priority === 'high' ? prev.high + 1 : prev.high,
            medium: notification.priority === 'medium' ? prev.medium + 1 : prev.medium,
            low: notification.priority === 'low' ? prev.low + 1 : prev.low,
          }));

          // Show toast for high priority notifications
          if (notification.priority === 'high') {
            toast(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }
        }
      }
    );

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [merchantId]);

  // Load initial data
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    loading,
    error,
    counts,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: loadNotifications
  };
};