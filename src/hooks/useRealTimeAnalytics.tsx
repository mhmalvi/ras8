
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Database } from '@/integrations/supabase/types';

type AnalyticsRow = Database['public']['Tables']['analytics_events']['Row'];

export const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile?.merchant_id) {
      setAnalytics([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const setupRealTimeSubscription = async () => {
      try {
        setLoading(true);

        // Initial data fetch
        const { data: initialData, error: fetchError } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('merchant_id', profile.merchant_id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching analytics:', fetchError);
          setError(fetchError.message);
        } else {
          setAnalytics(initialData || []);
          setError(null);
        }

        // Set up real-time subscription
        channel = supabase
          .channel('realtime-analytics')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'analytics_events',
              filter: `merchant_id=eq.${profile.merchant_id}`
            },
            (payload) => {
              console.log('Real-time update for analytics:', payload);
              
              if (payload.eventType === 'INSERT') {
                setAnalytics(prev => [payload.new as AnalyticsRow, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setAnalytics(prev => 
                  prev.map(item => 
                    item.id === payload.new.id ? payload.new as AnalyticsRow : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setAnalytics(prev => 
                  prev.filter(item => item.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status for analytics:', status);
          });

      } catch (err) {
        console.error('Error setting up real-time for analytics:', err);
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
  }, [profile?.merchant_id]);

  return {
    analytics,
    loading,
    error
  };
};
