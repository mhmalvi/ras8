
import { useOrderLookup } from './useOrderLookup';
import { useReturnsManagement } from './useReturnsManagement';
import { useAIRecommendations } from './useAIRecommendations';

export const useCustomerPortal = () => {
  const {
    loading: orderLoading,
    error: orderError,
    order,
    lookupOrder,
    clearError: clearOrderError
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
    // Generate AI recommendations first
    if (returnData.selectedItems.length > 0 && order) {
      const firstSelectedItem = order.items.find(item => returnData.selectedItems.includes(item.id));
      if (firstSelectedItem) {
        await generateAIRecommendations(
          returnData.returnReasons[firstSelectedItem.id],
          firstSelectedItem.product_name,
          returnData.email,
          order.total_amount
        );
      }
    }

    const result = await submitReturnService(returnData, order);

    // Store AI suggestions
    if (aiRecommendations.length > 0) {
      await storeAISuggestions(result.returnId, aiRecommendations);
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
    clearError
  };
};
