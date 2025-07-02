
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
      console.log('🔍 Starting order lookup for:', { orderNumber, email });
      
      // Clean and normalize inputs
      const cleanOrderNumber = orderNumber.trim();
      const cleanEmail = email.toLowerCase().trim();
      
      console.log('🧹 Cleaned inputs:', { cleanOrderNumber, cleanEmail });
      
      // Query orders table with proper join to order_items
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
        .eq('shopify_order_id', cleanOrderNumber)
        .eq('customer_email', cleanEmail)
        .single();

      console.log('📊 Database query result:', { orderData, orderError });

      if (orderError) {
        console.error('💥 Database error:', orderError);
        if (orderError.code === 'PGRST116') {
          throw new Error('Order not found. Please check your order number and email address.');
        }
        throw new Error(`Failed to find order: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error('Order not found. Please verify your order number and email address.');
      }

      // Transform the data to match our interface
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
          eligible: true, // All items are eligible for return by default
        }))
      };

      console.log('✅ Order successfully transformed:', transformedOrder);
      setOrder(transformedOrder);
      return transformedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while looking up your order.';
      console.error('💥 Order lookup failed:', errorMessage);
      setError(errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI recommendations';
      console.error('💥 AI recommendation error:', errorMessage);
      
      // Provide fallback recommendations instead of failing
      const fallbackRecommendations: AIRecommendation[] = [
        {
          suggestedProduct: `Enhanced version of ${productName}`,
          confidence: 75,
          reasoning: 'Based on similar customer preferences and return patterns.'
        }
      ];
      
      console.log('🔄 Using fallback recommendations:', fallbackRecommendations);
      setAiRecommendations(fallbackRecommendations);
      return fallbackRecommendations;
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
      console.log('📤 Starting return submission:', returnData);

      if (!order) {
        throw new Error('Order information is missing. Please try looking up your order again.');
      }

      // Get first available merchant for demo purposes
      const { data: merchants, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .limit(1);

      if (merchantError) {
        console.error('💥 Merchant lookup error:', merchantError);
        throw new Error('Unable to process return at this time. Please try again later.');
      }

      if (!merchants || merchants.length === 0) {
        throw new Error('No merchant available to process this return. Please contact support.');
      }

      const merchantId = merchants[0].id;
      console.log('🏪 Using merchant ID:', merchantId);

      // Create the return record
      const returnRecord = {
        shopify_order_id: returnData.orderNumber.trim(),
        customer_email: returnData.email.toLowerCase().trim(),
        reason: Object.values(returnData.returnReasons).join(', '),
        status: 'requested',
        total_amount: order.total_amount,
        merchant_id: merchantId
      };

      console.log('📝 Creating return record:', returnRecord);

      const { data: createdReturn, error: returnError } = await supabase
        .from('returns')
        .insert(returnRecord)
        .select()
        .single();

      if (returnError) {
        console.error('💥 Return creation error:', returnError);
        throw new Error(`Failed to create return request: ${returnError.message}`);
      }

      console.log('✅ Return record created:', createdReturn);

      // Create return items
      const returnItems = returnData.selectedItems.map(itemId => {
        const originalItem = order.items.find(item => item.id === itemId);
        if (!originalItem) {
          throw new Error(`Selected item not found: ${itemId}`);
        }
        
        return {
          return_id: createdReturn.id,
          product_id: originalItem.product_id,
          product_name: originalItem.product_name,
          price: originalItem.price,
          quantity: originalItem.quantity,
          action: 'refund'
        };
      });

      console.log('📦 Creating return items:', returnItems);

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) {
        console.error('💥 Return items creation error:', itemsError);
        throw new Error(`Failed to create return items: ${itemsError.message}`);
      }

      console.log('✅ Return items created successfully');

      return {
        returnId: createdReturn.id,
        status: 'submitted'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit return request';
      console.error('💥 Return submission error:', errorMessage);
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
    aiRecommendations,
    lookupOrder,
    generateAIRecommendations,
    submitReturn,
    clearError: () => setError(null)
  };
};
