
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
    // Clean the inputs
    const cleanOrderNumber = orderNumber.replace(/^#/, '').trim();
    const cleanEmail = email.trim().toLowerCase();

    // Simplified query with better error handling
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('shopify_order_id', cleanOrderNumber)
      .eq('customer_email', cleanEmail)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        throw new Error(`Order ${orderNumber} not found for email ${email}. Please check your order number and email address.`);
      }
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    if (!orderData) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    // Return the order with items
    return {
      ...orderData,
      items: orderData.order_items || []
    };
  }
}
