
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AtomicAppRouter from "./components/AtomicAppRouter.tsx";
import "./index.css";
import { registerSW } from "./utils/serviceWorkerRegistration";
import { initSentry } from "./utils/sentry";

// Initialize Sentry for error monitoring
initSentry();

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
