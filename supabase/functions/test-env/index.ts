import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check all required environment variables
    const envStatus = {
      SHOPIFY_CLIENT_ID: Deno.env.get('SHOPIFY_CLIENT_ID') ? 'SET' : 'MISSING',
      SHOPIFY_CLIENT_SECRET: Deno.env.get('SHOPIFY_CLIENT_SECRET') ? 'SET' : 'MISSING',
      SHOPIFY_WEBHOOK_SECRET: Deno.env.get('SHOPIFY_WEBHOOK_SECRET') ? 'SET' : 'MISSING',
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
      VITE_APP_URL: Deno.env.get('VITE_APP_URL') ? 'SET' : 'MISSING',
    };

    // Count missing variables
    const missingCount = Object.values(envStatus).filter(status => status === 'MISSING').length;
    const totalCount = Object.keys(envStatus).length;

    const result = {
      status: missingCount === 0 ? 'SUCCESS' : 'PARTIAL',
      message: missingCount === 0 ? 
        'All environment variables are configured correctly!' : 
        `${missingCount}/${totalCount} environment variables are missing`,
      variables: envStatus,
      timestamp: new Date().toISOString(),
      recommendations: missingCount > 0 ? [
        'Go to Supabase Dashboard → Edge Functions → Settings → Environment Variables',
        'Add the missing variables without VITE_ prefix',
        'Redeploy the functions after adding variables'
      ] : [
        'Environment configuration is complete',
        'OAuth flow should work correctly now'
      ]
    };

    console.log('Environment Variable Check:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Environment test error:', error);
    
    return new Response(JSON.stringify({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});