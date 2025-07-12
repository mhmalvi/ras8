
import { useState } from 'react';
import { EnhancedOrderService } from '@/services/enhancedOrderService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedOrder {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
  }>;
  merchant_info?: {
    shop_domain: string;
    merchant_id: string;
  };
}

export const useEnhancedOrderLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<EnhancedOrder | null>(null);
  const { toast } = useToast();

  const lookupOrder = async (orderNumber: string, email: string) => {
    if (!orderNumber.trim() || !email.trim()) {
      setError('Order number and email are required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Enhanced lookup: ${orderNumber} / ${email}`);
      
      const foundOrder = await EnhancedOrderService.lookupOrderWithFallback(
        orderNumber.trim(),
        email.trim().toLowerCase()
      );

      if (foundOrder) {
        setOrder(foundOrder);
        toast({
          title: "Order Found",
          description: `Found order ${orderNumber} with ${foundOrder.items.length} items`,
        });
        return foundOrder;
      } else {
        setError('Order not found. Please check the order number and email address.');
        toast({
          title: "Order Not Found",
          description: "Please verify your order number and email address",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup order';
      setError(errorMessage);
      toast({
        title: "Lookup Failed", 
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createReturn = async (
    returnReason: string,
    selectedItems: Array<{
      product_id: string;
      quantity: number;
      reason: string;
    }>
  ) => {
    if (!order) {
      throw new Error('No order selected for return');
    }

    setLoading(true);
    try {
      const returnId = await EnhancedOrderService.createReturnFromOrder(
        order,
        returnReason,
        selectedItems
      );

      if (returnId) {
        toast({
          title: "Return Created",
          description: `Return request ${returnId} has been submitted successfully`,
        });
        return returnId;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create return';
      toast({
        title: "Return Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearOrder = () => {
    setOrder(null);
    setError(null);
  };

  return {
    loading,
    error,
    order,
    lookupOrder,
    createReturn,
    clearOrder
  };
};
