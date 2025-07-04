
import { useState } from 'react';
import { ReturnService } from '@/services/returnService';

interface ReturnRequest {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: string;
  reason: string;
  total_amount: number;
  created_at: string;
  items: any[];
}

export const useReturnsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  const clearError = () => setError(null);

  const fetchCustomerReturns = async (email: string, orderNumber?: string) => {
    try {
      const returnsData = await ReturnService.fetchCustomerReturns(email, orderNumber);
      setReturns(returnsData);
    } catch (err) {
      console.error('Error fetching returns:', err);
    }
  };

  const submitReturn = async (returnData: {
    orderNumber: string;
    email: string;
    selectedItems: string[];
    returnReasons: Record<string, string>;
  }, order: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ReturnService.submitReturn(returnData, order);
      await fetchCustomerReturns(returnData.email, returnData.orderNumber);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit return';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReturn = async (returnId: string, updates: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ReturnService.updateReturn(returnId, updates);
      const currentReturn = returns.find(r => r.id === returnId);
      if (currentReturn) {
        await fetchCustomerReturns(currentReturn.customer_email);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update return';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelReturn = async (returnId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: returnData } = await import('@/integrations/supabase/client').then(m => 
        m.supabase.from('returns').select('*').eq('id', returnId).single()
      );
      
      const result = await ReturnService.cancelReturn(returnId);
      if (returnData.data) {
        await fetchCustomerReturns(returnData.data.customer_email);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel return';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    returns,
    fetchCustomerReturns,
    submitReturn,
    updateReturn,
    cancelReturn,
    clearError
  };
};
