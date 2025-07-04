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
      console.log('🔍 Looking up order:', orderNumber, 'for email:', email);
      
      // Clean order number (remove # if present and normalize)
      let cleanOrderNumber = orderNumber.replace('#', '').trim();
      
      // If it doesn't start with ORD-, try adding it
      if (!cleanOrderNumber.startsWith('ORD-')) {
        cleanOrderNumber = `ORD-${cleanOrderNumber}`;
      }
      
      console.log('🔍 Searching for cleaned order number:', cleanOrderNumber);
      
      // First, find the order with exact match
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('shopify_order_id', cleanOrderNumber)
        .eq('customer_email', email.toLowerCase().trim())
        .single();

      console.log('📊 Order query result:', { orderData, orderError });

      let finalOrderData = orderData;

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          // Try without the ORD- prefix as fallback
          const fallbackOrderNumber = orderNumber.replace('#', '').replace('ORD-', '').trim();
          console.log('🔄 Trying fallback order number:', fallbackOrderNumber);
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('orders')
            .select('*')
            .eq('shopify_order_id', fallbackOrderNumber)
            .eq('customer_email', email.toLowerCase().trim())
            .single();

          if (fallbackError) {
            throw new Error('Order not found. Please check your order number and email address.');
          }
          
          finalOrderData = fallbackData;
        } else {
          throw orderError;
        }
      }

      console.log('✅ Order found:', finalOrderData);

      // Then fetch the order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', finalOrderData.id);

      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Order items found:', itemsData?.length || 0);

      const orderWithItems: Order = {
        ...finalOrderData,
        items: itemsData || []
      };

      setOrder(orderWithItems);
      
      // Also fetch existing returns for this order
      await fetchCustomerReturns(email, cleanOrderNumber);
      
      console.log('✅ Order lookup completed successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup order';
      console.error('❌ Order lookup failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReturns = async (email: string, orderNumber?: string) => {
    try {
      console.log('🔍 Fetching returns for:', email, orderNumber);
      
      let query = supabase
        .from('returns')
        .select(`
          *,
          return_items (*)
        `)
        .eq('customer_email', email.toLowerCase());

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
      console.log('✅ Fetched returns:', returnsWithItems.length);
    } catch (err) {
      console.error('❌ Error fetching returns:', err);
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
      console.log('🤖 Generating AI recommendations...');
      
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
        console.log('✅ AI recommendations generated:', data.recommendations.length);
      }
    } catch (err) {
      console.warn('⚠️ AI recommendations failed:', err);
      // Don't throw error - recommendations are optional
      setAIRecommendations([]);
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
      console.log('📝 Submitting return request...', returnData);
      
      if (!order) throw new Error('Order not found');

      const selectedOrderItems = order.items.filter(item => 
        returnData.selectedItems.includes(item.id)
      );

      if (selectedOrderItems.length === 0) {
        throw new Error('No items selected for return');
      }

      const totalAmount = selectedOrderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // Create the return record
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          shopify_order_id: returnData.orderNumber.replace('#', ''),
          customer_email: returnData.email.toLowerCase(),
          reason: Object.values(returnData.returnReasons).join(', '),
          total_amount: totalAmount,
          status: 'requested'
        })
        .select()
        .single();

      if (returnError) throw returnError;

      console.log('✅ Return record created:', returnRecord.id);

      // Create return items
      const returnItems = selectedOrderItems.map(item => ({
        return_id: returnRecord.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        action: 'refund' as const
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      console.log('✅ Return items created:', returnItems.length);

      // Store AI suggestions if available
      if (aiRecommendations.length > 0) {
        const suggestions = aiRecommendations.map(rec => ({
          return_id: returnRecord.id,
          suggestion_type: 'exchange',
          suggested_product_name: rec.suggestedProduct,
          reasoning: rec.reasoning,
          confidence_score: rec.confidence / 100
        }));

        const { error: suggestionsError } = await supabase
          .from('ai_suggestions')
          .insert(suggestions);

        if (suggestionsError) {
          console.warn('⚠️ Failed to store AI suggestions:', suggestionsError);
        } else {
          console.log('✅ AI suggestions stored:', suggestions.length);
        }
      }

      // Refresh returns list
      await fetchCustomerReturns(returnData.email, returnData.orderNumber);

      console.log('✅ Return submission completed successfully');
      return { returnId: returnRecord.id };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit return';
      console.error('❌ Return submission failed:', errorMessage);
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
      console.log('🔄 Updating return:', returnId, updates);
      
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

      console.log('✅ Return updated successfully');
      return { success: true };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update return';
      console.error('❌ Return update failed:', errorMessage);
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
      console.log('❌ Cancelling return:', returnId);
      
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

      console.log('✅ Return cancelled successfully');
      return { success: true };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel return';
      console.error('❌ Return cancellation failed:', errorMessage);
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
