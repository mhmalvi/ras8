
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AtomicAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    initialized: false
  });

  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  // Atomic state updater to prevent race conditions
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return;
    
    setAuthState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      console.log('🔄 Initializing atomic auth state...');
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session initialization error:', error);
        updateAuthState({
          user: null,
          session: null,
          loading: false,
          error: error.message,
          initialized: true
        });
        return;
      }

      console.log('✅ Initial session loaded:', !!session);
      updateAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
        initialized: true
      });

    } catch (error) {
      console.error('💥 Auth initialization failed:', error);
      updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        initialized: true
      });
    } finally {
      initializingRef.current = false;
    }
  }, [updateAuthState]);

  const refreshAuth = useCallback(async () => {
    console.log('🔄 Refreshing auth state...');
    updateAuthState({ loading: true, error: null });
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      updateAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('❌ Auth refresh failed:', error);
      updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      });
    }
  }, [updateAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    updateAuthState({ loading: true, error: null });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      updateAuthState({ loading: false, error: error.message });
    }
    
    return { error };
  }, [updateAuthState]);

  const signUp = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    updateAuthState({ loading: true, error: null });
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    
    if (error) {
      updateAuthState({ loading: false, error: error.message });
    }
    
    return { error };
  }, [updateAuthState]);

  const signOut = useCallback(async () => {
    updateAuthState({ loading: true, error: null });
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
      updateAuthState({ loading: false, error: error.message });
    }
  }, [updateAuthState]);

  const clearError = useCallback(() => {
    updateAuthState({ error: null });
  }, [updateAuthState]);

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, !!session);
        
        // Handle auth events atomically
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            updateAuthState({
              user: session?.user ?? null,
              session,
              loading: false,
              error: null,
              initialized: true
            });
            break;
            
          case 'SIGNED_OUT':
            updateAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
              initialized: true
            });
            break;
            
          case 'USER_UPDATED':
            updateAuthState({
              user: session?.user ?? null,
              session,
              error: null
            });
            break;
            
          default:
            // For other events, just update session
            updateAuthState({
              user: session?.user ?? null,
              session,
              initialized: true
            });
        }
      }
    );

    // Initialize auth state
    initializeAuth();

    return () => {
      mounted = false;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, updateAuthState]);

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshAuth,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAtomicAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAtomicAuth must be used within an AtomicAuthProvider');
  }
  return context;
};
