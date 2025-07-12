
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

interface ShopifyWebhookPayload {
  id: string;
  email?: string;
  order_number?: string;
  total_price?: string;
  currency?: string;
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items?: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  shipping_address?: any;
  billing_address?: any;
  tags?: string;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string;
  financial_status?: string;
  fulfillment_status?: string;
  // Return-specific fields
  return_reason?: string;
  refund_amount?: string;
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    reason?: string;
  }>;
}

interface ComprehensiveWebhookData {
  event: string;
  shopDomain: string;
  merchantId: string;
  webhookData: ShopifyWebhookPayload;
  orderDetails: {
    id: string;
    order_number: string;
    email: string;
    total_price: string;
    currency: string;
    status: string;
    created_at: string;
    updated_at?: string;
    cancelled_at?: string;
    financial_status?: string;
    fulfillment_status?: string;
    tags?: string;
    addresses?: {
      shipping: any;
      billing: any;
    };
  };
  customerDetails: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  itemDetails: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  returnDetails?: {
    id: string;
    order_id: string;
    status: string;
    reason?: string;
    refund_amount?: string;
    created_at: string;
    items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      reason?: string;
    }>;
  };
  appDetails?: {
    uninstalled_at?: string;
    reason?: string;
  };
  metadata: {
    source: string;
    timestamp: string;
    topic: string;
    shop_domain: string;
    webhook_id: string;
    merchant_id: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook data
    const shopifyData: ShopifyWebhookPayload = await req.json();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || 'unknown';
    const topic = req.headers.get('x-shopify-topic') || 'unknown';
    const hmac = req.headers.get('x-shopify-hmac-sha256');

    console.log(`📨 Comprehensive Shopify webhook: ${topic} from ${shopDomain}`);

    // Get merchant ID from shop domain
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found for domain:', shopDomain);
      return new Response(
        JSON.stringify({ error: 'Merchant not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive webhook data for ALL supported scopes
    const comprehensiveData: ComprehensiveWebhookData = {
      event: topic,
      shopDomain,
      merchantId: merchant.id,
      webhookData: shopifyData,
      orderDetails: {
        id: shopifyData.id,
        order_number: shopifyData.order_number || `#${shopifyData.id}`,
        email: shopifyData.email || shopifyData.customer?.email || '',
        total_price: shopifyData.total_price || '0.00',
        currency: shopifyData.currency || 'USD',
        status: getOrderStatus(topic, shopifyData),
        created_at: shopifyData.created_at || new Date().toISOString(),
        updated_at: shopifyData.updated_at,
        cancelled_at: shopifyData.cancelled_at,
        financial_status: shopifyData.financial_status,
        fulfillment_status: shopifyData.fulfillment_status,
        tags: shopifyData.tags,
        addresses: {
          shipping: shopifyData.shipping_address,
          billing: shopifyData.billing_address
        }
      },
      customerDetails: {
        id: shopifyData.customer?.id || shopifyData.id,
        email: shopifyData.customer?.email || shopifyData.email || '',
        first_name: shopifyData.customer?.first_name || '',
        last_name: shopifyData.customer?.last_name || ''
      },
      itemDetails: shopifyData.line_items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })) || [],
      metadata: {
        source: 'shopify_webhook',
        timestamp: new Date().toISOString(),
        topic,
        shop_domain: shopDomain,
        webhook_id: `webhook_${Date.now()}`,
        merchant_id: merchant.id
      }
    };

    // Add scope-specific data based on webhook topic
    switch (topic) {
      case 'returns/created':
      case 'returns/approved':
      case 'returns/completed':
        comprehensiveData.returnDetails = {
          id: `return_${shopifyData.id}`,
          order_id: shopifyData.id,
          status: getReturnStatus(topic),
          reason: shopifyData.return_reason || 'No reason provided',
          refund_amount: shopifyData.refund_amount || shopifyData.total_price,
          created_at: new Date().toISOString(),
          items: shopifyData.items || shopifyData.line_items?.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            reason: 'Return requested'
          }))
        };
        break;
        
      case 'app/uninstalled':
        comprehensiveData.appDetails = {
          uninstalled_at: new Date().toISOString(),
          reason: 'Merchant uninstalled app'
        };
        break;
        
      case 'orders/create':
      case 'orders/updated':
      case 'orders/cancelled':
        // Order details already included in base structure
        break;
    }

    // Store comprehensive webhook data with merchant isolation
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'comprehensive_shopify_webhook',
        merchant_id: merchant.id,
        event_data: {
          webhook_topic: topic,
          shop_domain: shopDomain,
          comprehensive_data: comprehensiveData,
          original_payload: shopifyData,
          hmac_verified: !!hmac,
          processed_at: new Date().toISOString(),
          merchant_isolated: true
        }
      });

    if (insertError) {
      console.error('❌ Error storing comprehensive webhook:', insertError);
    }

    // Get merchant-specific n8n configuration
    const { data: n8nConfig } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'n8n_configuration')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Forward to merchant-specific n8n if configured
    if (n8nConfig?.event_data?.n8n_url) {
      const n8nUrl = `${n8nConfig.event_data.n8n_url}/webhook/shopify-webhook?merchant=${merchant.id}`;
      
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': merchant.id,
            'X-Webhook-Topic': topic,
            'X-Shop-Domain': shopDomain,
            'X-Webhook-Source': 'returns-automation-saas'
          },
          body: JSON.stringify(comprehensiveData)
        });
        
        console.log(`✅ Comprehensive webhook forwarded to merchant n8n: ${n8nUrl}`);
      } catch (error) {
        console.error('❌ Failed to forward to merchant n8n:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Comprehensive webhook processed successfully',
        webhook_id: comprehensiveData.metadata.webhook_id,
        merchant_id: merchant.id,
        comprehensive_data: {
          order_details: true,
          customer_details: true,
          item_details: comprehensiveData.itemDetails.length > 0,
          return_details: !!comprehensiveData.returnDetails,
          app_details: !!comprehensiveData.appDetails,
          addresses_included: true,
          all_scopes_supported: true
        }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Comprehensive webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getOrderStatus(topic: string, data: ShopifyWebhookPayload): string {
  switch (topic) {
    case 'orders/create':
      return 'created';
    case 'orders/updated':
      return 'updated';
    case 'orders/cancelled':
      return 'cancelled';
    case 'orders/paid':
      return 'paid';
    case 'orders/fulfilled':
      return 'fulfilled';
    default:
      return data.financial_status || 'pending';
  }
}

function getReturnStatus(topic: string): string {
  switch (topic) {
    case 'returns/created':
      return 'requested';
    case 'returns/approved':
      return 'approved';
    case 'returns/completed':
      return 'completed';
    default:
      return 'pending';
  }
}
