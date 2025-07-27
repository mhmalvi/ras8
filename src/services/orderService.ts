
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

    console.log('🔍 Looking up order:', { cleanOrderNumber, cleanEmail });

    if (!cleanOrderNumber || !cleanEmail) {
      throw new Error('Order number and email are required');
    }

    try {
      // Try multiple query approaches to find the order
      let orderData = null;
      let orderError = null;

      // First attempt: exact match on shopify_order_id
      console.log('📋 Attempting exact match on shopify_order_id...');
      const { data: exactMatch, error: exactError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('shopify_order_id', cleanOrderNumber)
        .eq('customer_email', cleanEmail)
        .maybeSingle();

      if (exactMatch && !exactError) {
        console.log('✅ Found with exact match');
        orderData = exactMatch;
      } else {
        console.log('❌ Exact match failed, trying with # prefix...');
        
        // Second attempt: try with # prefix
        const { data: prefixMatch, error: prefixError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('shopify_order_id', `#${cleanOrderNumber}`)
          .eq('customer_email', cleanEmail)
          .maybeSingle();

        if (prefixMatch && !prefixError) {
          console.log('✅ Found with # prefix');
          orderData = prefixMatch;
        } else {
          console.log('❌ Prefix match failed, trying case-insensitive email...');
          
          // Third attempt: case-insensitive email matching
          const { data: ilikeMath, error: ilikeError } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (*)
            `)
            .eq('shopify_order_id', cleanOrderNumber)
            .ilike('customer_email', cleanEmail)
            .maybeSingle();

          if (ilikeMath && !ilikeError) {
            console.log('✅ Found with case-insensitive email');
            orderData = ilikeMath;
          } else {
            console.log('❌ All lookup attempts failed');
            orderError = ilikeError || prefixError || exactError;
          }
        }
      }

      if (!orderData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Available orders for debugging:');
        }
        const { data: allOrders } = await supabase
          .from('orders')
          .select('shopify_order_id, customer_email')
          .limit(5);
        console.log('Available orders:', allOrders);

        throw new Error(`Order ${orderNumber} not found for email ${email}. Please verify your order number and email address.`);
      }

      console.log('✅ Order found:', orderData);

      // Return formatted order data
      return {
        ...orderData,
        items: orderData.order_items || []
      };
    } catch (error) {
      console.error('💥 OrderService.lookupOrder error:', error);
      
      // Re-throw with cleaner error message if it's already our custom error
      if (error instanceof Error && error.message.includes('Order') && error.message.includes('not found')) {
        throw error;
      }
      // Handle unexpected errors
      throw new Error('Unable to lookup order. Please try again or contact support.');
    }
  }
}
