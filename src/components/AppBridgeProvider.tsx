
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logEnvironmentStatus } from '@/utils/environmentCheck';

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
        // Log environment status for debugging
        logEnvironmentStatus();
        
        // Add small delay to ensure URL params are available (fixes React StrictMode race condition)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we're running inside Shopify Admin
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const shop = urlParams.get('shop');
        
        // Don't initialize App Bridge on installation pages
        const isInstallationPage = window.location.pathname.includes('/install') || 
                                   window.location.pathname.includes('/auth/');
        
        if ((host || shop) && !isInstallationPage) {
          setIsEmbedded(true);
          
          // Use the configured Shopify Client ID from environment
          const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
          
          if (!clientId) {
            console.error('Missing VITE_SHOPIFY_CLIENT_ID environment variable');
            throw new Error('Shopify Client ID not configured');
          }
          
          // Dynamically import App Bridge
          const { default: createApp } = await import('@shopify/app-bridge');
          
          // Validate and construct host parameter
          let validHost = host;
          if (!validHost && shop) {
            // Ensure shop has .myshopify.com domain
            const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
            validHost = btoa(`admin.shopify.com/store/${shop.replace('.myshopify.com', '')}`).replace(/=/g, '');
            console.log('🔧 Constructed host from shop:', { shop, shopDomain, host: validHost });
          }
          
          if (!validHost) {
            console.warn('⚠️ No valid host parameter available, might not be embedded');
            setIsEmbedded(false);
            return;
          }
          
          console.log('🚀 Initializing App Bridge:', { clientId, host: validHost, shop });
          
          const appBridge = createApp({
            apiKey: clientId,
            host: validHost,
            forceRedirect: true, // Ensure proper redirection handling
            development: import.meta.env.DEV, // Enable development mode for debugging
          });

          // Set up comprehensive error handling
          appBridge.subscribe('APP::ERROR', (error: any) => {
            console.error('App Bridge Error:', error);
            // Don't throw errors that would break the app
          });

          // Handle authentication errors gracefully
          appBridge.subscribe('APP::AUTH_ERROR', (error: any) => {
            console.error('App Bridge Auth Error:', error);
            // Redirect to OAuth if auth fails
            const currentShop = new URLSearchParams(window.location.search).get('shop');
            if (currentShop) {
              // Ensure shop domain has .myshopify.com suffix
              const shopDomain = currentShop.includes('.myshopify.com') 
                ? currentShop 
                : `${currentShop}.myshopify.com`;
              window.location.href = `/auth/start?shop=${encodeURIComponent(shopDomain)}&host=${encodeURIComponent(validHost)}`;
            }
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
