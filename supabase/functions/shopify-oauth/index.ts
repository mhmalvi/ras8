
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0?dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHOPIFY-OAUTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("OAuth callback started");

    const clientId = Deno.env.get("SHOPIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      throw new Error("Shopify credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");
    const timestamp = url.searchParams.get("timestamp");
    const state = url.searchParams.get("state");

    if (!code || !shop) {
      throw new Error("Missing required OAuth parameters");
    }

    logStep("OAuth parameters received", { shop, hasCode: !!code, hasHmac: !!hmac });

    // Verify HMAC signature for security
    if (hmac && timestamp) {
      const queryString = url.search.substring(1);
      const params = new URLSearchParams(queryString);
      params.delete('hmac');
      params.delete('signature');
      
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(clientSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sortedParams));
      const expectedHmac = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (hmac !== expectedHmac) {
        logStep("HMAC verification failed", { expected: expectedHmac, received: hmac });
        throw new Error("Invalid HMAC signature");
      }
      
      logStep("HMAC verification successful");
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logStep("Token exchange failed", { status: tokenResponse.status, error: errorText });
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    logStep("Access token obtained", { scope, shop });

    // Store merchant data in database
    const { data: merchant, error: merchantError } = await supabaseClient
      .from('merchants')
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        plan_type: 'starter',
        settings: {
          scopes: scope,
          installed_at: new Date().toISOString(),
          oauth_completed: true
        },
        token_encrypted_at: new Date().toISOString(),
        token_encryption_version: 1
      }, {
        onConflict: 'shop_domain',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (merchantError) {
      logStep("Database error", merchantError);
      throw new Error(`Database error: ${merchantError.message}`);
    }

    logStep("Merchant stored successfully", { merchantId: merchant.id, shop });

    // Log installation event
    await supabaseClient
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'app_installed',
        event_data: {
          shop_domain: shop,
          scopes: scope,
          installation_method: 'oauth',
          timestamp: new Date().toISOString()
        }
      });

    // Redirect to success page
    const redirectUrl = state ? decodeURIComponent(state) : `https://${shop}/admin/apps`;
    
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Returns Automation - Installation Complete</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #10B981; font-size: 24px; margin-bottom: 20px; }
            .info { color: #64748B; margin-bottom: 30px; }
            .btn { background: #1D4ED8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="success">✅ Installation Successful!</div>
          <div class="info">Returns Automation has been installed on your store: ${shop}</div>
          <a href="https://${shop}/admin/apps" class="btn">Go to Shopify Admin</a>
          <script>
            setTimeout(() => {
              window.top.location.href = "https://${shop}/admin/apps";
            }, 3000);
          </script>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html" 
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in shopify-oauth", { message: errorMessage });
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Returns Automation - Installation Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #EF4444; font-size: 24px; margin-bottom: 20px; }
            .details { color: #64748B; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="error">❌ Installation Failed</div>
          <div class="details">${errorMessage}</div>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html" 
      },
      status: 500,
    });
  }
});
