
import { supabase } from '@/integrations/supabase/client';

interface ShopifyOrder {
  id: number;
  order_number: string;
  email: string;
  total_price: string;
  created_at: string;
  line_items: ShopifyLineItem[];
}

interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  name: string;
  price: string;
  quantity: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  variants: ShopifyVariant[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  inventory_quantity: number;
}

export class ShopifyService {
  private static async getAccessToken(merchantId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('access_token')
        .eq('id', merchantId)
        .single();

      if (error) throw error;
      return data?.access_token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  private static async makeShopifyRequest(
    merchantId: string, 
    shopDomain: string, 
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const accessToken = await this.getAccessToken(merchantId);
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/${endpoint}`, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getOrders(merchantId: string, shopDomain: string, limit = 50): Promise<ShopifyOrder[]> {
    try {
      const data = await this.makeShopifyRequest(
        merchantId, 
        shopDomain, 
        `orders.json?limit=${limit}&status=any`
      );
      return data.orders || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  static async getOrder(
    merchantId: string, 
    shopDomain: string, 
    orderNumber: string, 
    email: string
  ): Promise<ShopifyOrder | null> {
    try {
      const data = await this.makeShopifyRequest(
        merchantId, 
        shopDomain, 
        `orders.json?name=${orderNumber}&email=${email}&limit=1`
      );
      return data.orders?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return null;
    }
  }

  static async getProducts(merchantId: string, shopDomain: string, limit = 50): Promise<ShopifyProduct[]> {
    try {
      const data = await this.makeShopifyRequest(
        merchantId, 
        shopDomain, 
        `products.json?limit=${limit}`
      );
      return data.products || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  static async syncOrdersToDatabase(merchantId: string, shopDomain: string): Promise<void> {
    try {
      const orders = await this.getOrders(merchantId, shopDomain);
      
      for (const order of orders) {
        // Upsert order
        const { error: orderError } = await supabase
          .from('orders')
          .upsert({
            shopify_order_id: order.id.toString(),
            customer_email: order.email,
            total_amount: parseFloat(order.total_price),
            status: 'completed',
            created_at: order.created_at
          }, {
            onConflict: 'shopify_order_id'
          });

        if (orderError) {
          console.error('Failed to sync order:', orderError);
          continue;
        }

        // Get the inserted order ID
        const { data: insertedOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('shopify_order_id', order.id.toString())
          .single();

        if (!insertedOrder) continue;

        // Upsert order items
        for (const item of order.line_items) {
          await supabase
            .from('order_items')
            .upsert({
              order_id: insertedOrder.id,
              product_id: item.product_id.toString(),
              product_name: item.name,
              price: parseFloat(item.price),
              quantity: item.quantity
            }, {
              onConflict: 'order_id,product_id'
            });
        }
      }

      console.log(`✅ Synced ${orders.length} orders for merchant ${merchantId}`);
    } catch (error) {
      console.error('Failed to sync orders:', error);
      throw error;
    }
  }

  static async validateWebhook(data: string, signature: string, secret: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook validation failed:', error);
      return false;
    }
  }

  static async testConnection(merchantId: string, shopDomain: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeShopifyRequest(merchantId, shopDomain, 'shop.json');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
