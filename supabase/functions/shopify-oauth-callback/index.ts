
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0?dts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID')!;
const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET')!;

// Initialize Supabase client with service role for OAuth callback (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log('🔄 OAuth callback request received:', req.method, req.url);
    
    // Check environment variables
    if (!shopifyClientId || !shopifyClientSecret || !supabaseUrl || !supabaseServiceKey) {
      const missing = [];
      if (!shopifyClientId) missing.push('SHOPIFY_CLIENT_ID');
      if (!shopifyClientSecret) missing.push('SHOPIFY_CLIENT_SECRET');  
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    // Handle both URL params and POST body
    let code, shop, state, hmac, timestamp;
    
    if (req.method === 'POST') {
      const body = await req.json();
      code = body.code;
      shop = body.shop;
      state = body.state;
      hmac = body.hmac;
      timestamp = body.timestamp;
    } else {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      shop = url.searchParams.get('shop');
      state = url.searchParams.get('state');
      hmac = url.searchParams.get('hmac');
      timestamp = url.searchParams.get('timestamp');
    }
    
    if (!code || !shop) {
      throw new Error('Missing required OAuth parameters: code and shop');
    }

    console.log('✅ OAuth callback received:', { shop, code: code.substring(0, 10) + '...', state });

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

    // Store merchant data in Supabase (using pre-initialized client)
    
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
          app_version: '1.0.0',
          oauth_completed: true
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

    // Debug log environment variables (sanitized)
    console.log('[ENV CHECK]', {
      SHOPIFY_CLIENT_ID: shopifyClientId ? 'SET' : 'MISSING',
      SHOPIFY_CLIENT_SECRET: shopifyClientSecret ? 'SET' : 'MISSING',
      SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'SET' : 'MISSING',
      VITE_APP_URL: Deno.env.get('VITE_APP_URL') ? 'SET' : 'MISSING'
    });

    // Get the host parameter from session storage if available, otherwise construct it
    // This preserves the original host parameter from the OAuth flow
    let hostParam: string;
    
    // Check if host was stored during OAuth initiation
    const storedHost = req.headers.get('x-shopify-oauth-host');
    
    if (storedHost) {
      hostParam = storedHost;
    } else {
      // Fallback: construct host parameter (base64 encoded shop/admin)
      hostParam = btoa(`${shop}/admin`).replace(/=/g, '');
    }
    
    const appUrl = Deno.env.get('VITE_APP_URL') || 'https://ras-5.vercel.app';
    
    // Trigger initial data sync for new merchant
    if (merchant) {
      try {
        // For now, we'll create a simple sync trigger
        // You can expand this to call a dedicated sync function
        console.log('✅ New merchant installation, triggering initial sync for:', merchant.id);
        
        // Log a sync initiated event
        await supabase
          .from('analytics_events')
          .insert({
            merchant_id: merchant.id,
            event_type: 'initial_sync_started',
            event_data: {
              shop_domain: shop,
              sync_timestamp: new Date().toISOString()
            }
          });
        
      } catch (syncError) {
        console.error('⚠️  Initial sync preparation failed (non-blocking):', syncError);
        // Don't fail the installation if sync fails
      }
    }
    
    // Determine response format based on call method
    if (req.method === 'POST') {
      // Called from frontend via supabase.functions.invoke - return JSON
      return new Response(JSON.stringify({
        success: true,
        accessToken: encryptedToken,
        scope: 'read_orders,write_orders,read_customers,read_products',
        merchant_id: merchant.id,
        shop_domain: shop
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Called directly via URL - return HTML redirect
      const redirectUrl = `${appUrl}/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;
      
      const topLevelRedirectHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>H5 - Installation Complete</title>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
          .success { color: #10B981; font-size: 24px; margin-bottom: 20px; }
          .info { color: #64748B; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="success">✅ Installation Successful!</div>
        <div class="info">Setting up your returns automation...</div>
        <div style="color: #64748B; font-size: 14px; margin-top: 15px;">
          • Syncing your store data<br>
          • Configuring AI automation<br>
          • Preparing your dashboard
        </div>
        <script>
          // Add a small delay to show the success message
          setTimeout(() => {
            window.location.href = "${redirectUrl}";
          }, 2000);
        </script>
      </body>
      </html>`;

      return new Response(topLevelRedirectHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Content-Security-Policy': 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;',
        },
      });
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    if (req.method === 'POST') {
      // Return JSON error for function calls
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Return HTML error for direct URL access
      const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Installation Error</title></head>
      <body>
        <h1>Installation Failed</h1>
        <p>There was an error installing the H5 app. Please try again or contact support.</p>
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
  }
});
