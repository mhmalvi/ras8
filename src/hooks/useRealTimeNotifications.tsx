
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  data: any;
}

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile?.merchant_id) {
      setNotifications([]);
      return;
    }

    let channel: any;

    const setupNotifications = async () => {
      // Fetch initial notifications from analytics_events
      const { data: initialNotifications } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedNotifications = (initialNotifications || []).map(event => ({
        id: event.id,
        type: event.event_type,
        message: `${event.event_type.replace('_', ' ')} event occurred`,
        timestamp: event.created_at || '',
        read: false,
        data: event.event_data
      }));

      setNotifications(formattedNotifications);

      // Set up real-time subscription for new events
      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics_events',
            filter: `merchant_id=eq.${profile.merchant_id}`
          },
          (payload) => {
            const newNotification = {
              id: payload.new.id,
              type: payload.new.event_type,
              message: `${payload.new.event_type.replace('_', ' ')} event occurred`,
              timestamp: payload.new.created_at || '',
              read: false,
              data: payload.new.event_data
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          }
        )
        .subscribe();
    };

    setupNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile?.merchant_id]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
};
