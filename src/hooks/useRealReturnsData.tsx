
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

    const fetchReturns = async () => {
      try {
        console.log('🚀 Fetching returns for merchant_id:', profile.merchant_id);
        setLoading(true);
        
        // First, let's check if there are any returns in the database at all
        const { data: allReturns, error: allReturnsError } = await supabase
          .from('returns')
          .select('*');
        
        console.log('📊 Total returns in database:', allReturns?.length || 0);
        if (allReturns?.length) {
          console.log('📋 All returns merchant IDs:', allReturns.map(r => r.merchant_id));
        }
        
        const { data, error } = await supabase
          .from('returns')
          .select(`
            *,
            return_items (*),
            ai_suggestions (*)
          `)
          .eq('merchant_id', profile.merchant_id)
          .order('created_at', { ascending: false });

        console.log('📥 Query result:', { data: data?.length || 0, error });
        
        if (error) {
          console.error('🚨 Supabase error:', error);
          throw error;
        }
        
        // Type assertion to ensure proper typing
        const typedData = (data || []).map(item => ({
          ...item,
          status: item.status as 'requested' | 'approved' | 'in_transit' | 'completed',
          return_items: (item.return_items || []).map((returnItem: any) => ({
            ...returnItem,
            action: returnItem.action as 'refund' | 'exchange'
          })) as ReturnItem[],
          ai_suggestions: (item.ai_suggestions || []) as AISuggestion[]
        })) as Return[];
        
        console.log('✅ Processed returns data:', typedData.length, 'returns');
        console.log('📄 Sample return:', typedData[0]);
        
        setReturns(typedData);
        setError(null);
      } catch (err) {
        console.error('💥 Error fetching returns:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [profile?.merchant_id]);

  const refetch = async () => {
    console.log('🔄 Refetching returns data...');
    if (!profile?.merchant_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*),
          ai_suggestions (*)
        `)
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'requested' | 'approved' | 'in_transit' | 'completed',
        return_items: (item.return_items || []).map((returnItem: any) => ({
          ...returnItem,
          action: returnItem.action as 'refund' | 'exchange'
        })) as ReturnItem[],
        ai_suggestions: (item.ai_suggestions || []) as AISuggestion[]
      })) as Return[];
      
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
