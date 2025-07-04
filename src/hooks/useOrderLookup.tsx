
import { useState } from 'react';
import { OrderService } from '@/services/orderService';

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
    setLoading(true);
    setError(null);
    setOrder(null);
    
    try {
      const orderData = await OrderService.lookupOrder(orderNumber, email);
      setOrder(orderData);
      return orderData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup order';
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
    lookupOrder,
    clearError,
    clearOrder
  };
};
