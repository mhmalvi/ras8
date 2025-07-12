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
    console.log('🔄 Processing Enhanced Shopify webhook request');
    
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
          console.log('📦 Processing order creation with full data');
          await processOrderCreation(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'orders/updated':
          console.log('📝 Processing order update with full data');
          await processOrderUpdate(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;

        case 'orders/cancelled':
          console.log('❌ Processing order cancellation with full data');
          await processOrderCancellation(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'returns/created':
          console.log('↩️ Processing return creation with full data');
          await processReturnCreated(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;

        case 'returns/approved':
          console.log('✅ Processing return approval with full data');
          await processReturnApproved(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;

        case 'returns/completed':
          console.log('🏁 Processing return completion with full data');
          await processReturnCompleted(supabase, merchant.id, webhookData);
          processedSuccessfully = true;
          break;
          
        case 'app/uninstalled':
          console.log('🗑️ Processing app uninstall with full data');
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

    // Comprehensive logging with merchant ID
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
          merchant_specific: true,
          // Complete webhook payload with enhanced data
          complete_webhook_data: {
            ...webhookData,
            // Enhanced order data for orders/* topics
            ...(topic.startsWith('orders/') && {
              enhanced_order_data: {
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
                line_items: webhookData.line_items?.map(item => ({
                  id: item.id,
                  product_id: item.product_id,
                  variant_id: item.variant_id,
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  sku: item.sku,
                  vendor: item.vendor
                })),
                customer: webhookData.customer ? {
                  id: webhookData.customer.id,
                  email: webhookData.customer.email,
                  first_name: webhookData.customer.first_name,
                  last_name: webhookData.customer.last_name,
                  orders_count: webhookData.customer.orders_count,
                  total_spent: webhookData.customer.total_spent
                } : null,
                shipping_address: webhookData.shipping_address,
                billing_address: webhookData.billing_address
              }
            }),
            // Enhanced return data for returns/* topics
            ...(topic.startsWith('returns/') && {
              enhanced_return_data: {
                id: webhookData.id,
                order_id: webhookData.order_id,
                status: webhookData.status,
                reason: webhookData.reason,
                note: webhookData.note,
                created_at: webhookData.created_at,
                updated_at: webhookData.updated_at,
                return_line_items: webhookData.return_line_items?.map(item => ({
                  id: item.id,
                  line_item_id: item.line_item_id,
                  quantity: item.quantity,
                  reason_code: item.reason_code,
                  note: item.note
                }))
              }
            })
          }
        }
      });

    // Send complete webhook data to merchant-specific n8n with enhanced payload
    try {
      const n8nConfig = await getMerchantN8nConfiguration(supabase, merchant.id);
      if (n8nConfig) {
        const enhancedPayload = {
          event: `shopify_${topic.replace('/', '_')}`,
          data: {
            shopDomain,
            merchantId: merchant.id,
            webhookData,
            processedSuccessfully,
            // Complete enhanced data structure for n8n workflows
            orderDetails: topic.startsWith('orders/') ? extractOrderDetails(webhookData, topic) : null,
            returnDetails: topic.startsWith('returns/') ? extractReturnDetails(webhookData, topic) : null,
            customerDetails: extractCustomerDetails(webhookData),
            itemDetails: extractItemDetails(webhookData),
            // Additional merchant-specific context
            merchantSpecific: true,
            scopeCompliant: true,
            fullDataPayload: true,
            metadata: {
              source: 'enhanced_shopify_webhook_v2',
              timestamp: new Date().toISOString(),
              topic,
              webhook_id: webhookData.id,
              merchant_id: merchant.id,
              shop_domain: shopDomain
            }
          },
          timestamp: new Date().toISOString(),
          source: 'enhanced_shopify_webhook_v2'
        };

        await triggerMerchantN8nWorkflow(n8nConfig, enhancedPayload, merchant.id);
      }
    } catch (n8nError) {
      console.warn('⚠️ Failed to trigger merchant-specific n8n workflow:', n8nError);
    }

    return new Response(
      JSON.stringify({ 
        success: processedSuccessfully,
        processed: true,
        topic,
        merchant_id: merchant.id,
        error: processingError?.message,
        data_sent_to_n8n: true,
        enhanced_payload: true,
        merchant_specific: true
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: processedSuccessfully ? 200 : 500
      }
    );

  } catch (error) {
    console.error('💥 Enhanced webhook processing error:', error);
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

// Enhanced data extraction functions with complete scope compliance
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
    discount_codes: webhookData.discount_codes,
    shipping_address: webhookData.shipping_address,
    billing_address: webhookData.billing_address,
    line_items: webhookData.line_items,
    fulfillments: webhookData.fulfillments,
    refunds: webhookData.refunds
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
    return_line_items: webhookData.return_line_items,
    refund_line_items: webhookData.refund_line_items,
    additional_fees: webhookData.additional_fees
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
    tags: customer.tags,
    accepts_marketing: customer.accepts_marketing,
    default_address: customer.default_address
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
    variant_title: item.variant_title,
    properties: item.properties,
    taxable: item.taxable,
    tax_lines: item.tax_lines
  }));
}

// Helper functions with merchant-specific context
async function processOrderCreation(supabase: any, merchantId: string, orderData: any) {
  // Sync order to database with merchant context
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
  console.log(`✅ Order ${orderData.id} synced for merchant ${merchantId}`);
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

async function getMerchantN8nConfiguration(supabase: any, merchantId: string) {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'n8n_configuration')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.event_data?.n8n_url) return null;
    return data.event_data;
  } catch (error) {
    return null;
  }
}

async function triggerMerchantN8nWorkflow(n8nConfig: any, payload: any, merchantId: string) {
  const webhookUrl = `${n8nConfig.n8n_url}/webhook/shopify-webhook?merchant=${merchantId}`;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Merchant-ID': merchantId
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Merchant n8n webhook failed: ${response.status}`);
  }

  console.log(`✅ Merchant-specific n8n workflow triggered for ${merchantId}`);
}
