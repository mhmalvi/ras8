
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppBridgeContextType {
  app: any;
  isEmbedded: boolean;
  loading: boolean;
}

const AppBridgeContext = createContext<AppBridgeContextType | null>(null);

export const useAppBridge = () => {
  const context = useContext(AppBridgeContext);
  if (!context) {
    throw new Error('useAppBridge must be used within AppBridgeProvider');
  }
  return context;
};

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export const AppBridgeProvider: React.FC<AppBridgeProviderProps> = ({ children }) => {
  const [app, setApp] = useState<any>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAppBridge = async () => {
      try {
        // Check if we're running inside Shopify Admin
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const shop = urlParams.get('shop');
        
        if (host || shop) {
          setIsEmbedded(true);
          
          // Dynamically import App Bridge
          const { default: createApp } = await import('@shopify/app-bridge');
          const { default: { Modal, TitleBar } } = await import('@shopify/app-bridge/actions');
          
          const appBridge = createApp({
            apiKey: process.env.REACT_APP_SHOPIFY_CLIENT_ID || 'your-client-id',
            host: host || btoa(shop + '/admin').replace(/=/g, ''),
          });

          // Set up global error handling
          appBridge.subscribe('APP::ERROR', (error: any) => {
            console.error('App Bridge Error:', error);
          });

          setApp(appBridge);
        } else {
          setIsEmbedded(false);
        }
      } catch (error) {
        console.error('Failed to initialize App Bridge:', error);
        setIsEmbedded(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAppBridge();
  }, []);

  const value = {
    app,
    isEmbedded,
    loading
  };

  return (
    <AppBridgeContext.Provider value={value}>
      {children}
    </AppBridgeContext.Provider>
  );
};
