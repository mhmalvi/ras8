import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RATE_LIMITS } from '../_middleware/rateLimit';
import { withErrorHandler } from '../_middleware/errorHandler';
import { logger } from '../_middleware/logger';
import { getPerformanceSnapshot, formatPerformanceSnapshot } from '../_middleware/performanceMonitoring';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check database connectivity
 */
async function checkDatabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      status: 'unconfigured',
      message: 'Database credentials not configured',
      responseTime: 0
    };
  }

  try {
    const startTime = Date.now();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'error',
        message: error.message,
        code: error.code,
        responseTime
      };
    }

    return {
      status: 'healthy',
      responseTime,
      connectionTest: 'passed'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      responseTime: 0
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  const required = {
    VITE_APP_URL: process.env.VITE_APP_URL,
    VITE_SHOPIFY_CLIENT_ID: process.env.VITE_SHOPIFY_CLIENT_ID,
    SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  };

  const optional = {
    SENTRY_DSN: process.env.SENTRY_DSN,
    VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN,
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,
  };

  const missing = [];
  const configured = {};

  // Check required variables
  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
      configured[key] = 'NOT_SET';
    } else {
      configured[key] = 'SET';
    }
  });

  // Check optional variables
  Object.entries(optional).forEach(([key, value]) => {
    configured[key] = value ? 'SET' : 'NOT_SET';
  });

  return {
    status: missing.length === 0 ? 'healthy' : 'degraded',
    configured,
    missing,
    requiredCount: Object.keys(required).length,
    configuredCount: Object.keys(required).filter(k => required[k]).length,
  };
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const snapshot = getPerformanceSnapshot();
  const formatted = formatPerformanceSnapshot(snapshot);

  return {
    memory: {
      heapUsed: formatted.memory.heapUsed,
      heapTotal: formatted.memory.heapTotal,
      rss: formatted.memory.rss,
      external: formatted.memory.external,
      heapUsedPercent: ((snapshot.memory.heapUsed / snapshot.memory.heapTotal) * 100).toFixed(2) + '%',
    },
    cpu: {
      user: formatted.cpu.user,
      system: formatted.cpu.system,
    },
    uptime: formatted.uptime,
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
}

/**
 * Main health check handler
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Get detailed parameter (optional)
    const detailed = req.query.detailed === 'true';

    // Perform health checks
    const [dbHealth, envHealth] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkEnvironment()),
    ]);

    // Determine overall health status
    let overallStatus = 'healthy';
    const issues = [];

    if (dbHealth.status === 'error') {
      overallStatus = 'degraded';
      issues.push('Database connection failed');
    } else if (dbHealth.status === 'unconfigured') {
      overallStatus = 'degraded';
      issues.push('Database not configured');
    }

    if (envHealth.status === 'degraded') {
      overallStatus = 'degraded';
      issues.push(`Missing ${envHealth.missing.length} required environment variable(s)`);
    }

    // Build health response
    const healthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          ...(dbHealth.status === 'error' && { error: dbHealth.message }),
        },
        environment: {
          status: envHealth.status,
          required: `${envHealth.configuredCount}/${envHealth.requiredCount}`,
          ...(envHealth.missing.length > 0 && { missing: envHealth.missing }),
        },
      },
      ...(issues.length > 0 && { issues }),
    };

    // Add detailed information if requested
    if (detailed) {
      healthResponse.details = {
        environment: envHealth.configured,
        system: getSystemMetrics(),
        endpoints: {
          oauth_callback: '/api/auth/callback',
          oauth_start: '/api/auth/start',
          session_validation: '/api/session/me',
          session_validate: '/api/session/validate',
          token_refresh: '/api/auth/refresh-token',
          returns_api: '/api/v1/returns',
          metrics_api: '/api/v1/metrics/summary',
          health_check: '/api/health',
        },
        routes: {
          app_handle: '/apps/ras',
          auth_inline: '/auth/inline',
          dashboard: '/dashboard',
          onboarding: '/onboarding',
        },
      };
    }

    // Log health check
    logger.debug('Health check completed', {
      status: overallStatus,
      responseTime: healthResponse.responseTime,
      dbStatus: dbHealth.status,
      envStatus: envHealth.status,
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(healthResponse);

  } catch (error) {
    logger.error('Health check error', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });
  }
}

// Export handler with rate limiting and error handling
export default withRateLimit(RATE_LIMITS.health, withErrorHandler(handler));
