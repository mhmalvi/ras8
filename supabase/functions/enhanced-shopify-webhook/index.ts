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
    console.log('🔄 Processing Shopify webhook request');
    
    // Rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `webhook_${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 1000;

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

    // Enhanced webhook processing with complete data payload
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

        case 'orders/cancelled':
          console.log('❌ Processing order cancellation');
          await processOrderCancellation(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'returns/created':
          console.log('↩️ Processing return creation');
          await processReturnCreated(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;

        case 'returns/approved':
          console.log('✅ Processing return approval');
          await processReturnApproved(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;

        case 'returns/completed':
          console.log('🏁 Processing return completion');
          await processReturnCompleted(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'app/uninstalled':
          console.log('🗑️ Processing app uninstall');
          await processAppUninstall(supabase, merchant.id, shopDomain);
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
          body_size: body.length,
          complete_payload: webhookData // Store complete webhook payload
        }
      });

    // Send complete webhook data to n8n with enhanced payload
    try {
      const n8nUrl = await getN8nConfiguration(supabase);
      if (n8nUrl) {
        const enhancedPayload = {
          event: `shopify_${topic.replace('/', '_')}`,
          data: {
            shopDomain,
            merchantId: merchant.id,
            webhookData,
            processedSuccessfully,
            // Enhanced data structure for n8n workflows
            orderDetails: extractOrderDetails(webhookData, topic),
            returnDetails: extractReturnDetails(webhookData, topic),
            customerDetails: extractCustomerDetails(webhookData),
            itemDetails: extractItemDetails(webhookData),
            metadata: {
              source: 'enhanced_shopify_webhook',
              timestamp: new Date().toISOString(),
              topic,
              webhook_id: webhookData.id
            }
          },
          timestamp: new Date().toISOString(),
          source: 'enhanced_shopify_webhook'
        };

        await triggerN8nWorkflow(n8nUrl, enhancedPayload);
      }
    } catch (n8nError) {
      console.warn('⚠️ Failed to trigger n8n workflow:', n8nError);
    }

    return new Response(
      JSON.stringify({ 
        success: processedSuccessfully,
        processed: true,
        topic,
        merchant_id: merchant.id,
        error: processingError?.message,
        data_sent_to_n8n: true
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

// Enhanced data extraction functions
function extractOrderDetails(webhookData: any, topic: string) {
  if (!topic.startsWith('orders/')) return null;
  
  return {
    id: webhookData.id,
    order_number: webhookData.order_number,
    email: webhookData.email,
    total_price: webhookData.total_price,
    subtotal_price: webhookData.subtotal_price,
    total_tax: webhookData.total_tax,
    currency: webhookData.currency,
    financial_status: webhookData.financial_status,
    fulfillment_status: webhookData.fulfillment_status,
    created_at: webhookData.created_at,
    updated_at: webhookData.updated_at,
    tags: webhookData.tags,
    note: webhookData.note,
    shipping_address: webhookData.shipping_address,
    billing_address: webhookData.billing_address
  };
}

function extractReturnDetails(webhookData: any, topic: string) {
  if (!topic.startsWith('returns/')) return null;
  
  return {
    id: webhookData.id,
    order_id: webhookData.order_id,
    status: webhookData.status,
    reason: webhookData.reason,
    note: webhookData.note,
    created_at: webhookData.created_at,
    updated_at: webhookData.updated_at,
    return_line_items: webhookData.return_line_items
  };
}

function extractCustomerDetails(webhookData: any) {
  const customer = webhookData.customer;
  if (!customer) return null;
  
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    orders_count: customer.orders_count,
    total_spent: customer.total_spent,
    tags: customer.tags
  };
}

function extractItemDetails(webhookData: any) {
  const lineItems = webhookData.line_items || webhookData.return_line_items;
  if (!lineItems || !Array.isArray(lineItems)) return [];
  
  return lineItems.map(item => ({
    id: item.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    name: item.name,
    title: item.title,
    quantity: item.quantity,
    price: item.price,
    total_discount: item.total_discount,
    sku: item.sku,
    vendor: item.vendor,
    product_type: item.product_type,
    variant_title: item.variant_title
  }));
}

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

async function processOrderCancellation(supabase: any, merchantId: string, orderData: any) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) throw error;
  console.log(`✅ Order ${orderData.id} cancelled successfully`);
}

async function processReturnCreated(supabase: any, merchantId: string, returnData: any) {
  const { error } = await supabase
    .from('returns')
    .upsert({
      shopify_order_id: returnData.order_id?.toString() || 'unknown',
      merchant_id: merchantId,
      customer_email: returnData.customer?.email || 'unknown',
      status: 'requested',
      reason: returnData.reason || 'Return requested',
      total_amount: parseFloat(returnData.total_amount || '0'),
      created_at: returnData.created_at
    }, {
      onConflict: 'shopify_order_id'
    });

  if (error) throw error;
  console.log(`✅ Return created for order ${returnData.order_id}`);
}

async function processReturnApproved(supabase: any, merchantId: string, returnData: any) {
  const { error } = await supabase
    .from('returns')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', returnData.order_id?.toString());

  if (error) throw error;
  console.log(`✅ Return approved for order ${returnData.order_id}`);
}

async function processReturnCompleted(supabase: any, merchantId: string, returnData: any) {
  const { error } = await supabase
    .from('returns')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', returnData.order_id?.toString());

  if (error) throw error;
  console.log(`✅ Return completed for order ${returnData.order_id}`);
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

  console.log('✅ n8n workflow triggered successfully with enhanced payload');
}
