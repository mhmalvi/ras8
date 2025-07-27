import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Shopify configuration from environment variables
    const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');

    if (!shopifyClientId) {
      console.error('SHOPIFY_CLIENT_ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Shopify configuration not found',
          configured: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Shopify configuration found');

    return new Response(
      JSON.stringify({
        clientId: shopifyClientId,
        configured: true,
        hasSecret: !!shopifyClientSecret
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error getting Shopify config:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        configured: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});