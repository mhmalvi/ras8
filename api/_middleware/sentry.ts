import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';

let sentryInitialized = false;

/**
 * Initialize Sentry for backend error tracking
 */
export function initSentry(): void {
  // Only initialize once
  if (sentryInitialized) {
    return;
  }

  // Skip initialization if no DSN is provided
  if (!SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Set sample rate based on environment
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Performance monitoring
    profilesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Don't send errors in test environment
    enabled: SENTRY_ENVIRONMENT !== 'test',

    // Integrations
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      new Sentry.Integrations.Http({ tracing: true }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-shopify-hmac-sha256'];
      }

      // Remove sensitive query parameters
      if (event.request?.query_string) {
        const sanitized = event.request.query_string
          .replace(/hmac=[^&]*/g, 'hmac=REDACTED')
          .replace(/code=[^&]*/g, 'code=REDACTED')
          .replace(/state=[^&]*/g, 'state=REDACTED')
          .replace(/token=[^&]*/g, 'token=REDACTED');
        event.request.query_string = sanitized;
      }

      return event;
    },
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized for', SENTRY_ENVIRONMENT);
}

/**
 * Capture exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message to Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Add breadcrumb to Sentry
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set tag for Sentry event
 */
export function setTag(key: string, value: string): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Set context for Sentry event
 */
export function setContext(name: string, context: Record<string, any>): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.setContext(name, context);
}

/**
 * Flush Sentry events (useful for serverless functions)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!SENTRY_DSN) {
    return true;
  }

  return await Sentry.flush(timeout);
}

// Auto-initialize on import
initSentry();

export { Sentry };
