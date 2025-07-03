
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0?dts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID')!;
const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC validation for security
function verifyHmac(data: string, signature: string, secret: string): boolean {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, encoder.encode(data))
  ).then(signatureBuffer => {
    const signature_hex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return signature_hex === signature;
  });
}

// Token encryption helper
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(shopifyClientSecret.substring(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const shop = url.searchParams.get('shop');
    const state = url.searchParams.get('state');
    const hmac = url.searchParams.get('hmac');
    
    if (!code || !shop || !hmac) {
      throw new Error('Missing required parameters');
    }

    // Verify HMAC for security
    const queryString = url.search.substring(1);
    const params = new URLSearchParams(queryString);
    params.delete('hmac');
    const sortedParams = Array.from(params.entries())
      .sort()
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const isValidHmac = await verifyHmac(sortedParams, hmac, shopifyClientSecret);
    if (!isValidHmac) {
      throw new Error('Invalid HMAC signature');
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: shopifyClientId,
        client_secret: shopifyClientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Encrypt the access token
    const encryptedToken = await encryptToken(accessToken);

    // Store merchant data in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .upsert({
        shop_domain: shop,
        access_token: encryptedToken,
        token_encrypted_at: new Date().toISOString(),
        token_encryption_version: 2,
        plan_type: 'starter',
        settings: {
          installation_date: new Date().toISOString(),
          app_version: '1.0.0'
        }
      }, {
        onConflict: 'shop_domain'
      })
      .select()
      .single();

    if (merchantError) {
      console.error('Error storing merchant:', merchantError);
      throw new Error('Failed to store merchant data');
    }

    // Log installation event
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'app_installed',
        event_data: {
          shop_domain: shop,
          installation_method: 'oauth',
          timestamp: new Date().toISOString()
        }
      });

    // Create App Bridge redirect for proper Shopify Admin embedding
    const appBridgeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
      <script>
        const AppBridge = window['app-bridge'];
        const app = AppBridge.createApp({
          apiKey: '${shopifyClientId}',
          host: '${btoa(shop + '/admin').replace(/=/g, '')}'
        });
        
        // Redirect to main app
        const redirect = AppBridge.actions.Redirect.create(app);
        redirect.dispatch(AppBridge.actions.Redirect.Action.APP, '/');
      </script>
    </head>
    <body>
      <p>Installation successful! Redirecting to your Returns Automation dashboard...</p>
    </body>
    </html>`;

    return new Response(appBridgeHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Installation Error</title></head>
    <body>
      <h1>Installation Failed</h1>
      <p>There was an error installing the Returns Automation app. Please try again or contact support.</p>
      <p>Error: ${error.message}</p>
    </body>
    </html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });
  }
});
