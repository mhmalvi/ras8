
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2?dts'

// Enhanced CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain, x-shopify-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ShopifyWebhookPayload {
  id: number;
  name?: string;
  email?: string;
  customer?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  line_items?: Array<{
    id: number;
    product_id: number;
    variant_id?: number;
    name: string;
    quantity: number;
    price: string;
  }>;
  total_price?: string;
  order_number?: string;
  created_at?: string;
  updated_at?: string;
  financial_status?: string;
  fulfillment_status?: string;
  domain?: string;
  shop_domain?: string;
}

async function processOrderCreated(payload: ShopifyWebhookPayload, merchantId: string, supabase: any) {
  console.log('🛒 Processing order creation webhook:', payload.id);

  // SECURITY FIX: Add merchant_id to ensure proper tenant isolation
  const orderData = {
    merchant_id: merchantId,  // CRITICAL: Associate order with merchant
    shopify_order_id: payload.id.toString(),
    customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
    total_amount: parseFloat(payload.total_price || '0'),
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Validate merchant_id exists
  if (!merchantId) {
    console.error('❌ Order creation blocked: missing merchant_id');
    throw new Error('Merchant ID required for order creation');
  }

  // Additional validation before inserting
  if (!orderData.merchant_id) {
    console.error('❌ Order creation blocked: orderData missing merchant_id');
    throw new Error('Invalid merchant context');
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .upsert(orderData, { 
      onConflict: 'shopify_order_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Process order items
  if (payload.line_items && Array.isArray(payload.line_items)) {
    const orderItems = payload.line_items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id?.toString() || 'unknown',
      product_name: item.name || 'Unknown Product',
      quantity: item.quantity || 1,
      price: parseFloat(item.price || '0')
    }));

    // Delete existing items and insert new ones
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;
  }

  // Log analytics event
  await supabase
    .from('analytics_events')
    .insert({
      merchant_id: merchantId,
      event_type: 'order_created',
      event_data: {
        shopify_order_id: payload.id,
        order_value: parseFloat(payload.total_price || '0'),
        customer_email: orderData.customer_email,
        item_count: payload.line_items?.length || 0,
        processed_at: new Date().toISOString()
      }
    });

  return { success: true, orderId: order.id };
}

async function processOrderUpdated(payload: ShopifyWebhookPayload, merchantId: string, supabase: any) {
  console.log('📝 Processing order update webhook:', payload.id);

  // SECURITY FIX: Update existing order with merchant scoping
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
      total_amount: parseFloat(payload.total_price || '0'),
      status: payload.financial_status === 'paid' ? 'completed' : 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', payload.id.toString())
    .eq('merchant_id', merchantId)  // SECURITY: Ensure merchant scoping
    .select()
    .single();

  if (orderError) {
    // If order doesn't exist, create it
    if (orderError.code === 'PGRST116') {
      return await processOrderCreated(payload, merchantId, supabase);
    }
    throw orderError;
  }

  // Log analytics event
  await supabase
    .from('analytics_events')
    .insert({
      merchant_id: merchantId,
      event_type: 'order_updated',
      event_data: {
        shopify_order_id: payload.id,
        order_value: parseFloat(payload.total_price || '0'),
        financial_status: payload.financial_status,
        fulfillment_status: payload.fulfillment_status,
        updated_at: new Date().toISOString()
      }
    });

  return { success: true, orderId: order.id };
}

async function processAppUninstalled(payload: any, merchantId: string, supabase: any) {
  console.log('🗑️ Processing app uninstall webhook for merchant:', merchantId);

  // Mark merchant as disconnected
  const { error: merchantError } = await supabase
    .from('merchants')
    .update({ 
      access_token: 'UNINSTALLED',
      updated_at: new Date().toISOString()
    })
    .eq('id', merchantId);

  if (merchantError) throw merchantError;

  // Log analytics event
  await supabase
    .from('analytics_events')
    .insert({
      merchant_id: merchantId,
      event_type: 'app_uninstalled',
      event_data: {
        uninstalled_at: new Date().toISOString(),
        shop_domain: payload.domain || payload.shop_domain || 'unknown'
      }
    });

  return { success: true, merchantId };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    // Rate limiting check
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `webhook_${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 1000; // Increased for production

    const rateLimit = rateLimitStore.get(rateLimitKey);
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= maxRequests) {
        console.warn('Rate limit exceeded for IP:', clientIP);
        return new Response('Rate limit exceeded', { 
          status: 429, 
          headers: corsHeaders 
        });
      }
      rateLimit.count++;
    } else {
      rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
    }

    // Get request details
    const signature = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const timestamp = req.headers.get('x-shopify-timestamp');

    if (!signature || !topic || !shopDomain) {
      console.error('Missing required headers:', { signature: !!signature, topic, shopDomain });
      return new Response('Missing required headers', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const body = await req.text();

    // Verify HMAC signature with replay attack protection
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return new Response('Server configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Validate timestamp to prevent replay attacks (5 minute window)
    if (timestamp) {
      const requestTime = parseInt(timestamp) * 1000;
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (requestTime < fiveMinutesAgo) {
        console.warn('Webhook timestamp too old, possible replay attack');
        return new Response('Request timestamp too old', { 
          status: 400, 
          headers: corsHeaders 
        });
      }
    }

    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    if (signature !== expectedSignature) {
      console.error('HMAC signature verification failed');
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Webhook signature verified successfully for topic:', topic);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook data
    const webhookData = JSON.parse(body);

    // Find merchant by shop domain
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single();

    if (merchantError || !merchant) {
      console.error('Merchant not found for domain:', shopDomain);
      return new Response('Merchant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Log webhook activity
    const activityId = crypto.randomUUID();
    await supabase
      .from('webhook_activity')
      .insert({
        id: activityId,
        merchant_id: merchant.id,
        webhook_type: topic.replace('/', '_'),
        source: 'shopify',
        status: 'processing',
        payload: webhookData,
        processing_time_ms: null
      });

    let result;
    
    // Handle specific webhook topics
    try {
      switch (topic) {
        case 'orders/create':
          result = await processOrderCreated(webhookData, merchant.id, supabase);
          break;
          
        case 'orders/updated':
          result = await processOrderUpdated(webhookData, merchant.id, supabase);
          break;
          
        case 'app/uninstalled':
          result = await processAppUninstalled(webhookData, merchant.id, supabase);
          break;
          
        case 'customers/data_request':
        case 'customers/redact':
        case 'shop/redact':
          // GDPR compliance webhooks
          await supabase
            .from('analytics_events')
            .insert({
              merchant_id: merchant.id,
              event_type: `gdpr_${topic.replace('/', '_')}`,
              event_data: {
                webhook_data: webhookData,
                processed_at: new Date().toISOString(),
                shop_domain: shopDomain
              }
            });
          result = { success: true, message: 'GDPR webhook processed' };
          break;
          
        default:
          console.log('Unhandled webhook topic:', topic);
          result = { success: true, message: 'Webhook received but not processed' };
      }

      // Update webhook activity status
      const processingTime = Date.now() - startTime;
      await supabase
        .from('webhook_activity')
        .update({
          status: 'completed',
          response: result,
          processing_time_ms: processingTime
        })
        .eq('id', activityId);

      console.log(`✅ Webhook ${topic} processed successfully in ${processingTime}ms`);

    } catch (processingError) {
      console.error('Error processing webhook:', processingError);
      
      // Update webhook activity with error
      const processingTime = Date.now() - startTime;
      await supabase
        .from('webhook_activity')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown processing error',
          processing_time_ms: processingTime
        })
        .eq('id', activityId);

      throw processingError;
    }

    return new Response(
      JSON.stringify(result), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
