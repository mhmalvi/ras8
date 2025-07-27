
import { supabase } from '@/integrations/supabase/client';
import { EnhancedN8nService } from './enhancedN8nService';

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
      console.log(`🔍 Enhanced order lookup: ${orderNumber} / ${email}`);

      // First, try database lookup
      const dbOrder = await this.lookupFromDatabase(orderNumber, email);
      if (dbOrder) {
        console.log('✅ Found order in database');
        return dbOrder;
      }

      // If not in database, try Shopify API for all merchants
      const shopifyOrder = await this.lookupFromShopify(orderNumber, email);
      if (shopifyOrder) {
        console.log('✅ Found order via Shopify API');
        return shopifyOrder;
      }

      console.log('❌ Order not found in database or Shopify');
      return null;
    } catch (error) {
      console.error('Enhanced order lookup failed:', error);
      throw error;
    }
  }

  private static async lookupFromDatabase(
    orderNumber: string, 
    email: string
  ): Promise<EnhancedOrder | null> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .or(`shopify_order_id.eq.${orderNumber.replace('#', '')},shopify_order_id.eq.${orderNumber}`)
        .eq('customer_email', email.toLowerCase())
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0) {
        const order = orders[0];
        return {
          id: order.id,
          shopify_order_id: order.shopify_order_id,
          customer_email: order.customer_email,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
          items: order.order_items || []
        };
      }

      return null;
    } catch (error) {
      console.error('Database order lookup failed:', error);
      return null;
    }
  }

  private static async lookupFromShopify(
    orderNumber: string, 
    email: string
  ): Promise<EnhancedOrder | null> {
    try {
      // Get all active merchants with access tokens
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('id, shop_domain, access_token')
        .not('access_token', 'in', '("DISCONNECTED","UNINSTALLED")')
        .not('access_token', 'is', null);

      if (error || !merchants) {
        console.warn('No active merchants found');
        return null;
      }

      // Try each merchant until we find the order
      for (const merchant of merchants) {
        try {
          const shopifyOrder = await this.lookupOrderFromShopifyAPI(
            merchant.shop_domain,
            merchant.access_token,
            orderNumber,
            email
          );

          if (shopifyOrder) {
            // Sync to database for future lookups
            await this.syncOrderToDatabase(merchant.id, shopifyOrder);

            // Return standardized format
            return {
              id: `shopify_${shopifyOrder.id}`,
              shopify_order_id: shopifyOrder.id.toString(),
              customer_email: shopifyOrder.email,
              total_amount: parseFloat(shopifyOrder.total_price),
              status: 'completed',
              created_at: shopifyOrder.created_at,
              items: shopifyOrder.line_items.map(item => ({
                id: item.id.toString(),
                product_id: item.product_id.toString(),
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
      console.error('Shopify order lookup failed:', error);
      return null;
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
        throw new Error('No merchant information available for return creation');
      }

      // Calculate total return amount
      const totalAmount = selectedItems.reduce((sum, item) => {
        const orderItem = order.items.find(oi => oi.product_id === item.product_id);
        return sum + (orderItem ? orderItem.price * item.quantity : 0);
      }, 0);

      // Create return record
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
          reason: item.reason
        };
      });

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) throw itemsError;

      // Trigger n8n workflow for return processing
      await EnhancedN8nService.processReturnCreated({
        returnId: returnData.id,
        merchantId: merchantId,
        customerEmail: order.customer_email,
        status: 'requested',
        items: returnItems.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          action: 'refund' // Default to refund, can be changed later
        }))
      });

      console.log(`✅ Created return ${returnData.id} with ${returnItems.length} items`);
      return returnData.id;
    } catch (error) {
      console.error('Failed to create return from order:', error);
      throw error;
    }
  }

  private static async lookupOrderFromShopifyAPI(
    shopDomain: string,
    accessToken: string,
    orderNumber: string,
    email: string
  ): Promise<any | null> {
    try {
      // Try looking up by order number first
      const orderResponse = await fetch(
        `https://${shopDomain}/admin/api/2024-07/orders.json?name=${encodeURIComponent(orderNumber)}&status=any`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const orders = orderData.orders || [];
        
        // Find order with matching email
        const matchingOrder = orders.find((order: any) => 
          order.email?.toLowerCase() === email.toLowerCase()
        );

        if (matchingOrder) {
          return matchingOrder;
        }
      }

      // If not found by name, try searching by email with order number in the name
      const emailResponse = await fetch(
        `https://${shopDomain}/admin/api/2024-07/orders.json?email=${encodeURIComponent(email)}&status=any&limit=50`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        const orders = emailData.orders || [];
        
        // Find order with matching order number
        const cleanOrderNumber = orderNumber.replace('#', '');
        const matchingOrder = orders.find((order: any) => 
          order.name?.includes(cleanOrderNumber) || 
          order.order_number?.toString() === cleanOrderNumber ||
          order.id?.toString() === cleanOrderNumber
        );

        if (matchingOrder) {
          return matchingOrder;
        }
      }

      return null;
    } catch (error) {
      console.error(`Shopify API lookup failed for ${shopDomain}:`, error);
      return null;
    }
  }

  private static async syncOrderToDatabase(
    merchantId: string,
    shopifyOrder: any
  ): Promise<void> {
    try {
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('shopify_order_id', shopifyOrder.id)
        .single();

      if (existingOrder) {
        return; // Order already synced
      }

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          merchant_id: merchantId,
          shopify_order_id: shopifyOrder.id,
          customer_email: shopifyOrder.email,
          total_amount: parseFloat(shopifyOrder.total_price),
          status: shopifyOrder.financial_status,
          order_number: shopifyOrder.name,
          financial_status: shopifyOrder.financial_status,
          fulfillment_status: shopifyOrder.fulfillment_status,
          tags: shopifyOrder.tags,
          note: shopifyOrder.note,
          processed_at: shopifyOrder.processed_at,
          cancelled_at: shopifyOrder.cancelled_at
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
        const orderItems = shopifyOrder.line_items.map((item: any) => ({
          order_id: orderData.id,
          shopify_product_id: item.product_id,
          shopify_variant_id: item.variant_id,
          product_name: item.name,
          variant_title: item.variant_title,
          quantity: item.quantity,
          price: parseFloat(item.price),
          sku: item.sku,
          vendor: item.vendor,
          product_type: item.product_type
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      console.log(`✅ Synced order ${shopifyOrder.name} to database`);
    } catch (error) {
      console.error('Failed to sync order to database:', error);
      // Don't throw error as this is a background sync operation
    }
  }
}
