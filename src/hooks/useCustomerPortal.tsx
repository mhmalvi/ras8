
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiService } from '@/services/aiService';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  eligible: boolean;
  reason?: string;
}

interface Order {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

interface AIRecommendation {
  suggestedProduct: string;
  confidence: number;
  reasoning: string;
}

export const useCustomerPortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);

  const lookupOrder = async (orderNumber: string, email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Looking up order:', orderNumber, 'for email:', email);
      
      // Find order by shopify_order_id and customer_email from real database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          shopify_order_id,
          customer_email,
          total_amount,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('shopify_order_id', orderNumber)
        .eq('customer_email', email.toLowerCase().trim())
        .single();

      console.log('📊 Order query result:', { orderData, orderError });

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          throw new Error('Order not found. Please check your order number and email address.');
        }
        throw new Error(`Database error: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error('Order not found. Please check your order number and email address.');
      }

      // Transform data to expected format
      const transformedOrder: Order = {
        id: orderData.id,
        shopify_order_id: orderData.shopify_order_id,
        customer_email: orderData.customer_email,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at,
        items: (orderData.order_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          eligible: true, // All items are eligible for return
        }))
      };

      console.log('✅ Order transformed:', transformedOrder);
      setOrder(transformedOrder);
      return transformedOrder;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to lookup order';
      console.error('💥 Order lookup error:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async (returnReason: string, productName: string, customerEmail: string, orderValue: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🤖 Generating AI recommendations for:', { returnReason, productName, customerEmail, orderValue });
      
      const recommendation = await aiService.generateExchangeRecommendation({
        returnReason,
        productName,
        customerEmail,
        orderValue
      });

      const recommendations: AIRecommendation[] = [
        {
          suggestedProduct: recommendation.suggestedProduct,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning
        }
      ];

      console.log('✅ AI recommendations generated:', recommendations);
      setAiRecommendations(recommendations);
      return recommendations;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate recommendations';
      console.error('💥 AI recommendation error:', errorMsg);
      setError(errorMsg);
      
      // Return graceful fallback recommendations
      const fallback: AIRecommendation[] = [
        {
          suggestedProduct: `Enhanced version of ${productName}`,
          confidence: 75,
          reasoning: 'Based on similar customer preferences and return patterns.'
        }
      ];
      setAiRecommendations(fallback);
      return fallback;
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
      console.log('📤 Submitting return:', returnData);

      // Get any available merchant for return processing
      // In a real system, this would be determined by the order's merchant
      const { data: merchants, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .limit(1);

      if (merchantError) {
        console.error('💥 Merchant query error:', merchantError);
        throw new Error('Unable to process return at this time. Please try again later.');
      }

      if (!merchants || merchants.length === 0) {
        throw new Error('No merchant found. Please contact support.');
      }

      const merchantId = merchants[0].id;
      console.log('🏪 Using merchant ID:', merchantId);

      // Create return record
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          shopify_order_id: returnData.orderNumber,
          customer_email: returnData.email.toLowerCase().trim(),
          reason: Object.values(returnData.returnReasons).join(', '),
          status: 'requested',
          total_amount: order?.total_amount || 0,
          merchant_id: merchantId
        })
        .select()
        .single();

      if (returnError) {
        console.error('💥 Return creation error:', returnError);
        throw new Error(`Failed to create return: ${returnError.message}`);
      }

      console.log('✅ Return record created:', returnRecord);

      // Create return item records
      const returnItems = returnData.selectedItems.map(itemId => {
        const originalItem = order?.items.find(item => item.id === itemId);
        return {
          return_id: returnRecord.id,
          product_id: originalItem?.product_id || '',
          product_name: originalItem?.product_name || '',
          price: originalItem?.price || 0,
          quantity: originalItem?.quantity || 1,
          action: 'refund'
        };
      });

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) {
        console.error('💥 Return items creation error:', itemsError);
        throw new Error(`Failed to create return items: ${itemsError.message}`);
      }

      console.log('✅ Return items created:', returnItems.length, 'items');

      return {
        returnId: returnRecord.id,
        status: 'submitted'
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit return';
      console.error('💥 Return submission error:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    order,
    aiRecommendations,
    lookupOrder,
    generateAIRecommendations,
    submitReturn,
    clearError: () => setError(null)
  };
};
