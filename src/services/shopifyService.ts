
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
      
      // Check if token is valid (not disconnected/uninstalled)
      if (!data?.access_token || data.access_token === 'DISCONNECTED' || data.access_token === 'UNINSTALLED') {
        return null;
      }
      
      return data.access_token;
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
      throw new Error('No valid access token available for merchant');
    }

    const response = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/${endpoint}`, {
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

  static async syncOrdersToDatabase(merchantId: string, shopDomain: string): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      const orders = await this.getOrders(merchantId, shopDomain);
      console.log(`🔄 Syncing ${orders.length} orders for merchant ${merchantId}`);
      
      for (const order of orders) {
        try {
          // Upsert order with proper merchant context
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .upsert({
              shopify_order_id: order.id.toString(),
              customer_email: order.email,
              total_amount: parseFloat(order.total_price),
              status: 'completed',
              created_at: order.created_at
            }, {
              onConflict: 'shopify_order_id',
              ignoreDuplicates: false
            })
            .select('id')
            .single();

          if (orderError) {
            console.error('Failed to sync order:', orderError);
            errors.push(`Order ${order.id}: ${orderError.message}`);
            continue;
          }

          // Sync order items
          if (orderData?.id && order.line_items?.length > 0) {
            const orderItems = order.line_items.map(item => ({
              order_id: orderData.id,
              product_id: item.product_id.toString(),
              product_name: item.name,
              price: parseFloat(item.price),
              quantity: item.quantity
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .upsert(orderItems, {
                onConflict: 'order_id,product_id',
                ignoreDuplicates: false
              });

            if (itemsError) {
              console.error('Failed to sync order items:', itemsError);
              errors.push(`Order ${order.id} items: ${itemsError.message}`);
              continue;
            }
          }

          syncedCount++;
        } catch (itemError) {
          console.error('Error processing order:', itemError);
          errors.push(`Order ${order.id}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
        }
      }

      // Log sync event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'orders_sync_completed', 
          event_data: {
            synced_count: syncedCount,
            total_orders: orders.length,
            errors_count: errors.length,
            timestamp: new Date().toISOString()
          }
        });

      console.log(`✅ Synced ${syncedCount}/${orders.length} orders for merchant ${merchantId}`);
      return { success: errors.length === 0, synced: syncedCount, errors };

    } catch (error) {
      console.error('Failed to sync orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      return { success: false, synced: syncedCount, errors: [...errors, errorMessage] };
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

  static async createMerchantFromShopify(shopDomain: string, accessToken: string, planType: string = 'starter'): Promise<{ merchantId: string; error?: string }> {
    try {
      // Create merchant record
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          shop_domain: shopDomain,
          access_token: accessToken,
          plan_type: planType,
          settings: {},
          token_encrypted_at: new Date().toISOString(),
          token_encryption_version: 2
        })
        .select('id')
        .single();

      if (merchantError) throw merchantError;

      // Get current user and create/update profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            merchant_id: merchantData.id,
            role: 'admin'
          }, {
            onConflict: 'id'
          });
      }

      // Log merchant creation
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantData.id,
          event_type: 'merchant_created',
          event_data: {
            shop_domain: shopDomain,
            plan_type: planType,
            created_at: new Date().toISOString()
          }
        });

      return { merchantId: merchantData.id };
    } catch (error) {
      console.error('Error creating merchant:', error);
      return { 
        merchantId: '', 
        error: error instanceof Error ? error.message : 'Failed to create merchant' 
      };
    }
  }
}
