import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID')!;
const appUrl = Deno.env.get('VITE_APP_URL') || 'https://ras-5.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const host = url.searchParams.get('host');
    
    if (!shop) {
      throw new Error('Missing shop parameter');
    }

    // Validate shop domain
    if (!shop.endsWith('.myshopify.com')) {
      throw new Error('Invalid shop domain');
    }

    // Required scopes for the H5 app
    const scopes = [
      'read_orders',
      'write_orders', 
      'read_customers',
      'read_products',
      'write_shipping'
    ].join(',');

    // Generate OAuth URL - FIXED: Use correct redirect URI matching Partner Platform
    const redirectUri = `${appUrl}/api/oauth/shopify-callback`;
    const state = crypto.randomUUID();
    
    const oauthUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    oauthUrl.searchParams.set('client_id', shopifyClientId);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);
    
    // Optional: Store the host parameter for later use
    if (host) {
      // In a real implementation, you might store this in a temporary session store
      console.log('Host parameter preserved:', host);
    }

    console.log('🔐 Initiating OAuth for shop:', shop);
    console.log('📍 Redirect URI:', redirectUri);

    // Create iframe-breakout HTML that redirects to top-level window
    const breakoutHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>H5 - Starting Installation</title>
      <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://*.shopify.com https://*.shopifycloud.com;">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: #f0f9ff; 
          margin: 0;
        }
        .loading { color: #0EA5E9; font-size: 20px; margin-bottom: 15px; }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e7ff;
          border-top: 4px solid #0EA5E9;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <div class="loading">Starting H5 Installation...</div>
      <p style="color: #64748B;">Please wait while we redirect you to Shopify for authorization.</p>
      
      <script>
        // Break out of iframe and redirect to top-level OAuth
        if (window.top !== window.self) {
          window.top.location.href = "${oauthUrl.toString()}";
        } else {
          window.location.href = "${oauthUrl.toString()}";
        }
      </script>
    </body>
    </html>`;

    return new Response(breakoutHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('OAuth start error:', error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Installation Error</title></head>
    <body>
      <h1>Unable to Start Installation</h1>
      <p>There was an error starting the H5 app installation.</p>
      <p>Error: ${error.message}</p>
      <button onclick="window.history.back()">Go Back</button>
    </body>
    </html>`;

    return new Response(errorHtml, {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });
  }
});