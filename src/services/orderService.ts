
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

export class OrderService {
  static async lookupOrder(orderNumber: string, email: string): Promise<Order> {
    // Clean and validate inputs
    const cleanOrderNumber = orderNumber.replace(/^#/, '').trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanOrderNumber || !cleanEmail) {
      throw new Error('Order number and email are required');
    }

    try {
      // Single optimized query with proper error handling
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('shopify_order_id', cleanOrderNumber)
        .ilike('customer_email', cleanEmail)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          throw new Error(`Order ${orderNumber} not found for the provided email address. Please verify your order number and email.`);
        }
        throw new Error(`Unable to retrieve order: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      // Return formatted order data
      return {
        ...orderData,
        items: orderData.order_items || []
      };
    } catch (error) {
      // Re-throw with cleaner error message if it's already our custom error
      if (error instanceof Error && error.message.includes('Order') && error.message.includes('not found')) {
        throw error;
      }
      // Handle unexpected errors
      throw new Error('Unable to lookup order. Please try again or contact support.');
    }
  }
}
