-- Create monitoring tables for production monitoring and alerting

-- Monitoring metrics table
CREATE TABLE public.monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'gauge' CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
  labels JSONB DEFAULT '{}',
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert rules table
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  operator VARCHAR(10) NOT NULL CHECK (operator IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  threshold NUMERIC NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts table
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  metric_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Master admins can view all monitoring metrics"
  ON public.monitoring_metrics
  FOR SELECT
  USING (is_master_admin());

CREATE POLICY "System can insert monitoring metrics"
  ON public.monitoring_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Master admins can manage alert rules"
  ON public.alert_rules
  FOR ALL
  USING (is_master_admin());

CREATE POLICY "Master admins can view all system alerts"
  ON public.system_alerts
  FOR ALL
  USING (is_master_admin());

-- Create indexes for performance
CREATE INDEX idx_monitoring_metrics_name_time ON public.monitoring_metrics(metric_name, timestamp DESC);
CREATE INDEX idx_monitoring_metrics_merchant ON public.monitoring_metrics(merchant_id, timestamp DESC);
CREATE INDEX idx_monitoring_metrics_labels ON public.monitoring_metrics USING GIN(labels);
CREATE INDEX idx_alert_rules_metric ON public.alert_rules(metric_name, enabled);
CREATE INDEX idx_system_alerts_status ON public.system_alerts(status, triggered_at DESC);
CREATE INDEX idx_system_alerts_rule ON public.system_alerts(rule_id, status);

-- Create default alert rules
INSERT INTO public.alert_rules (name, metric_name, operator, threshold, duration_minutes, severity) VALUES
('High Error Rate', 'errors_total', 'gt', 10, 5, 'high'),
('Slow API Response', 'api_response_time', 'gt', 2000, 3, 'medium'),
('High CPU Usage', 'system_cpu_usage', 'gt', 80, 10, 'high'),
('Low Database Performance', 'database_response_time', 'gt', 1000, 5, 'medium'),
('Critical Error Rate', 'errors_total', 'gt', 50, 2, 'critical');