import * as Sentry from '@sentry/react';
import React from 'react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.MODE || 'development';

let sentryInitialized = false;

/**
 * Initialize Sentry for frontend error tracking
 */
export function initSentry(): void {
  // Only initialize once
  if (sentryInitialized) {
    return;
  }

  // Skip initialization if no DSN is provided
  if (!SENTRY_DSN) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Set sample rate based on environment
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,

    // Don't send errors in development unless explicitly enabled
    enabled: SENTRY_ENVIRONMENT === 'production' || import.meta.env.VITE_SENTRY_ENABLED === 'true',

    // Integrations
    integrations: [
      // Browser tracing
      Sentry.browserTracingIntegration({
        // Track all navigation and routing
        enableLongTask: true,
        enableInp: true,
      }),

      // Session replay for debugging
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),

      // React profiler
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
      }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          // Sanitize URLs
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = breadcrumb.data.url
              .replace(/hmac=[^&]*/g, 'hmac=REDACTED')
              .replace(/code=[^&]*/g, 'code=REDACTED')
              .replace(/state=[^&]*/g, 'state=REDACTED')
              .replace(/token=[^&]*/g, 'token=REDACTED');
          }

          // Sanitize request/response data
          if (breadcrumb.data?.response) {
            delete breadcrumb.data.response;
          }

          return breadcrumb;
        });
      }

      // Remove sensitive request data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }

        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/hmac=[^&]*/g, 'hmac=REDACTED')
            .replace(/code=[^&]*/g, 'code=REDACTED')
            .replace(/state=[^&]*/g, 'state=REDACTED')
            .replace(/token=[^&]*/g, 'token=REDACTED');
        }
      }

      return event;
    },
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized for frontend:', SENTRY_ENVIRONMENT);
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
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
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
export function setContext(name: string, context: Record<string, any> | null): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.setContext(name, context);
}

/**
 * Create error boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;
export const SentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Wrap component with profiler
 */
export const withProfiler = Sentry.withProfiler;

export { Sentry };
