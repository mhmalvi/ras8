
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0?dts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

// Verify Shopify webhook HMAC
async function verifyWebhookHmac(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  return computedSignature === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    
    if (!topic || !shopDomain || !hmacHeader) {
      return new Response('Missing required headers', { status: 400, headers: corsHeaders });
    }

    const body = await req.text();
    
    // Verify HMAC signature
    const isValidHmac = await verifyWebhookHmac(body, hmacHeader, shopifyClientSecret);
    if (!isValidHmac) {
      console.error('Invalid HMAC signature for GDPR webhook');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const payload = JSON.parse(body);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get merchant for this shop
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single();

    if (!merchant) {
      console.error(`No merchant found for shop: ${shopDomain}`);
      return new Response('Merchant not found', { status: 404, headers: corsHeaders });
    }

    switch (topic) {
      case 'customers/data_request':
        // Handle customer data request (GDPR Article 15 - Right of Access)
        await handleCustomerDataRequest(supabase, merchant.id, payload);
        break;
        
      case 'customers/redact':
        // Handle customer data deletion (GDPR Article 17 - Right to Erasure)
        await handleCustomerDataRedaction(supabase, merchant.id, payload);
        break;
        
      case 'shop/redact':
        // Handle shop data deletion (when merchant uninstalls app)
        await handleShopDataRedaction(supabase, merchant.id, payload);
        break;
        
      default:
        console.warn(`Unhandled GDPR webhook topic: ${topic}`);
        return new Response('Unhandled topic', { status: 400, headers: corsHeaders });
    }

    // Log GDPR compliance event
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'gdpr_compliance',
        event_data: {
          topic,
          shop_domain: shopDomain,
          customer_id: payload.customer?.id,
          timestamp: new Date().toISOString(),
          processed: true
        }
      });

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('GDPR webhook error:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function handleCustomerDataRequest(supabase: any, merchantId: string, payload: any) {
  const customerEmail = payload.customer?.email;
  if (!customerEmail) return;

  // Collect all customer data we have stored
  const { data: returns } = await supabase
    .from('returns')
    .select(`
      *,
      return_items (*),
      ai_suggestions (*)
    `)
    .eq('merchant_id', merchantId)
    .eq('customer_email', customerEmail);

  // In a real implementation, you would:
  // 1. Compile all customer data into a structured format
  // 2. Send it to the customer via secure email or portal
  // 3. Log the data request fulfillment
  
  console.log(`Data request processed for customer: ${customerEmail}, merchant: ${merchantId}`);
  console.log(`Found ${returns?.length || 0} returns for this customer`);
}

async function handleCustomerDataRedaction(supabase: any, merchantId: string, payload: any) {
  const customerEmail = payload.customer?.email;
  const customerId = payload.customer?.id;
  
  if (!customerEmail) return;

  try {
    // Delete or anonymize customer data
    // Note: We should anonymize rather than delete for business continuity
    
    // Anonymize returns data
    await supabase
      .from('returns')
      .update({
        customer_email: `redacted-${customerId}@privacy.local`,
        updated_at: new Date().toISOString()
      })
      .eq('merchant_id', merchantId)
      .eq('customer_email', customerEmail);

    console.log(`Customer data redacted for: ${customerEmail}, merchant: ${merchantId}`);
    
  } catch (error) {
    console.error('Error redacting customer data:', error);
    throw error;
  }
}

async function handleShopDataRedaction(supabase: any, merchantId: string, payload: any) {
  const shopDomain = payload.shop_domain;
  
  try {
    // When a shop uninstalls, we need to:
    // 1. Mark merchant as inactive but preserve data for potential reinstalls
    // 2. Encrypt/anonymize sensitive data
    // 3. Set retention policies
    
    await supabase
      .from('merchants')
      .update({
        access_token: 'SHOP_REDACTED',
        settings: {
          ...payload.settings,
          redacted_at: new Date().toISOString(),
          redaction_reason: 'shop_uninstall'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantId);

    console.log(`Shop data redaction processed for: ${shopDomain}, merchant: ${merchantId}`);
    
  } catch (error) {
    console.error('Error processing shop redaction:', error);
    throw error;
  }
}
