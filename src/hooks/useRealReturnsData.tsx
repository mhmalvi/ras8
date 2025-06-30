
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
    if (!profile?.merchant_id) {
      setReturns([]);
      setLoading(false);
      return;
    }

    const fetchReturns = async () => {
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
        
        setReturns(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching returns:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [profile?.merchant_id]);

  const refetch = async () => {
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
      
      setReturns(data || []);
      setError(null);
    } catch (err) {
      console.error('Error refetching returns:', err);
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
