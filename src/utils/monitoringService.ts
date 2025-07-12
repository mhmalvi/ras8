
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
  source: string;
  user_id?: string;
  merchant_id?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: any;
}

export class MonitoringService {
  private static logBuffer: LogEntry[] = [];
  private static metricsBuffer: PerformanceMetric[] = [];
  private static flushInterval: NodeJS.Timeout;

  static {
    // Auto-flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs();
      this.flushMetrics();
    }, 30000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushLogs();
        this.flushMetrics();
      });
    }
  }

  // Logging methods
  static log(level: LogEntry['level'], message: string, data?: any, source: string = 'frontend') {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    // Add user context if available
    this.addUserContext(entry);

    console[level](`[${source.toUpperCase()}] ${message}`, data);
    this.logBuffer.push(entry);

    // Immediate flush for errors
    if (level === 'error') {
      this.flushLogs();
    }
  }

  static info(message: string, data?: any, source?: string) {
    this.log('info', message, data, source);
  }

  static warn(message: string, data?: any, source?: string) {
    this.log('warn', message, data, source);
  }

  static error(message: string, data?: any, source?: string) {
    this.log('error', message, data, source);
  }

  static debug(message: string, data?: any, source?: string) {
    this.log('debug', message, data, source);
  }

  // Performance monitoring
  static recordMetric(name: string, value: number, unit: string = 'ms', metadata?: any) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.metricsBuffer.push(metric);
    
    // Log significant performance issues
    if (name.includes('response_time') && value > 2000) {
      this.warn(`Slow response detected: ${name}`, { value, unit, metadata });
    }
  }

  // API monitoring wrapper
  static async monitorApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      this.recordMetric(`api_${name}_success`, duration, 'ms', metadata);
      this.info(`API call succeeded: ${name}`, { duration, metadata });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric(`api_${name}_error`, duration, 'ms', metadata);
      this.error(`API call failed: ${name}`, { error, duration, metadata });
      
      throw error;
    }
  }

  // Database query monitoring
  static async monitorQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    return this.monitorApiCall(`query_${queryName}`, query, metadata);
  }

  // User action tracking
  static trackUserAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data, 'user_tracking');
  }

  // Error boundary integration
  static reportError(error: Error, errorInfo?: any) {
    this.error('React Error Boundary', {
      error: {
        message: error.message,
        stack: error.stack
      },
      errorInfo
    }, 'error_boundary');
  }

  // Performance observer integration
  static startPerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
            this.recordMetric('first_paint', navEntry.loadEventStart - navEntry.fetchStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Monitor resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 1000) { // Only log slow resources
              this.recordMetric('slow_resource_load', resourceEntry.duration, 'ms', {
                name: resourceEntry.name,
                type: resourceEntry.initiatorType
              });
            }
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

    } catch (error) {
      this.warn('Failed to start performance observer', error);
    }
  }

  // Health check monitoring
  static async performHealthCheck(): Promise<{ healthy: boolean; checks: any[] }> {
    const checks = [];

    try {
      // Database connectivity
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('merchants').select('id').limit(1);
      const dbDuration = Date.now() - dbStart;
      
      checks.push({
        name: 'database',
        healthy: !dbError,
        duration: dbDuration,
        error: dbError?.message
      });

      // API responsiveness
      const apiStart = Date.now();
      try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        const apiDuration = Date.now() - apiStart;
        checks.push({
          name: 'api',
          healthy: response.ok,
          duration: apiDuration,
          status: response.status
        });
      } catch (apiError) {
        checks.push({
          name: 'api',
          healthy: false,
          duration: Date.now() - apiStart,
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        });
      }

      const healthy = checks.every(check => check.healthy);
      
      this.info('Health check completed', { healthy, checks });
      
      return { healthy, checks };
    } catch (error) {
      this.error('Health check failed', error);
      return { healthy: false, checks };
    }
  }

  // Private methods
  private static async addUserContext(entry: LogEntry) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        entry.user_id = user.id;

        // Get merchant context if available
        const { data: profile } = await supabase
          .from('profiles')
          .select('merchant_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.merchant_id) {
          entry.merchant_id = profile.merchant_id;
        }
      }
    } catch (error) {
      // Silently fail - don't log errors in logging system
    }
  }

  private static async flushLogs() {
    if (this.logBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      // Store in analytics_events table
      await supabase.from('analytics_events').insert(
        logsToFlush.map(log => ({
          event_type: `log_${log.level}`,
          event_data: {
            message: log.message,
            data: log.data,
            source: log.source,
            user_id: log.user_id,
            timestamp: log.timestamp
          },
          merchant_id: log.merchant_id
        }))
      );

      console.log(`📤 Flushed ${logsToFlush.length} log entries`);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Don't re-add to buffer to avoid infinite loops
    }
  }

  private static async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Store in analytics_events table
      await supabase.from('analytics_events').insert(
        metricsToFlush.map(metric => ({
          event_type: 'performance_metric',
          event_data: {
            metric_name: metric.name,
            value: metric.value,
            unit: metric.unit,
            metadata: metric.metadata,
            timestamp: metric.timestamp
          }
        }))
      );

      console.log(`📊 Flushed ${metricsToFlush.length} performance metrics`);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  static cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs();
    this.flushMetrics();
  }
}

// Auto-start performance monitoring
if (typeof window !== 'undefined') {
  MonitoringService.startPerformanceObserver();
  
  // Periodic health checks
  setInterval(() => {
    MonitoringService.performHealthCheck();
  }, 5 * 60 * 1000); // Every 5 minutes
}
