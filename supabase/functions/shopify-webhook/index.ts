
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ShopifyWebhookPayload {
  id: number;
  email: string;
  total_price: string;
  line_items: Array<{
    id: number;
    name: string;
    price: string;
    quantity: number;
    product_id: number;
    variant_id: number;
  }>;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

async function verifyShopifyWebhook(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedHex;
}

async function processOrderEvent(payload: ShopifyWebhookPayload, shopDomain: string) {
  console.log('Processing order event for shop:', shopDomain);
  
  // Find merchant by shop domain
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id')
    .eq('shop_domain', shopDomain)
    .single();

  if (merchantError || !merchant) {
    console.error('Merchant not found:', merchantError);
    return;
  }

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shopify_order_id: payload.id.toString(),
      customer_email: payload.email,
      total_amount: parseFloat(payload.total_price),
      status: 'completed'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return;
  }

  // Create order items
  const orderItems = payload.line_items.map(item => ({
    order_id: order.id,
    product_id: item.product_id.toString(),
    product_name: item.name,
    quantity: item.quantity,
    price: parseFloat(item.price)
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  // Log analytics event
  await supabase
    .from('analytics_events')
    .insert({
      merchant_id: merchant.id,
      event_type: 'order_created',
      event_data: {
        order_id: payload.id,
        total_amount: parseFloat(payload.total_price),
        items_count: payload.line_items.length
      }
    });

  console.log('Order processed successfully:', order.id);
}

async function processReturnEvent(payload: any, shopDomain: string) {
  console.log('Processing return event for shop:', shopDomain);
  
  // Find merchant by shop domain
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id')
    .eq('shop_domain', shopDomain)
    .single();

  if (merchantError || !merchant) {
    console.error('Merchant not found:', merchantError);
    return;
  }

  // Create return record
  const { data: returnRecord, error: returnError } = await supabase
    .from('returns')
    .insert({
      merchant_id: merchant.id,
      shopify_order_id: payload.order_id?.toString() || payload.id?.toString(),
      customer_email: payload.email,
      reason: payload.reason || 'Return requested via Shopify',
      total_amount: parseFloat(payload.total_price || '0'),
      status: 'requested'
    })
    .select()
    .single();

  if (returnError) {
    console.error('Error creating return:', returnError);
    return;
  }

  // Trigger n8n workflow for return processing
  await triggerN8nWorkflow('return-processing', {
    returnId: returnRecord.id,
    merchantId: merchant.id,
    customerEmail: payload.email,
    orderValue: parseFloat(payload.total_price || '0')
  });

  console.log('Return processed successfully:', returnRecord.id);
}

async function triggerN8nWorkflow(workflowName: string, data: any) {
  const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
  if (!n8nWebhookUrl) {
    console.log('N8N webhook URL not configured, skipping workflow trigger');
    return;
  }

  try {
    const response = await fetch(`${n8nWebhookUrl}/${workflowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Failed to trigger n8n workflow:', response.statusText);
    } else {
      console.log('N8n workflow triggered successfully:', workflowName);
    }
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    
    if (!signature || !topic || !shopDomain) {
      console.error('Missing required Shopify headers');
      return new Response('Missing required headers', { status: 400 });
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Shopify webhook secret not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Verify webhook signature
    const isValid = await verifyShopifyWebhook(body, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log('Received webhook:', topic, 'from shop:', shopDomain);

    // Process different webhook topics
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        await processOrderEvent(payload, shopDomain);
        break;
      
      case 'orders/cancelled':
        await processReturnEvent(payload, shopDomain);
        break;
      
      case 'app/uninstalled':
        // Handle app uninstallation
        await supabase
          .from('merchants')
          .update({ access_token: '' })
          .eq('shop_domain', shopDomain);
        break;
      
      default:
        console.log('Unhandled webhook topic:', topic);
    }

    return new Response('Webhook processed', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
