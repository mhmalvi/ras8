import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';

interface MerchantSessionData {
  merchantId: string;
  shopDomain: string;
  sessionId: string;
  expiresAt: string;
}

interface MerchantSessionContextType {
  session: MerchantSessionData | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const MerchantSessionContext = createContext<MerchantSessionContextType | undefined>(undefined);

interface MerchantSessionProviderProps {
  children: ReactNode;
}

export function MerchantSessionProvider({ children }: MerchantSessionProviderProps) {
  const [session, setSession] = useState<MerchantSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get App Bridge session token
  const getAppBridgeSessionToken = async (): Promise<string | null> => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      const host = urlParams.get('host');

      if (!shop || !host) {
        console.log('Missing shop or host parameters for App Bridge');
        return null;
      }

      const app = createApp({
        apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID!,
        host: host,
        forceRedirect: true
      });

      const sessionToken = await getSessionToken(app);
      console.log('✅ App Bridge session token obtained');
      return sessionToken;
    } catch (error) {
      console.error('❌ Failed to get App Bridge session token:', error);
      return null;
    }
  };

  const validateSession = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get session token from App Bridge
      const sessionToken = await getAppBridgeSessionToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add session token if available
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      // Also add shop parameter from URL
      const shop = new URLSearchParams(window.location.search).get('shop');
      if (shop) {
        headers['Shop'] = shop;
      }

      const response = await fetch('/api/session/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers
      });

      const data = await response.json();

      if (response.ok && data.authenticated) {
        setSession(data.session);
      } else {
        setSession(null);
        if (response.status !== 401) {
          setError(data.error || 'Session validation failed');
        }
      }
    } catch (err) {
      console.error('❌ Session validation error:', err);
      setSession(null);
      setError('Failed to validate session');
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    await validateSession();
  };

  const clearSession = (): void => {
    setSession(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    validateSession();
  }, []);

  const contextValue: MerchantSessionContextType = {
    session,
    isAuthenticated: !!session,
    loading,
    error,
    refreshSession,
    clearSession
  };

  return (
    <MerchantSessionContext.Provider value={contextValue}>
      {children}
    </MerchantSessionContext.Provider>
  );
}

export function useMerchantSession(): MerchantSessionContextType {
  const context = useContext(MerchantSessionContext);
  if (context === undefined) {
    throw new Error('useMerchantSession must be used within a MerchantSessionProvider');
  }
  return context;
}