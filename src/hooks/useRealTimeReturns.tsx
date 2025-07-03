
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Database } from '@/integrations/supabase/types';

type ReturnsRow = Database['public']['Tables']['returns']['Row'];

export const useRealTimeReturns = () => {
  const [returns, setReturns] = useState<ReturnsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile?.merchant_id) {
      setReturns([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const setupRealTimeSubscription = async () => {
      try {
        setLoading(true);

        // Initial data fetch
        const { data: initialData, error: fetchError } = await supabase
          .from('returns')
          .select('*')
          .eq('merchant_id', profile.merchant_id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching returns:', fetchError);
          setError(fetchError.message);
        } else {
          setReturns(initialData || []);
          setError(null);
        }

        // Set up real-time subscription
        channel = supabase
          .channel('realtime-returns')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'returns',
              filter: `merchant_id=eq.${profile.merchant_id}`
            },
            (payload) => {
              console.log('Real-time update for returns:', payload);
              
              if (payload.eventType === 'INSERT') {
                setReturns(prev => [payload.new as ReturnsRow, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setReturns(prev => 
                  prev.map(item => 
                    item.id === payload.new.id ? payload.new as ReturnsRow : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setReturns(prev => 
                  prev.filter(item => item.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status for returns:', status);
          });

      } catch (err) {
        console.error('Error setting up real-time for returns:', err);
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

  const refetch = async () => {
    if (!profile?.merchant_id) return;
    
    try {
      setLoading(true);
      const { data: refreshedData, error: fetchError } = await supabase
        .from('returns')
        .select('*')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReturns(refreshedData || []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    returns,
    loading,
    error,
    refetch
  };
};
