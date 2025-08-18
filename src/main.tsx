
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AtomicAppRouter from "./components/AtomicAppRouter.tsx";
import "./index.css";
import { registerSW } from "./utils/serviceWorkerRegistration";
import { initSentry } from "./utils/sentry";
import { initializeInteractivityFixes } from "./utils/interactivityFix";
import { validateEnvironmentOrThrow, getEnvironmentReport } from "./utils/envValidation";
import { startHealthMonitoring } from "./utils/healthCheck";

// Validate environment before starting the app
try {
  validateEnvironmentOrThrow('client');
  console.log('✅ H5 App - Environment validation passed');
  
  // Log environment report in development
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log(getEnvironmentReport());
  }
} catch (error) {
  console.error('❌ H5 App - Environment validation failed:', error);
  // In production, we might want to show a user-friendly error page
  if (import.meta.env.VITE_DEV_MODE !== 'true') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; font-family: Arial, sans-serif;">
        <div style="text-align: center; max-width: 600px; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="color: #64748b; margin-bottom: 2rem;">The H5 app is not properly configured. Please contact your administrator.</p>
          <p style="color: #64748b; font-size: 0.875rem;">Error: ${error.message}</p>
        </div>
      </div>
    `;
    throw error;
  }
}

// Initialize Sentry for error monitoring
initSentry();

// Initialize UI interactivity fixes
initializeInteractivityFixes();

// Start health monitoring in development
if (import.meta.env.VITE_DEV_MODE === 'true') {
  startHealthMonitoring(300000); // Check every 5 minutes
}

// Comprehensive console override to suppress Shopify platform noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Function to check if a message should be suppressed
const shouldSuppressMessage = (args: any[]) => {
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg && typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join(' ');

  return message.includes('WebSocket connection') ||
         message.includes('argus.shopifycloud.com') ||
         message.includes('SendBeacon failed') ||
         message.includes('context-slice-metrics') ||
         message.includes('shopifycloud/web/assets') ||
         message.includes('render-common-') ||
         message.includes('C.closeWebsocket') ||
         message.includes('C.close @') ||
         message.includes('C.connect @') ||
         message.includes('C.tryReconnect @') ||
         message.includes('C.checkMaxConnectTimeout @') ||
         message.includes('C.executeOperation @') ||
         message.includes('context-slice-graphql') ||
         message.includes('WebSocket is closed before the connection is established');
};

console.error = (...args) => {
  if (!shouldSuppressMessage(args)) {
    originalConsoleError.apply(console, args);
  }
};

console.warn = (...args) => {
  if (!shouldSuppressMessage(args)) {
    originalConsoleWarn.apply(console, args);
  }
};

console.log = (...args) => {
  if (!shouldSuppressMessage(args)) {
    originalConsoleLog.apply(console, args);
  }
};

// Global error handler to suppress Shopify platform errors
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('SendBeacon failed') ||
      event.error?.stack?.includes('context-slice-metrics') ||
      event.error?.stack?.includes('shopifycloud/web/assets') ||
      event.error?.message?.includes('WebSocket connection') ||
      event.error?.message?.includes('argus.shopifycloud.com') ||
      event.filename?.includes('shopifycloud/web/assets') ||
      event.filename?.includes('render-common-')) {
    event.preventDefault();
    return;
  }
});

// Handle unhandled promise rejections from Shopify platform
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('SendBeacon failed') ||
      event.reason?.stack?.includes('context-slice-metrics') ||
      event.reason?.stack?.includes('shopifycloud/web/assets') ||
      event.reason?.message?.includes('WebSocket connection') ||
      event.reason?.message?.includes('argus.shopifycloud.com')) {
    event.preventDefault();
    return;
  }
});

// Register service worker for caching
registerSW({
  onSuccess: () => {
    console.log('✅ Service Worker: App cached for offline use');
  },
  onUpdate: () => {
    console.log('🔄 Service Worker: New version available, please refresh');
    // You could show a toast notification here
  }
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <AtomicAppRouter />
  </StrictMode>
);
