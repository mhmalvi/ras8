
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AtomicAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAtomicAuth = () => {
  const context = useContext(AtomicAuthContext);
  if (context === undefined) {
    throw new Error('useAtomicAuth must be used within an AtomicAuthProvider');
  }
  return context;
};

interface AtomicAuthProviderProps {
  children: ReactNode;
}

export const AtomicAuthProvider = ({ children }: AtomicAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔐 Auth state changed:', event, session?.user?.email || 'no user');
            
            if (isMounted) {
              setSession(session);
              setUser(session?.user ?? null);
              setError(null);
              
              // Only set loading to false after first auth event
              if (!initialized) {
                setInitialized(true);
                setLoading(false);
              }
            }
          }
        );

        // Then check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          if (isMounted) {
            setError(sessionError.message);
            setInitialized(true);
            setLoading(false);
          }
        } else {
          console.log('📋 Initial session check:', session?.user?.email || 'no session');
          if (isMounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setInitialized(true);
            setLoading(false);
          }
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('💥 Auth initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Authentication initialization failed');
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Sign in attempt for:', email);
      
      const data = await AuthService.signIn(email, password);
      
      if (data.user) {
        console.log('✅ Authentication successful');
      }
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      setLoading(false);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Sign up attempt for:', email);
      
      const data = await AuthService.signUp(email, password, firstName, lastName);
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      setLoading(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('🔐 Signing out...');
      await AuthService.signOut();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    error,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AtomicAuthContext.Provider value={value}>
      {children}
    </AtomicAuthContext.Provider>
  );
};
