import * as Sentry from '@sentry/react';

// Initialize Sentry for production error monitoring
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (import.meta.env.PROD && sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out expected errors
        const error = hint.originalException as Error;
        if (error?.name === 'ChunkLoadError') {
          return null; // Don't send chunk load errors
        }
        
        // Add user context if available
        const user = getCurrentUser();
        if (user) {
          event.user = {
            id: user.id,
            email: user.email,
          };
        }
        
        return event;
      },
      
      // Environment detection
      environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
      
      // Release tracking
      release: '1.0.0', // Update this with your actual version
    });
  }
};

// Helper function to get current user (implement based on your auth system)
const getCurrentUser = () => {
  // Return current user from your auth context
  return null; // Placeholder
};

// Custom error boundary component with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Manual error reporting utilities
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;