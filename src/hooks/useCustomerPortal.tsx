
import { useOrderLookup } from './useOrderLookup';
import { useReturnsManagement } from './useReturnsManagement';
import { useAIRecommendations } from './useAIRecommendations';

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

    // Generate AI recommendations if items are selected
    if (returnData.selectedItems.length > 0) {
      const firstSelectedItem = order.items.find(item => returnData.selectedItems.includes(item.id));
      if (firstSelectedItem && returnData.returnReasons[firstSelectedItem.id]) {
        try {
          await generateAIRecommendations(
            returnData.returnReasons[firstSelectedItem.id],
            firstSelectedItem.product_name,
            returnData.email,
            order.total_amount
          );
        } catch (aiError) {
          // Don't fail the return if AI fails
          console.warn('AI recommendations failed:', aiError);
        }
      }
    }

    // Submit the return
    const result = await submitReturnService(returnData, order);

    // Store AI suggestions if available
    if (aiRecommendations.length > 0) {
      try {
        await storeAISuggestions(result.returnId, aiRecommendations);
      } catch (aiError) {
        console.warn('Failed to store AI suggestions:', aiError);
      }
    }

    return result;
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
