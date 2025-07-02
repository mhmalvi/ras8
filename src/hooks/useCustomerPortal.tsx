
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface AIRecommendation {
  suggestedProduct: string;
  reasoning: string;
  confidence: number;
}

interface ReturnRequest {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: string;
  reason: string;
  total_amount: number;
  created_at: string;
  items: ReturnItem[];
}

interface ReturnItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  action: string;
}

export const useCustomerPortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);

  const clearError = () => setError(null);

  const lookupOrder = async (orderNumber: string, email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, find the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('shopify_order_id', orderNumber)
        .eq('customer_email', email)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          throw new Error('Order not found. Please check your order number and email address.');
        }
        throw orderError;
      }

      // Then fetch the order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsError) throw itemsError;

      const orderWithItems: Order = {
        ...orderData,
        items: itemsData || []
      };

      setOrder(orderWithItems);
      
      // Also fetch existing returns for this order
      await fetchCustomerReturns(email, orderNumber);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReturns = async (email: string, orderNumber?: string) => {
    try {
      let query = supabase
        .from('returns')
        .select(`
          *,
          return_items (*)
        `)
        .eq('customer_email', email);

      if (orderNumber) {
        query = query.eq('shopify_order_id', orderNumber);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const returnsWithItems = data?.map(returnItem => ({
        ...returnItem,
        items: returnItem.return_items || []
      })) || [];

      setReturns(returnsWithItems);
    } catch (err) {
      console.error('Error fetching returns:', err);
    }
  };

  const generateAIRecommendations = async (
    returnReason: string,
    productName: string,
    customerEmail: string,
    orderValue: number
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
        body: {
          returnReason,
          productName,
          customerEmail,
          orderValue
        }
      });

      if (error) throw error;

      if (data?.recommendations) {
        setAIRecommendations(data.recommendations);
      }
    } catch (err) {
      console.warn('AI recommendations failed:', err);
      // Don't throw error - recommendations are optional
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async (returnData: {
    orderNumber: string;
    email: string;
    selectedItems: string[];
    returnReasons: Record<string, string>;
  }) => {
    setLoading(true);
    setError(null);

    try {
      if (!order) throw new Error('Order not found');

      const selectedOrderItems = order.items.filter(item => 
        returnData.selectedItems.includes(item.id)
      );

      const totalAmount = selectedOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Create the return record
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          shopify_order_id: returnData.orderNumber,
          customer_email: returnData.email,
          reason: Object.values(returnData.returnReasons).join(', '),
          total_amount: totalAmount,
          status: 'requested'
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItems = selectedOrderItems.map(item => ({
        return_id: returnRecord.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        action: 'refund'
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      // Store AI suggestions if available
      if (aiRecommendations.length > 0) {
        const suggestions = aiRecommendations.map(rec => ({
          return_id: returnRecord.id,
          suggestion_type: 'exchange',
          suggested_product_name: rec.suggestedProduct,
          reasoning: rec.reasoning,
          confidence_score: rec.confidence / 100
        }));

        await supabase.from('ai_suggestions').insert(suggestions);
      }

      // Refresh returns list
      await fetchCustomerReturns(returnData.email, returnData.orderNumber);

      return { returnId: returnRecord.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit return';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReturn = async (returnId: string, updates: {
    selectedItems?: string[];
    returnReasons?: Record<string, string>;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: returnData, error: fetchError } = await supabase
        .from('returns')
        .select('*, return_items(*)')
        .eq('id', returnId)
        .single();

      if (fetchError) throw fetchError;

      // Only allow updates if status is 'requested' or 'pending'
      if (!['requested', 'pending'].includes(returnData.status)) {
        throw new Error('This return cannot be modified as it has already been processed.');
      }

      if (updates.returnReasons) {
        const { error: updateError } = await supabase
          .from('returns')
          .update({
            reason: Object.values(updates.returnReasons).join(', '),
            updated_at: new Date().toISOString()
          })
          .eq('id', returnId);

        if (updateError) throw updateError;
      }

      // Refresh returns list
      const currentReturn = returns.find(r => r.id === returnId);
      if (currentReturn) {
        await fetchCustomerReturns(currentReturn.customer_email);
      }

      return { success: true };
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
      const { data: returnData, error: fetchError } = await supabase
        .from('returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (fetchError) throw fetchError;

      // Only allow cancellation if status is 'requested' or 'pending'
      if (!['requested', 'pending'].includes(returnData.status)) {
        throw new Error('This return cannot be cancelled as it has already been processed.');
      }

      const { error: deleteError } = await supabase
        .from('returns')
        .delete()
        .eq('id', returnId);

      if (deleteError) throw deleteError;

      // Refresh returns list
      await fetchCustomerReturns(returnData.customer_email);

      return { success: true };
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
    order,
    returns,
    aiRecommendations,
    lookupOrder,
    fetchCustomerReturns,
    generateAIRecommendations,
    submitReturn,
    updateReturn,
    cancelReturn,
    clearError
  };
};
