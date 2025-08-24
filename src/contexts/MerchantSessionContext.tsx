import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

  const validateSession = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/session/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
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