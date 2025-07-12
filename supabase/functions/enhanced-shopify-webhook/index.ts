
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2?dts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Enhanced logging
    console.log('🔄 Processing Shopify webhook request');
    
    // Rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `webhook_${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 1000; // Increased limit

    const rateLimit = rateLimitStore.get(rateLimitKey);
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= maxRequests) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
        return new Response('Rate limit exceeded', { 
          status: 429, 
          headers: corsHeaders 
        });
      }
      rateLimit.count++;
    } else {
      rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
    }

    // Get headers and validate
    const signature = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const timestamp = req.headers.get('x-shopify-timestamp');

    if (!signature || !topic || !shopDomain) {
      console.error('❌ Missing required headers:', { signature: !!signature, topic, shopDomain });
      return new Response('Missing required headers', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    
    // Enhanced HMAC validation
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('💥 SHOPIFY_WEBHOOK_SECRET not configured');
      return new Response('Server configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Validate timestamp (prevent replay attacks)
    if (timestamp) {
      const requestTime = parseInt(timestamp) * 1000;
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (requestTime < fiveMinutesAgo) {
        console.warn('⚠️ Webhook timestamp too old, possible replay attack');
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
      console.error('💥 HMAC signature verification failed');
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Webhook signature verified successfully');

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook data
    const webhookData = JSON.parse(body);
    
    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain')
      .eq('shop_domain', shopDomain.replace('.myshopify.com', ''))
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found for domain:', shopDomain);
      return new Response('Merchant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log(`✅ Processing webhook for merchant: ${merchant.id}`);

    // Enhanced webhook processing
    let processedSuccessfully = false;
    let processingError = null;

    try {
      switch (topic) {
        case 'orders/create':
          console.log('📦 Processing order creation');
          await processOrderCreation(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'orders/updated':
          console.log('📝 Processing order update');
          await processOrderUpdate(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'orders/paid':
          console.log('💰 Processing order payment');
          await processOrderPayment(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'app/uninstalled':
          console.log('🗑️ Processing app uninstall');
          await processAppUninstall(supabase, merchant.id, shopDomain);
          processedSuccessfully = true;
          break;
          
        case 'customers/create':
        case 'customers/update':
          console.log('👤 Processing customer data');
          await processCustomerData(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        default:
          console.log(`ℹ️ Unhandled webhook topic: ${topic}`);
          processedSuccessfully = true; // Don't fail for unknown topics
      }
    } catch (processingErr) {
      processingError = processingErr;
      console.error(`💥 Webhook processing failed for ${topic}:`, processingErr);
    }

    // Comprehensive logging
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: `webhook_${topic.replace('/', '_')}`,
        event_data: {
          shop_domain: shopDomain,
          topic,
          webhook_id: webhookData.id || 'unknown',
          processed_successfully: processedSuccessfully,
          processing_error: processingError?.message,
          timestamp: new Date().toISOString(),
          request_ip: clientIP,
          body_size: body.length
        }
      });

    // Trigger n8n workflow if configured
    try {
      const n8nUrl = await getN8nConfiguration(supabase);
      if (n8nUrl) {
        await triggerN8nWorkflow(n8nUrl, {
          event: `shopify_${topic.replace('/', '_')}`,
          data: {
            shopDomain,
            merchantId: merchant.id,
            webhookData,
            processedSuccessfully
          },
          timestamp: new Date().toISOString(),
          source: 'enhanced_shopify_webhook'
        });
      }
    } catch (n8nError) {
      console.warn('⚠️ Failed to trigger n8n workflow:', n8nError);
      // Don't fail the webhook for n8n errors
    }

    return new Response(
      JSON.stringify({ 
        success: processedSuccessfully,
        processed: true,
        topic,
        merchant_id: merchant.id,
        error: processingError?.message 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: processedSuccessfully ? 200 : 500
      }
    );

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions
async function processOrderCreation(supabase: any, merchantId: string, orderData: any) {
  // Sync order to database
  const { error: orderError } = await supabase
    .from('orders')
    .upsert({
      shopify_order_id: orderData.id.toString(),
      customer_email: orderData.email,
      total_amount: parseFloat(orderData.total_price || '0'),
      status: 'completed',
      created_at: orderData.created_at
    }, {
      onConflict: 'shopify_order_id'
    });

  if (orderError) throw orderError;

  // Sync line items
  if (orderData.line_items?.length > 0) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('shopify_order_id', orderData.id.toString())
      .single();

    if (order) {
      const orderItems = orderData.line_items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id?.toString() || 'unknown',
        product_name: item.name || 'Unknown Product',
        price: parseFloat(item.price || '0'),
        quantity: item.quantity || 1
      }));

      await supabase
        .from('order_items')
        .upsert(orderItems, { onConflict: 'order_id,product_id' });
    }
  }

  console.log(`✅ Order ${orderData.id} synced successfully`);
}

async function processOrderUpdate(supabase: any, merchantId: string, orderData: any) {
  const { error } = await supabase
    .from('orders')
    .update({
      total_amount: parseFloat(orderData.total_price || '0'),
      status: orderData.financial_status === 'paid' ? 'completed' : 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) throw error;
  console.log(`✅ Order ${orderData.id} updated successfully`);
}

async function processOrderPayment(supabase: any, merchantId: string, orderData: any) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) throw error;
  console.log(`✅ Order payment ${orderData.id} processed successfully`);
}

async function processAppUninstall(supabase: any, merchantId: string, shopDomain: string) {
  const { error } = await supabase
    .from('merchants')
    .update({ 
      access_token: 'UNINSTALLED',
      updated_at: new Date().toISOString()
    })
    .eq('id', merchantId);

  if (error) throw error;
  console.log(`✅ App uninstalled for merchant: ${merchantId}`);
}

async function processCustomerData(supabase: any, merchantId: string, customerData: any) {
  // Store customer data for future use
  await supabase
    .from('analytics_events')
    .insert({
      merchant_id: merchantId,
      event_type: 'customer_data_received',
      event_data: {
        customer_id: customerData.id,
        email: customerData.email,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        orders_count: customerData.orders_count
      }
    });

  console.log(`✅ Customer data processed: ${customerData.email}`);
}

async function getN8nConfiguration(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'n8n_configuration')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.event_data?.n8n_url) return null;
    return data.event_data.n8n_url;
  } catch (error) {
    return null;
  }
}

async function triggerN8nWorkflow(n8nUrl: string, payload: any) {
  const response = await fetch(`${n8nUrl}/webhook/shopify-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed: ${response.status}`);
  }

  console.log('✅ n8n workflow triggered successfully');
}
