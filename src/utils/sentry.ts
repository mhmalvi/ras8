import * as Sentry from '@sentry/react';

// Initialize Sentry for production error monitoring
export const initSentry = () => {
  // Sentry will be configured via environment variables at deployment time
  // This avoids using VITE_ variables which are not supported in Lovable
  
  const isProduction = window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('lovable.app');
  
  if (isProduction) {
    // Sentry configuration would be handled at deployment time
    // through environment variables managed by the hosting provider
    // Sentry would be initialized in production
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