
import { useOrderLookup } from './useOrderLookup';
import { useReturnsManagement } from './useReturnsManagement';
import { useAIRecommendations } from './useAIRecommendations';
import { OptimizedOrderService } from '@/services/optimizedOrderService';

export const useCustomerPortal = () => {
  const {
    loading: orderLoading,
    error: orderError,
    order,
    lookupOrder,
    clearError: clearOrderError,
    clearOrder
  } = useOrderLookup();

  const {
    loading: returnsLoading,
    error: returnsError,
    returns,
    fetchCustomerReturns,
    submitReturn: submitReturnService,
    updateReturn,
    cancelReturn
  } = useReturnsManagement();

  const {
    loading: aiLoading,
    aiRecommendations,
    generateAIRecommendations,
    storeAISuggestions
  } = useAIRecommendations();

  const loading = orderLoading || returnsLoading || aiLoading;
  const error = orderError || returnsError;

  const clearError = () => {
    clearOrderError();
  };

  const submitReturn = async (returnData: {
    orderNumber: string;
    email: string;
    selectedItems: string[];
    returnReasons: Record<string, string>;
  }) => {
    if (!order) {
      throw new Error('No order found. Please lookup your order first.');
    }

    // Use optimized service for better performance and reliability
    try {
      // Generate AI recommendations if items are selected (non-blocking)
      if (returnData.selectedItems.length > 0) {
        const firstSelectedItem = order.items.find(item => returnData.selectedItems.includes(item.id));
        if (firstSelectedItem && returnData.returnReasons[firstSelectedItem.id]) {
          generateAIRecommendations(
            returnData.returnReasons[firstSelectedItem.id],
            firstSelectedItem.product_name,
            returnData.email,
            order.total_amount
          ).catch(aiError => {
            // Don't fail the return if AI fails
            console.warn('AI recommendations failed:', aiError);
          });
        }
      }

      // Submit the return using optimized service
      const result = await OptimizedOrderService.submitReturn(returnData, {
        id: order.id,
        shopify_order_id: order.shopify_order_id,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        merchant_id: order.merchant_info?.merchant_id || '',
        items: order.items
      });

      // Store AI suggestions if available (non-blocking)
      if (aiRecommendations.length > 0) {
        storeAISuggestions(result.returnId, aiRecommendations).catch(aiError => {
          console.warn('Failed to store AI suggestions:', aiError);
        });
      }

      return result;

    } catch (error) {
      console.error('Return submission failed:', error);
      throw error;
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
    clearError,
    clearOrder
  };
};
