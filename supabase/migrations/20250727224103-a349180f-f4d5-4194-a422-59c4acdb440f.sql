-- Create optimized database functions for performance

-- Function to get dashboard metrics efficiently
CREATE OR REPLACE FUNCTION get_dashboard_metrics_optimized(p_merchant_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH metrics AS (
    SELECT 
      COUNT(r.id) as total_returns,
      COUNT(r.id) FILTER (WHERE r.status = 'requested') as pending_returns,
      COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed_returns,
      COALESCE(SUM(r.total_amount), 0) as total_revenue,
      COALESCE(AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at))/3600), 0) as avg_processing_hours
    FROM returns r 
    WHERE r.merchant_id = p_merchant_id
  ),
  ai_stats AS (
    SELECT 
      COUNT(ai.id) as total_suggestions,
      COUNT(ai.id) FILTER (WHERE ai.accepted = true) as accepted_suggestions
    FROM ai_suggestions ai
    JOIN returns r ON r.id = ai.return_id
    WHERE r.merchant_id = p_merchant_id
  ),
  return_reasons AS (
    SELECT 
      r.reason,
      COUNT(*) as count
    FROM returns r
    WHERE r.merchant_id = p_merchant_id
    AND r.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY r.reason
    ORDER BY count DESC
    LIMIT 5
  ),
  monthly_trends AS (
    SELECT 
      DATE_TRUNC('month', r.created_at) as month,
      COUNT(*) as return_count,
      SUM(r.total_amount) as revenue
    FROM returns r
    WHERE r.merchant_id = p_merchant_id
    AND r.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', r.created_at)
    ORDER BY month DESC
    LIMIT 12
  )
  SELECT json_build_object(
    'totalReturns', m.total_returns,
    'pendingReturns', m.pending_returns,
    'completedReturns', m.completed_returns,
    'totalRevenue', m.total_revenue,
    'averageProcessingTime', m.avg_processing_hours,
    'aiAcceptanceRate', CASE 
      WHEN ai.total_suggestions > 0 
      THEN (ai.accepted_suggestions::FLOAT / ai.total_suggestions::FLOAT) * 100 
      ELSE 0 
    END,
    'topReturnReasons', COALESCE(
      (SELECT json_agg(json_build_object('reason', reason, 'count', count)) FROM return_reasons), 
      '[]'::json
    ),
    'monthlyTrends', COALESCE(
      (SELECT json_agg(json_build_object('month', month, 'returns', return_count, 'revenue', revenue)) FROM monthly_trends),
      '[]'::json
    )
  ) INTO result
  FROM metrics m, ai_stats ai;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregated analytics data
CREATE OR REPLACE FUNCTION get_analytics_aggregated(
  p_merchant_id UUID,
  p_event_type TEXT DEFAULT NULL,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Parse dates or use defaults
  start_date := COALESCE(p_start_date::TIMESTAMP WITH TIME ZONE, NOW() - INTERVAL '30 days');
  end_date := COALESCE(p_end_date::TIMESTAMP WITH TIME ZONE, NOW());
  
  WITH event_summary AS (
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT event_type) as unique_event_types
    FROM analytics_events ae
    WHERE ae.merchant_id = p_merchant_id
    AND ae.created_at BETWEEN start_date AND end_date
    AND (p_event_type IS NULL OR ae.event_type = p_event_type)
  ),
  events_by_type AS (
    SELECT 
      ae.event_type,
      COUNT(*) as count
    FROM analytics_events ae
    WHERE ae.merchant_id = p_merchant_id
    AND ae.created_at BETWEEN start_date AND end_date
    AND (p_event_type IS NULL OR ae.event_type = p_event_type)
    GROUP BY ae.event_type
    ORDER BY count DESC
  ),
  daily_aggregates AS (
    SELECT 
      DATE_TRUNC('day', ae.created_at) as date,
      COUNT(*) as event_count,
      COUNT(DISTINCT ae.event_type) as unique_types
    FROM analytics_events ae
    WHERE ae.merchant_id = p_merchant_id
    AND ae.created_at BETWEEN start_date AND end_date
    AND (p_event_type IS NULL OR ae.event_type = p_event_type)
    GROUP BY DATE_TRUNC('day', ae.created_at)
    ORDER BY date DESC
  )
  SELECT json_build_object(
    'totalEvents', es.total_events,
    'uniqueEventTypes', es.unique_event_types,
    'eventsByType', COALESCE(
      (SELECT json_object_agg(event_type, count) FROM events_by_type),
      '{}'::json
    ),
    'timeSeriesData', COALESCE(
      (SELECT json_agg(json_build_object('date', date, 'eventCount', event_count, 'uniqueTypes', unique_types)) 
       FROM daily_aggregates),
      '[]'::json
    ),
    'dateRange', json_build_object('start', start_date, 'end', end_date)
  ) INTO result
  FROM event_summary es;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;