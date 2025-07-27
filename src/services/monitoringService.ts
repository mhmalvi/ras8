import { supabase } from '@/integrations/supabase/client';

export interface MonitoringMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  labels: Record<string, string>;
  timestamp: string;
  merchant_id?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric_name: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration_minutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  last_triggered?: string;
}

export interface SystemAlert {
  id: string;
  rule_id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
  triggered_at: string;
  resolved_at?: string;
  metric_value: number;
}

export class MonitoringService {
  /**
   * Record a metric for monitoring
   */
  static async recordMetric(
    metricName: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' = 'gauge',
    labels: Record<string, string> = {},
    merchantId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('record-metric', {
        body: {
          metric_name: metricName,
          metric_value: value,
          metric_type: type,
          labels,
          merchant_id: merchantId
        }
      });

      if (error) {
        console.error('Failed to record metric:', error);
      }
    } catch (err) {
      console.error('Error recording metric:', err);
    }
  }

  /**
   * Get metrics for a time range
   */
  static async getMetrics(
    metricName?: string,
    startTime?: Date,
    endTime?: Date,
    merchantId?: string
  ): Promise<MonitoringMetric[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-metrics', {
        body: {
          metric_name: metricName,
          start_time: startTime?.toISOString(),
          end_time: endTime?.toISOString(),
          merchant_id: merchantId
        }
      });

      if (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`);
      }

      return data?.metrics || [];
    } catch (err) {
      console.error('Error fetching metrics:', err);
      throw err;
    }
  }

  /**
   * Create or update an alert rule
   */
  static async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-alert-rule', {
        body: rule
      });

      if (error) {
        throw new Error(`Failed to create alert rule: ${error.message}`);
      }

      return data?.rule_id;
    } catch (err) {
      console.error('Error creating alert rule:', err);
      throw err;
    }
  }

  /**
   * Get all alert rules
   */
  static async getAlertRules(): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-alert-rules');

      if (error) {
        throw new Error(`Failed to fetch alert rules: ${error.message}`);
      }

      return data?.rules || [];
    } catch (err) {
      console.error('Error fetching alert rules:', err);
      throw err;
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(): Promise<SystemAlert[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-active-alerts');

      if (error) {
        throw new Error(`Failed to fetch active alerts: ${error.message}`);
      }

      return data?.alerts || [];
    } catch (err) {
      console.error('Error fetching active alerts:', err);
      throw err;
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('acknowledge-alert', {
        body: { alert_id: alertId }
      });

      if (error) {
        throw new Error(`Failed to acknowledge alert: ${error.message}`);
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }

  /**
   * Common monitoring helpers
   */
  static async trackApiCall(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    merchantId?: string
  ): Promise<void> {
    await Promise.all([
      this.recordMetric('api_response_time', responseTime, 'histogram', 
        { endpoint, status_code: statusCode.toString() }, merchantId),
      this.recordMetric('api_requests_total', 1, 'counter', 
        { endpoint, status_code: statusCode.toString() }, merchantId)
    ]);
  }

  static async trackError(
    errorType: string,
    errorMessage: string,
    merchantId?: string
  ): Promise<void> {
    await this.recordMetric('errors_total', 1, 'counter', 
      { error_type: errorType, error_message: errorMessage }, merchantId);
  }

  static async trackUserAction(
    action: string,
    merchantId?: string
  ): Promise<void> {
    await this.recordMetric('user_actions_total', 1, 'counter', 
      { action }, merchantId);
  }

  static async trackSystemResource(
    resource: 'memory' | 'cpu' | 'disk',
    value: number
  ): Promise<void> {
    await this.recordMetric(`system_${resource}_usage`, value, 'gauge', 
      { resource });
  }

  /**
   * Dashboard metrics aggregation
   */
  static async getDashboardMetrics(): Promise<{
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    activeAlerts: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('get-dashboard-metrics');

      if (error) {
        throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      // Instead of returning mock data, throw the error to be handled by the component
      throw new Error(`Dashboard metrics unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}