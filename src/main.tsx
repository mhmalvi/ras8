
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AtomicAppRouter from "./components/AtomicAppRouter.tsx";
import "./index.css";
import { registerSW } from "./utils/serviceWorkerRegistration";
import { initSentry } from "./utils/sentry";
import { initializeInteractivityFixes } from "./utils/interactivityFix";

// Initialize Sentry for error monitoring
initSentry();

// Initialize UI interactivity fixes
initializeInteractivityFixes();

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
