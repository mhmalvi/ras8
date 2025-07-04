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
      
      // Clean the inputs
      const cleanOrderNumber = orderNumber.replace(/^#/, '').trim();
      const cleanEmail = email.trim().toLowerCase();
      
      console.log('🔍 Cleaned search params:', { cleanOrderNumber, cleanEmail });

      // Let's first check what orders exist in the database
      const { data: allOrders, error: debugError } = await supabase
        .from('orders')
        .select('shopify_order_id, customer_email')
        .limit(10);
      
      console.log('🔍 All orders in database:', allOrders, 'Error:', debugError);

      // Now try the specific lookup
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('shopify_order_id', cleanOrderNumber)
        .eq('customer_email', cleanEmail)
        .maybeSingle();

      console.log('📊 Order lookup result:', { orderData, orderError });

      if (orderError) {
        console.error('❌ Database error:', orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      if (!orderData) {
        console.log('❌ No order found');
        throw new Error(`Order ${orderNumber} not found for email ${email}. Please check your details.`);
      }

      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      console.log('📦 Order items result:', { orderItems, itemsError });

      if (itemsError) {
        console.warn('⚠️ Could not fetch order items:', itemsError);
      }

      // Create the order object
      const orderWithItems: Order = {
        ...orderData,
        items: orderItems || []
      };

      console.log('✅ Final order object:', orderWithItems);
      setOrder(orderWithItems);
      
      // Fetch existing returns
      await fetchCustomerReturns(cleanEmail, cleanOrderNumber);
      
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
        .ilike('customer_email', email);

      if (orderNumber) {
        query = query.eq('shopify_order_id', orderNumber);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching returns:', error);
        return;
      }

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

      if (error) {
        console.warn('⚠️ AI recommendations failed:', error);
        setAIRecommendations([]);
        return;
      }

      if (data?.recommendations) {
        setAIRecommendations(data.recommendations);
        console.log('✅ AI recommendations generated:', data.recommendations.length);
      }
    } catch (err) {
      console.warn('⚠️ AI recommendations failed:', err);
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

      // Create the return record - merchant_id can be null for customer-initiated returns
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          shopify_order_id: returnData.orderNumber.replace('#', ''),
          customer_email: returnData.email.toLowerCase(),
          reason: Object.values(returnData.returnReasons).join(', '),
          total_amount: totalAmount,
          status: 'requested',
          merchant_id: null // Customer-initiated returns don't have a merchant context
        })
        .select()
        .single();

      if (returnError) {
        console.error('❌ Return creation error:', returnError);
        throw new Error(`Failed to create return: ${returnError.message}`);
      }

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

      if (itemsError) {
        console.error('❌ Return items creation error:', itemsError);
        throw new Error(`Failed to create return items: ${itemsError.message}`);
      }

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
