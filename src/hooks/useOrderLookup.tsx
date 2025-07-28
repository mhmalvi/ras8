
import { useState } from 'react';
import { EnhancedOrderService } from '@/services/enhancedOrderService';
import { OptimizedOrderService, type OptimizedOrder } from '@/services/optimizedOrderService';
import { MonitoringService } from '@/utils/monitoringService';

interface Order {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
  merchant_info?: {
    merchant_id: string;
    shop_domain?: string;
  };
}

export const useOrderLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const clearError = () => setError(null);
  const clearOrder = () => setOrder(null);

  const lookupOrder = async (orderNumber: string, email: string) => {
    MonitoringService.info('Order lookup initiated', { orderNumber, email });
    
    setLoading(true);
    setError(null);
    setOrder(null);
    
    try {
      // Try optimized service first
      const orderData: OptimizedOrder | null = await MonitoringService.monitorApiCall(
        'order_lookup',
        () => OptimizedOrderService.lookupOrder(orderNumber, email),
        { orderNumber, email }
      );

      if (orderData) {
        // Convert to expected format
        const formattedOrder: Order = {
          id: orderData.id,
          shopify_order_id: orderData.shopify_order_id,
          customer_email: orderData.customer_email,
          total_amount: orderData.total_amount,
          status: orderData.status,
          created_at: orderData.created_at,
          items: orderData.items,
          merchant_info: {
            merchant_id: orderData.merchant_id
          }
        };
        
        setOrder(formattedOrder);
        MonitoringService.info('Order lookup successful', { orderId: orderData.id });
        return formattedOrder;
      } else {
        const errorMessage = 'Order not found with provided details';
        setError(errorMessage);
        MonitoringService.warn('Order lookup failed - not found', { orderNumber, email });
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup order';
      setError(errorMessage);
      MonitoringService.error('Order lookup failed', { error: errorMessage, orderNumber, email });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    order,
    lookupOrder,
    clearError,
    clearOrder
  };
};
