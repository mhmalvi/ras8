import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricRequest {
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  labels: Record<string, string>;
  merchant_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      metric_name, 
      metric_value, 
      metric_type, 
      labels, 
      merchant_id 
    }: MetricRequest = await req.json();

    // Validate required fields
    if (!metric_name || typeof metric_value !== 'number') {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: metric_name and metric_value' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Record the metric
    const { error } = await supabase
      .from('monitoring_metrics')
      .insert({
        metric_name,
        metric_value,
        metric_type: metric_type || 'gauge',
        labels: labels || {},
        merchant_id,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to record metric:', error);
      throw error;
    }

    // Check for alert conditions
    await checkAlertConditions(supabase, metric_name, metric_value, labels, merchant_id);

    console.log(`📊 Metric recorded: ${metric_name} = ${metric_value}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error recording metric:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to record metric',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

async function checkAlertConditions(
  supabase: any,
  metricName: string,
  metricValue: number,
  labels: Record<string, string>,
  merchantId?: string
) {
  try {
    // Get alert rules for this metric
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('metric_name', metricName)
      .eq('enabled', true);

    if (error || !rules) {
      console.log('No alert rules found or error fetching rules');
      return;
    }

    for (const rule of rules) {
      let shouldAlert = false;

      // Check if threshold is breached
      switch (rule.operator) {
        case 'gt':
          shouldAlert = metricValue > rule.threshold;
          break;
        case 'gte':
          shouldAlert = metricValue >= rule.threshold;
          break;
        case 'lt':
          shouldAlert = metricValue < rule.threshold;
          break;
        case 'lte':
          shouldAlert = metricValue <= rule.threshold;
          break;
        case 'eq':
          shouldAlert = metricValue === rule.threshold;
          break;
      }

      if (shouldAlert) {
        // Check if alert was recently triggered (avoid spam)
        const recentThreshold = new Date(Date.now() - (rule.duration_minutes * 60 * 1000));
        
        const { data: recentAlerts } = await supabase
          .from('system_alerts')
          .select('*')
          .eq('rule_id', rule.id)
          .eq('status', 'active')
          .gte('triggered_at', recentThreshold.toISOString());

        if (!recentAlerts || recentAlerts.length === 0) {
          // Create new alert
          const { error: alertError } = await supabase
            .from('system_alerts')
            .insert({
              rule_id: rule.id,
              message: `${rule.name}: ${metricName} = ${metricValue} (threshold: ${rule.threshold})`,
              severity: rule.severity,
              status: 'active',
              triggered_at: new Date().toISOString(),
              metric_value: metricValue
            });

          if (!alertError) {
            console.log(`🚨 Alert triggered: ${rule.name}`);
            
            // Send notification to all merchants (or specific merchant if available)
            if (merchantId) {
              await supabase.rpc('create_notification', {
                p_merchant_id: merchantId,
                p_type: 'system_alert',
                p_title: `System Alert: ${rule.name}`,
                p_message: `${metricName} = ${metricValue} (threshold: ${rule.threshold})`,
                p_priority: rule.severity === 'critical' ? 'high' : 'medium',
                p_data: { rule_id: rule.id, metric_value: metricValue }
              });
            }
          }
        }
      }
    }
  } catch (alertError) {
    console.error('Error checking alert conditions:', alertError);
  }
}

serve(handler);