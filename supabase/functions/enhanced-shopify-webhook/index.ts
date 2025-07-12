
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
}

interface EnhancedWebhookData {
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
    created_at: string;
  };
  metadata: {
    source: string;
    timestamp: string;
    topic: string;
    shop_domain: string;
    webhook_id: string;
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

    console.log(`📨 Enhanced Shopify webhook received: ${topic} from ${shopDomain}`);

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

    // Build comprehensive webhook data based on scope
    const enhancedData: EnhancedWebhookData = {
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
        fulfillment_status: shopifyData.fulfillment_status
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
        webhook_id: `webhook_${Date.now()}`
      }
    };

    // Add return-specific data for return events
    if (topic.includes('returns/') || topic.includes('return')) {
      enhancedData.returnDetails = {
        id: `return_${shopifyData.id}`,
        order_id: shopifyData.id,
        status: getReturnStatus(topic),
        reason: 'Webhook triggered return',
        created_at: new Date().toISOString()
      };
    }

    // Store the enhanced webhook in analytics_events
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'enhanced_shopify_webhook',
        merchant_id: merchant.id,
        event_data: {
          webhook_topic: topic,
          shop_domain: shopDomain,
          enhanced_data: enhancedData,
          original_payload: shopifyData,
          hmac_verified: !!hmac,
          processed_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('❌ Error storing enhanced webhook:', insertError);
    }

    // Get merchant's n8n configuration for forwarding
    const { data: n8nConfig } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'n8n_configuration')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Forward to merchant's n8n if configured
    if (n8nConfig?.event_data?.n8n_url) {
      const n8nUrl = `${n8nConfig.event_data.n8n_url}/webhook/shopify-webhook?merchant=${merchant.id}`;
      
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': merchant.id,
            'X-Webhook-Topic': topic,
            'X-Shop-Domain': shopDomain
          },
          body: JSON.stringify(enhancedData)
        });
        
        console.log(`✅ Enhanced webhook forwarded to merchant's n8n: ${n8nUrl}`);
      } catch (error) {
        console.error('❌ Failed to forward to n8n:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enhanced webhook processed successfully',
        webhook_id: enhancedData.metadata.webhook_id,
        merchant_id: merchant.id,
        data_sent: {
          order_details: true,
          customer_details: true,
          item_details: enhancedData.itemDetails.length > 0,
          return_details: !!enhancedData.returnDetails,
          comprehensive_scope: true
        }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Enhanced webhook processing error:', error);
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
