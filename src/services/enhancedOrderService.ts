import { supabase } from '@/integrations/supabase/client';

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

export class EnhancedOrderService {
  static async lookupOrderWithFallback(
    orderNumber: string,
    email: string
  ): Promise<EnhancedOrder | null> {
    try {
      console.log(`🔍 Enhanced order lookup: ${orderNumber} for ${email}`);

      // First try database lookup
      const dbOrder = await this.lookupFromDatabase(orderNumber, email);
      if (dbOrder) {
        console.log('✅ Found order in database');
        return dbOrder;
      }

      // Fallback to Shopify lookup
      console.log('📡 Attempting Shopify fallback lookup');
      const shopifyOrder = await this.lookupFromShopify(orderNumber, email);
      if (shopifyOrder) {
        console.log('✅ Found order via Shopify API');
        return shopifyOrder;
      }

      console.log('❌ Order not found in database or Shopify');
      return null;
    } catch (error) {
      console.error('Enhanced order lookup failed:', error);
      return null;
    }
  }

  private static async lookupFromDatabase(
    orderNumber: string,
    email: string
  ): Promise<EnhancedOrder | null> {
    try {
      const cleanOrderNumber = orderNumber.replace('#', '');
      
      // The orders table uses shopify_order_id, not order_number
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          shopify_order_id,
          customer_email,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('customer_email', email.toLowerCase())
        .or(`shopify_order_id.eq.${cleanOrderNumber},shopify_order_id.eq.#${cleanOrderNumber},shopify_order_id.eq.ORD-${cleanOrderNumber}`)
        .maybeSingle();

      if (error) {
        console.error('Database lookup error:', error);
        return null;
      }

      if (!order) {
        console.log('No order found in database for:', { orderNumber: cleanOrderNumber, email });
        return null;
      }

      return {
        id: order.id,
        shopify_order_id: order.shopify_order_id,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: (order.order_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity
        }))
      };
    } catch (error) {
      console.error('Database lookup failed:', error);
      return null;
    }
  }

  private static async lookupFromShopify(
    orderNumber: string,
    email: string
  ): Promise<EnhancedOrder | null> {
    try {
      // Get active merchants
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('id, shop_domain, access_token')
        .not('access_token', 'is', null);

      if (error || !merchants) {
        return null;
      }

      // Try each merchant
      for (const merchant of merchants) {
        try {
          const shopifyOrder = await this.fetchFromShopifyAPI(
            merchant.shop_domain,
            merchant.access_token,
            orderNumber,
            email
          );

          if (shopifyOrder) {
            // Sync to database
            await this.syncToDatabase(merchant.id, shopifyOrder);
            
            return {
              id: shopifyOrder.id,
              shopify_order_id: shopifyOrder.id,
              customer_email: shopifyOrder.email,
              total_amount: parseFloat(shopifyOrder.total_price),
              status: shopifyOrder.financial_status,
              created_at: shopifyOrder.created_at,
              items: (shopifyOrder.line_items || []).map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity
              })),
              merchant_info: {
                shop_domain: merchant.shop_domain,
                merchant_id: merchant.id
              }
            };
          }
        } catch (merchantError) {
          console.warn(`Failed to check merchant ${merchant.shop_domain}:`, merchantError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Shopify lookup failed:', error);
      return null;
    }
  }

  private static async fetchFromShopifyAPI(
    shopDomain: string,
    accessToken: string,
    orderNumber: string,
    email: string
  ): Promise<any | null> {
    try {
      console.log(`🔍 Looking up order via edge function for ${shopDomain}`);
      
      // Use the edge function instead of direct API call to avoid CORS
      const { data, error } = await supabase.functions.invoke('shopify-order-lookup', {
        body: {
          shopDomain: shopDomain,
          orderNumber: orderNumber,
          customerEmail: email,
          accessToken: accessToken
        }
      });

      if (error) {
        console.error(`Edge function error for ${shopDomain}:`, error);
        return null;
      }

      if (data && data.success && data.order) {
        console.log(`✅ Found order via edge function`);
        // Convert the edge function response to the expected format
        return {
          id: data.order.id,
          name: data.order.name,
          email: data.order.email || data.order.customerEmail,
          total_price: data.order.totalPrice,
          financial_status: data.order.financialStatus,
          fulfillment_status: data.order.fulfillmentStatus,
          created_at: data.order.createdAt,
          line_items: data.order.lineItems?.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            product_id: item.productId
          })) || []
        };
      }

      console.log('No order found via edge function');
      return null;
    } catch (error) {
      console.error(`Shopify lookup error for ${shopDomain}:`, error);
      return null;
    }
  }

  private static async syncToDatabase(merchantId: string, shopifyOrder: any): Promise<void> {
    try {
      // The orders table only has: id, shopify_order_id, customer_email, total_amount, status, created_at
      const orderData = {
        shopify_order_id: shopifyOrder.id.toString(),
        customer_email: shopifyOrder.email,
        total_amount: parseFloat(shopifyOrder.total_price),
        status: shopifyOrder.financial_status || 'completed'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData, { 
          onConflict: 'shopify_order_id',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order upsert error:', orderError);
        throw orderError;
      }

      // Sync order items
      if (shopifyOrder.line_items?.length > 0 && order?.id) {
        const items = shopifyOrder.line_items.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id?.toString() || item.id?.toString(),
          product_name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }));

        // Delete existing items first, then insert new ones
        await supabase.from('order_items').delete().eq('order_id', order.id);
        const { error: itemsError } = await supabase.from('order_items').insert(items);
        
        if (itemsError) {
          console.error('Order items insert error:', itemsError);
        }
      }
    } catch (error) {
      console.error('Sync to database failed:', error);
    }
  }

  static async createReturnFromOrder(
    order: EnhancedOrder,
    returnReason: string,
    selectedItems: Array<{
      product_id: string;
      quantity: number;
      reason: string;
    }>
  ): Promise<string | null> {
    try {
      const merchantId = order.merchant_info?.merchant_id;
      if (!merchantId) {
        throw new Error('No merchant information available');
      }

      const totalAmount = selectedItems.reduce((sum, item) => {
        const orderItem = order.items.find(oi => oi.product_id === item.product_id);
        return sum + (orderItem ? orderItem.price * item.quantity : 0);
      }, 0);

      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          merchant_id: merchantId,
          shopify_order_id: order.shopify_order_id,
          customer_email: order.customer_email,
          reason: returnReason,
          total_amount: totalAmount,
          status: 'requested'
        })
        .select('id')
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItems = selectedItems.map(item => {
        const orderItem = order.items.find(oi => oi.product_id === item.product_id);
        return {
          return_id: returnData.id,
          product_id: item.product_id,
          product_name: orderItem?.product_name || 'Unknown Product',
          quantity: item.quantity,
          price: orderItem?.price || 0,
          action: 'refund'
        };
      });

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      return returnData.id;
    } catch (error) {
      console.error('Failed to create return:', error);
      throw error;
    }
  }
}