import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

// Secure CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pvadajelvewdazwmvppk.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `webhook_${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 500;

    const rateLimit = rateLimitStore.get(rateLimitKey);
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= maxRequests) {
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

    // Validate timestamp to prevent replay attacks
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

    console.log('✅ Webhook signature verified successfully');

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

    // Log webhook event for audit
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: `webhook_${topic.replace('/', '_')}`,
        event_data: {
          shop_domain: shopDomain,
          topic,
          webhook_id: webhookData.id || 'unknown',
          timestamp: new Date().toISOString(),
          processed: true
        }
      });

    // Handle specific webhook topics
    switch (topic) {
      case 'orders/create':
        console.log('Processing order creation webhook');
        // Add order processing logic here
        break;
        
      case 'orders/updated':
        console.log('Processing order update webhook');
        // Add order update logic here
        break;
        
      case 'app/uninstalled':
        console.log('Processing app uninstall webhook');
        // Clean up merchant data
        await supabase
          .from('merchants')
          .update({ 
            access_token: 'UNINSTALLED',
            updated_at: new Date().toISOString()
          })
          .eq('id', merchant.id);
        break;
        
      default:
        console.log('Unhandled webhook topic:', topic);
    }

    return new Response(
      JSON.stringify({ success: true, processed: true }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
