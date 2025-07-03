
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Return {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: 'requested' | 'approved' | 'in_transit' | 'completed';
  reason: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  merchant_id: string;
  return_items?: ReturnItem[];
  ai_suggestions?: AISuggestion[];
}

interface ReturnItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  action: 'refund' | 'exchange';
}

interface AISuggestion {
  id: string;
  suggested_product_name: string;
  suggestion_type: string;
  confidence_score: number;
  reasoning: string;
}

// Helper function to execute the returns query and process data
const fetchReturnsQuery = async (merchantId: string) => {
  console.log('🚀 Fetching returns for merchant_id:', merchantId);
  
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      return_items (*),
      ai_suggestions (*)
    `)
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching returns:', error);
    throw error;
  }
  
  console.log('✅ Raw returns data:', data?.length, 'returns');
  
  // Type assertion to ensure proper typing
  return (data || []).map(item => ({
    ...item,
    status: item.status as 'requested' | 'approved' | 'in_transit' | 'completed',
    return_items: (item.return_items || []).map((returnItem: any) => ({
      ...returnItem,
      action: returnItem.action as 'refund' | 'exchange'
    })) as ReturnItem[],
    ai_suggestions: (item.ai_suggestions || []) as AISuggestion[]
  })) as Return[];
};

export const useRealReturnsData = () => {
  const { profile } = useProfile();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 useRealReturnsData: Profile changed:', profile);
    
    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id in profile:', profile);
      setReturns([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const fetchAndSubscribe = async () => {
      try {
        console.log('🚀 Setting up real-time returns for merchant:', profile.merchant_id);
        setLoading(true);
        
        // Fetch initial data
        const typedData = await fetchReturnsQuery(profile.merchant_id);
        
        console.log('✅ Processed returns data:', typedData.length, 'returns');
        setReturns(typedData);
        setError(null);

        // Set up real-time subscription
        channel = supabase
          .channel(`returns-realtime-${profile.merchant_id}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events
              schema: 'public',
              table: 'returns',
              filter: `merchant_id=eq.${profile.merchant_id}`
            },
            async (payload) => {
              console.log('🔄 Returns real-time update:', payload.eventType, payload);
              
              try {
                // Refetch all data to ensure consistency with related tables
                const updatedData = await fetchReturnsQuery(profile.merchant_id);
                setReturns(updatedData);
              } catch (error) {
                console.error('Error updating returns from real-time:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'return_items'
            },
            async (payload) => {
              console.log('🔄 Return items real-time update:', payload.eventType);
              
              // Refetch returns data when return items change
              try {
                const updatedData = await fetchReturnsQuery(profile.merchant_id);
                setReturns(updatedData);
              } catch (error) {
                console.error('Error updating returns from return_items change:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ai_suggestions'
            },
            async (payload) => {
              console.log('🤖 AI suggestions real-time update:', payload.eventType);
              
              // Refetch returns data when AI suggestions change
              try {
                const updatedData = await fetchReturnsQuery(profile.merchant_id);
                setReturns(updatedData);
              } catch (error) {
                console.error('Error updating returns from ai_suggestions change:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Returns subscription status:', status);
          });

      } catch (err) {
        console.error('💥 Error fetching returns:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();
    
    // Listen for manual sync events
    const handleDataSync = () => {
      console.log('📢 Data sync event received in useRealReturnsData');
      if (profile?.merchant_id) {
        fetchAndSubscribe();
      }
    };
    
    const handleProfileUpdate = () => {
      console.log('📢 Profile update event received in useRealReturnsData');
      if (profile?.merchant_id) {
        fetchAndSubscribe();
      }
    };
    
    window.addEventListener('dataSync', handleDataSync);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('dataSync', handleDataSync);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [profile?.merchant_id]);

  const refetch = async () => {
    console.log('🔄 Manual refetch requested...');
    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id for refetch');
      return;
    }
    
    try {
      setLoading(true);
      const typedData = await fetchReturnsQuery(profile.merchant_id);
      
      console.log('🔄 Refetch complete:', typedData.length, 'returns');
      setReturns(typedData);
      setError(null);
    } catch (err) {
      console.error('💥 Error refetching returns:', err);
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
