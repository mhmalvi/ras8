import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { merchant_id, event_type, payload, webhook_url } = await req.json();

    if (!merchant_id || !event_type || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: merchant_id, event_type, payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔗 Triggering n8n webhook for merchant ${merchant_id}, event: ${event_type}`);

    // If specific webhook URL provided, use it; otherwise get from database
    let webhookUrls: string[] = [];
    
    if (webhook_url) {
      webhookUrls = [webhook_url];
    } else {
      // Get webhook endpoints for this merchant and event type
      const { data: endpoints, error: endpointsError } = await supabaseClient
        .from('webhook_endpoints')
        .select('webhook_url, secret_key, name')
        .eq('merchant_id', merchant_id)
        .eq('active', true)
        .contains('events', [event_type]);

      if (endpointsError) {
        console.error('Error fetching webhook endpoints:', endpointsError);
        throw endpointsError;
      }

      webhookUrls = endpoints?.map(e => e.webhook_url) || [];
    }

    if (webhookUrls.length === 0) {
      console.log(`No active webhooks found for merchant ${merchant_id} and event ${event_type}`);
      return new Response(
        JSON.stringify({ 
          message: 'No active webhooks configured for this event type',
          webhooks_triggered: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare webhook payload
    const webhookPayload = {
      event_type,
      timestamp: new Date().toISOString(),
      merchant_id,
      data: payload,
      platform: 'returns-automation-saas'
    };

    // Trigger webhooks
    const webhookResults = await Promise.allSettled(
      webhookUrls.map(async (url) => {
        const startTime = Date.now();
        
        try {
          console.log(`📡 Sending webhook to: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Returns-Automation-SaaS/1.0'
            },
            body: JSON.stringify(webhookPayload)
          });

          const processingTime = Date.now() - startTime;
          const responseText = await response.text();

          // Log webhook activity
          await supabaseClient
            .from('webhook_activity')
            .insert({
              merchant_id,
              webhook_type: event_type,
              source: 'n8n-webhook-trigger',
              status: response.ok ? 'success' : 'failed',
              payload: webhookPayload,
              response: {
                status: response.status,
                body: responseText,
                headers: Object.fromEntries(response.headers.entries())
              },
              processing_time_ms: processingTime,
              error_message: response.ok ? null : `HTTP ${response.status}: ${responseText}`
            });

          console.log(`✅ Webhook sent successfully to ${url} (${processingTime}ms)`);
          
          return {
            url,
            success: true,
            status: response.status,
            processing_time_ms: processingTime
          };

        } catch (error) {
          const processingTime = Date.now() - startTime;
          console.error(`❌ Webhook failed for ${url}:`, error);
          
          // Log failed webhook activity
          await supabaseClient
            .from('webhook_activity')
            .insert({
              merchant_id,
              webhook_type: event_type,
              source: 'n8n-webhook-trigger',
              status: 'failed',
              payload: webhookPayload,
              processing_time_ms: processingTime,
              error_message: error.message
            });

          return {
            url,
            success: false,
            error: error.message,
            processing_time_ms: processingTime
          };
        }
      })
    );

    // Process results
    const successfulWebhooks = webhookResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failedWebhooks = webhookResults.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    );

    console.log(`🎯 Webhook summary: ${successfulWebhooks}/${webhookUrls.length} successful`);

    return new Response(
      JSON.stringify({
        message: 'Webhook triggers completed',
        webhooks_triggered: webhookUrls.length,
        successful: successfulWebhooks,
        failed: failedWebhooks.length,
        results: webhookResults.map(result => 
          result.status === 'fulfilled' ? result.value : { error: result.reason }
        )
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ n8n webhook trigger error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});