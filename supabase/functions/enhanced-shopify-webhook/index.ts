
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

interface ComprehensiveWebhookPayload {
  event: string;
  version: string;
  timestamp: string;
  source: string;
  merchantId: string;
  tenantIsolated: boolean;
  
  orderDetails?: any;
  customerDetails?: any;
  itemDetails?: any[];
  returnDetails?: any;
  appDetails?: any;
  
  metadata: {
    webhook_id: string;
    source_topic: string;
    merchant_id: string;
    tenant_isolated: true;
    comprehensive: true;
    scopes_covered: string[];
    payload_version: string;
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

    const shopifyData = await req.json();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || 'unknown';
    const topic = req.headers.get('x-shopify-topic') || 'unknown';

    console.log(`📨 Comprehensive webhook: ${topic} from ${shopDomain}`);

    // Get merchant with tenant isolation
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

    // Build comprehensive payload with full scope coverage
    const comprehensivePayload: ComprehensiveWebhookPayload = {
      event: topic,
      version: '2.0',
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas',
      merchantId: merchant.id,
      tenantIsolated: true,
      metadata: {
        webhook_id: `webhook_${Date.now()}_${merchant.id}`,
        source_topic: topic,
        merchant_id: merchant.id,
        tenant_isolated: true,
        comprehensive: true,
        scopes_covered: [],
        payload_version: '2.0'
      }
    };

    // Comprehensive data based on ALL supported scopes
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
      case 'orders/cancelled':
        comprehensivePayload.orderDetails = {
          id: shopifyData.id,
          order_number: shopifyData.order_number || `#${shopifyData.id}`,
          email: shopifyData.email || shopifyData.customer?.email || '',
          total_price: shopifyData.total_price || '0.00',
          currency: shopifyData.currency || 'USD',
          status: getOrderStatus(topic, shopifyData),
          financial_status: shopifyData.financial_status,
          fulfillment_status: shopifyData.fulfillment_status,
          created_at: shopifyData.created_at || new Date().toISOString(),
          updated_at: shopifyData.updated_at,
          cancelled_at: shopifyData.cancelled_at,
          tags: shopifyData.tags,
          addresses: {
            shipping: shopifyData.shipping_address,
            billing: shopifyData.billing_address
          }
        };
        
        comprehensivePayload.customerDetails = {
          id: shopifyData.customer?.id || shopifyData.id,
          email: shopifyData.customer?.email || shopifyData.email || '',
          first_name: shopifyData.customer?.first_name || '',
          last_name: shopifyData.customer?.last_name || '',
          phone: shopifyData.customer?.phone,
          accepts_marketing: shopifyData.customer?.accepts_marketing
        };
        
        comprehensivePayload.itemDetails = shopifyData.line_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          fulfillable_quantity: item.fulfillable_quantity,
          fulfillment_status: item.fulfillment_status
        })) || [];
        
        comprehensivePayload.metadata.scopes_covered = ['orders', 'customers', 'line_items', 'addresses'];
        break;

      case 'returns/created':
      case 'returns/approved':
      case 'returns/completed':
        comprehensivePayload.returnDetails = {
          id: `return_${shopifyData.id}`,
          order_id: shopifyData.id,
          status: getReturnStatus(topic),
          reason: shopifyData.return_reason || 'No reason provided',
          refund_amount: shopifyData.refund_amount || shopifyData.total_price,
          created_at: new Date().toISOString(),
          approved_at: topic === 'returns/approved' ? new Date().toISOString() : undefined,
          completed_at: topic === 'returns/completed' ? new Date().toISOString() : undefined,
          items: shopifyData.line_items?.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            reason: 'Return requested'
          })) || []
        };
        
        // Include order context
        comprehensivePayload.orderDetails = {
          id: shopifyData.id,
          order_number: shopifyData.order_number || `#${shopifyData.id}`,
          email: shopifyData.email || '',
          total_price: shopifyData.total_price || '0.00',
          currency: shopifyData.currency || 'USD',
          status: 'completed'
        };
        
        comprehensivePayload.metadata.scopes_covered = ['returns', 'orders', 'customers', 'refunds'];
        break;

      case 'app/uninstalled':
        comprehensivePayload.appDetails = {
          uninstalled_at: new Date().toISOString(),
          reason: 'Merchant uninstalled app',
          shop_domain: shopDomain
        };
        
        comprehensivePayload.metadata.scopes_covered = ['app', 'merchant'];
        break;

      default:
        comprehensivePayload.metadata.scopes_covered = ['unknown'];
    }

    // Store with merchant isolation
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'comprehensive_shopify_webhook',
        merchant_id: merchant.id,
        event_data: {
          webhook_topic: topic,
          shop_domain: shopDomain,
          comprehensive_payload: comprehensivePayload,
          original_payload: shopifyData,
          tenant_isolated: true,
          processed_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('❌ Error storing webhook:', insertError);
    }

    // Forward to merchant-specific n8n
    const { data: n8nConfig } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'n8n_configuration')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (n8nConfig?.event_data?.n8n_url) {
      const n8nUrl = `${n8nConfig.event_data.n8n_url}/webhook/shopify-webhook?merchant=${merchant.id}&tenant=${merchant.id}`;
      
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': merchant.id,
            'X-Tenant-ID': merchant.id,
            'X-Webhook-Topic': topic,
            'X-Webhook-Version': '2.0'
          },
          body: JSON.stringify(comprehensivePayload)
        });
        
        console.log(`✅ Comprehensive webhook forwarded to merchant n8n`);
      } catch (error) {
        console.error('❌ Failed to forward to merchant n8n:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Comprehensive webhook processed',
        webhook_id: comprehensivePayload.metadata.webhook_id,
        merchant_id: merchant.id,
        tenant_isolated: true,
        scopes_covered: comprehensivePayload.metadata.scopes_covered
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getOrderStatus(topic: string, data: any): string {
  switch (topic) {
    case 'orders/create': return 'created';
    case 'orders/updated': return 'updated';
    case 'orders/cancelled': return 'cancelled';
    default: return data.financial_status || 'pending';
  }
}

function getReturnStatus(topic: string): string {
  switch (topic) {
    case 'returns/created': return 'requested';
    case 'returns/approved': return 'approved';
    case 'returns/completed': return 'completed';
    default: return 'pending';
  }
}
