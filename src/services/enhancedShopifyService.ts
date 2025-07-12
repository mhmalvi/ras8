
import { supabase } from '@/integrations/supabase/client';
import { EnhancedN8nService } from './enhancedN8nService';

interface ShopifyOrder {
  id: number;
  order_number: string;
  email: string;
  total_price: string;
  created_at: string;
  line_items: ShopifyLineItem[];
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  name: string;
  price: string;
  quantity: number;
}

export class EnhancedShopifyService {
  private static async getSecureAccessToken(merchantId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('access_token, shop_domain')
        .eq('id', merchantId)
        .single();

      if (error) {
        console.error('Failed to get merchant data:', error);
        return null;
      }
      
      if (!data?.access_token || data.access_token === 'DISCONNECTED' || data.access_token === 'UNINSTALLED') {
        console.warn('Invalid or disconnected access token for merchant:', merchantId);
        return null;
      }
      
      return data.access_token;
    } catch (error) {
      console.error('Error fetching access token:', error);
      return null;
    }
  }

  private static async makeAuthenticatedRequest(
    merchantId: string, 
    shopDomain: string, 
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const accessToken = await this.getSecureAccessToken(merchantId);
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    const url = `https://${shopDomain}.myshopify.com/admin/api/2023-10/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Shopify API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  static async lookupOrderByDetails(
    merchantId: string, 
    shopDomain: string, 
    orderNumber: string, 
    email: string
  ): Promise<ShopifyOrder | null> {
    try {
      console.log(`🔍 Looking up order ${orderNumber} for ${email} in ${shopDomain}`);
      
      // Try multiple API endpoints to find the order
      const searchQueries = [
        `orders.json?name=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}&limit=1`,
        `orders.json?order_number=${encodeURIComponent(orderNumber.replace('#', ''))}&limit=50`,
        `orders.json?email=${encodeURIComponent(email)}&limit=50`
      ];

      for (const query of searchQueries) {
        try {
          const data = await this.makeAuthenticatedRequest(merchantId, shopDomain, query);
          
          if (data.orders && data.orders.length > 0) {
            // Find exact match
            const exactMatch = data.orders.find((order: ShopifyOrder) => 
              (order.order_number === orderNumber || `#${order.order_number}` === orderNumber) &&
              order.email?.toLowerCase() === email.toLowerCase()
            );
            
            if (exactMatch) {
              console.log(`✅ Found exact order match: ${exactMatch.id}`);
              return exactMatch;
            }
          }
        } catch (searchError) {
          console.warn(`Search query failed: ${query}`, searchError);
          continue;
        }
      }

      console.log(`❌ No order found for ${orderNumber} / ${email}`);
      return null;
    } catch (error) {
      console.error('Order lookup failed:', error);
      return null;
    }
  }

  static async syncOrderToDatabase(merchantId: string, order: ShopifyOrder): Promise<boolean> {
    try {
      // First, upsert the order
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
        return false;
      }

      // Then sync order items
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
          return false;
        }
      }

      // Log successful sync
      await supabase.from('analytics_events').insert({
        merchant_id: merchantId,
        event_type: 'order_synced',
        event_data: {
          shopify_order_id: order.id,
          order_number: order.order_number,
          total_amount: parseFloat(order.total_price)
        }
      });

      console.log(`✅ Successfully synced order ${order.order_number}`);
      return true;
    } catch (error) {
      console.error('Database sync failed:', error);
      return false;
    }
  }

  static async processWebhookEvent(event: string, data: any, shopDomain: string): Promise<boolean> {
    try {
      // Find merchant by shop domain
      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('shop_domain', shopDomain)
        .single();

      if (error || !merchant) {
        console.error('Merchant not found for domain:', shopDomain);
        return false;
      }

      console.log(`📨 Processing Shopify webhook: ${event} for ${shopDomain}`);

      switch (event) {
        case 'orders/create':
        case 'orders/updated':
          await this.syncOrderToDatabase(merchant.id, data);
          break;
          
        case 'app/uninstalled':
          await supabase
            .from('merchants')
            .update({ 
              access_token: 'UNINSTALLED',
              updated_at: new Date().toISOString()
            })
            .eq('id', merchant.id);
          break;
      }

      // Trigger n8n workflow with proper arguments
      await EnhancedN8nService.sendWebhook(merchant.id, 'webhook/shopify-webhook', {
        event: `shopify_${event.replace('/', '_')}`,
        data: {
          shopDomain,
          merchantId: merchant.id,
          webhookData: data
        },
        timestamp: new Date().toISOString(),
        source: 'shopify_webhook'
      });

      return true;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  static async validateConnection(merchantId: string, shopDomain: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const data = await this.makeAuthenticatedRequest(merchantId, shopDomain, 'shop.json');
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}
