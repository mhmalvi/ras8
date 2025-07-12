
import { useState } from 'react';
import { EnhancedOrderService } from '@/services/enhancedOrderService';
import { MonitoringService } from '@/utils/monitoringService';

interface Order {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
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
      const orderData = await MonitoringService.monitorApiCall(
        'order_lookup',
        () => EnhancedOrderService.lookupOrderWithFallback(orderNumber, email),
        { orderNumber, email }
      );

      if (orderData) {
        setOrder(orderData);
        MonitoringService.info('Order lookup successful', { orderId: orderData.id });
        return orderData;
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
