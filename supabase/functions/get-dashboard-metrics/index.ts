import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📊 Calculating dashboard metrics...');

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch metrics data
    const [metricsData, alertsData] = await Promise.all([
      supabase
        .from('monitoring_metrics')
        .select('*')
        .gte('timestamp', twentyFourHoursAgo.toISOString()),
      
      supabase
        .from('system_alerts')
        .select('*')
        .eq('status', 'active')
    ]);

    const metrics = metricsData.data || [];
    const activeAlerts = alertsData.data || [];

    // Calculate total requests
    const requestMetrics = metrics.filter(m => m.metric_name === 'api_requests_total');
    const totalRequests = requestMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0);

    // Calculate error rate
    const errorMetrics = metrics.filter(m => m.metric_name === 'errors_total');
    const totalErrors = errorMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Calculate average response time
    const responseTimeMetrics = metrics.filter(m => m.metric_name === 'api_response_time');
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0) / responseTimeMetrics.length
      : 0;

    // Determine system health
    let systemHealth = 'healthy';
    if (activeAlerts.some(a => a.severity === 'critical')) {
      systemHealth = 'critical';
    } else if (activeAlerts.some(a => a.severity === 'high') || errorRate > 5) {
      systemHealth = 'warning';
    }

    const dashboardMetrics = {
      totalRequests,
      errorRate: Number(errorRate.toFixed(2)),
      avgResponseTime: Math.round(avgResponseTime),
      activeAlerts: activeAlerts.length,
      systemHealth
    };

    console.log('✅ Dashboard metrics calculated:', dashboardMetrics);

    return new Response(JSON.stringify(dashboardMetrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to calculate dashboard metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);