import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './logger';
import { addBreadcrumb, setTag, setContext } from './sentry';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  path: string;
  method: string;
  statusCode?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  fast: 100,        // <100ms: Excellent
  acceptable: 500,  // 100-500ms: Good
  slow: 1000,       // 500-1000ms: Acceptable
  critical: 2000,   // >2000ms: Critical
};

/**
 * Calculate performance tier based on duration
 */
function getPerformanceTier(duration: number): string {
  if (duration < PERFORMANCE_THRESHOLDS.fast) return 'excellent';
  if (duration < PERFORMANCE_THRESHOLDS.acceptable) return 'good';
  if (duration < PERFORMANCE_THRESHOLDS.slow) return 'acceptable';
  if (duration < PERFORMANCE_THRESHOLDS.critical) return 'slow';
  return 'critical';
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Middleware to track request performance
 */
export function withPerformanceMonitoring(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any> | any
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
      path: req.url || 'unknown',
      method: req.method || 'unknown',
    };

    // Capture initial resource usage
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();

    // Add performance breadcrumb
    addBreadcrumb({
      category: 'performance',
      message: `Request started: ${metrics.method} ${metrics.path}`,
      level: 'info',
      data: {
        path: metrics.path,
        method: metrics.method,
      },
    });

    try {
      // Execute handler
      const result = await handler(req, res);

      // Calculate metrics
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.memoryUsage = process.memoryUsage();
      metrics.cpuUsage = process.cpuUsage(initialCpu);

      // Extract status code if available
      if (res.statusCode) {
        metrics.statusCode = res.statusCode;
      }

      // Log performance metrics
      const tier = getPerformanceTier(metrics.duration);
      const memoryDelta = metrics.memoryUsage.heapUsed - initialMemory.heapUsed;

      // Set Sentry tags
      setTag('performance.tier', tier);
      setTag('performance.duration', metrics.duration.toString());

      // Set Sentry context
      setContext('performance', {
        duration: metrics.duration,
        tier,
        memoryUsed: formatBytes(metrics.memoryUsage.heapUsed),
        memoryDelta: formatBytes(memoryDelta),
        cpuUser: metrics.cpuUsage.user,
        cpuSystem: metrics.cpuUsage.system,
      });

      // Log based on performance tier
      if (tier === 'critical' || tier === 'slow') {
        logger.warn('Slow request detected', {
          path: metrics.path,
          method: metrics.method,
          duration: metrics.duration,
          tier,
          statusCode: metrics.statusCode,
          memoryUsed: formatBytes(metrics.memoryUsage.heapUsed),
          memoryDelta: formatBytes(memoryDelta),
        });
      } else if (tier === 'acceptable') {
        logger.debug('Request completed', {
          path: metrics.path,
          method: metrics.method,
          duration: metrics.duration,
          tier,
          statusCode: metrics.statusCode,
        });
      } else {
        logger.debug('Fast request', {
          path: metrics.path,
          duration: metrics.duration,
          tier,
        });
      }

      // Add completion breadcrumb
      addBreadcrumb({
        category: 'performance',
        message: `Request completed: ${metrics.duration}ms (${tier})`,
        level: tier === 'critical' ? 'warning' : 'info',
        data: {
          duration: metrics.duration,
          tier,
          statusCode: metrics.statusCode,
        },
      });

      return result;
    } catch (error) {
      // Track failed request performance
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;

      logger.error('Request failed', {
        path: metrics.path,
        method: metrics.method,
        duration: metrics.duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}

/**
 * Get current performance snapshot
 */
export function getPerformanceSnapshot(): {
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  uptime: number;
} {
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
  };
}

/**
 * Format performance snapshot for logging
 */
export function formatPerformanceSnapshot(snapshot: {
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  uptime: number;
}): Record<string, any> {
  return {
    memory: {
      heapUsed: formatBytes(snapshot.memory.heapUsed),
      heapTotal: formatBytes(snapshot.memory.heapTotal),
      rss: formatBytes(snapshot.memory.rss),
      external: formatBytes(snapshot.memory.external),
    },
    cpu: {
      user: `${(snapshot.cpu.user / 1000).toFixed(2)}ms`,
      system: `${(snapshot.cpu.system / 1000).toFixed(2)}ms`,
    },
    uptime: `${snapshot.uptime.toFixed(2)}s`,
  };
}

/**
 * Check if performance is degraded
 */
export function isPerformanceDegraded(metrics: PerformanceMetrics): boolean {
  if (!metrics.duration) return false;
  return metrics.duration > PERFORMANCE_THRESHOLDS.slow;
}

/**
 * Get performance recommendations
 */
export function getPerformanceRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.duration && metrics.duration > PERFORMANCE_THRESHOLDS.critical) {
    recommendations.push('Critical: Request took over 2 seconds. Consider caching or optimization.');
  }

  if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > 100 * 1024 * 1024) {
    recommendations.push('High memory usage detected (>100MB). Check for memory leaks.');
  }

  if (metrics.cpuUsage && (metrics.cpuUsage.user + metrics.cpuUsage.system) > 1000000) {
    recommendations.push('High CPU usage detected. Consider optimizing heavy computations.');
  }

  return recommendations;
}

export { PERFORMANCE_THRESHOLDS };
