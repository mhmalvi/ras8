
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

// Real-time updates hook using Supabase subscriptions
export const useRealTimeUpdates = (tableName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile?.merchant_id) {
      setData([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const setupRealTimeSubscription = async () => {
      try {
        setLoading(true);

        // Initial data fetch
        const { data: initialData, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('merchant_id', profile.merchant_id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error(`Error fetching ${tableName}:`, fetchError);
          setError(fetchError.message);
        } else {
          setData(initialData || []);
          setError(null);
        }

        // Set up real-time subscription
        channel = supabase
          .channel(`realtime-${tableName}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: tableName,
              filter: `merchant_id=eq.${profile.merchant_id}`
            },
            (payload) => {
              console.log(`Real-time update for ${tableName}:`, payload);
              
              if (payload.eventType === 'INSERT') {
                setData(prev => [payload.new, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setData(prev => 
                  prev.map(item => 
                    item.id === payload.new.id ? payload.new : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setData(prev => 
                  prev.filter(item => item.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe((status) => {
            console.log(`Subscription status for ${tableName}:`, status);
          });

      } catch (err) {
        console.error(`Error setting up real-time for ${tableName}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    setupRealTimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, profile?.merchant_id]);

  const refetch = async () => {
    if (!profile?.merchant_id) return;
    
    try {
      setLoading(true);
      const { data: refreshedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setData(refreshedData || []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Real-time notifications hook
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
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
        timestamp: event.created_at,
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
              timestamp: payload.new.created_at,
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
