
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./utils/serviceWorkerRegistration";

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
    <App />
  </StrictMode>
);
