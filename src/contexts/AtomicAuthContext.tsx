
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔐 Auth state changed:', event, session?.user?.email);
            
            if (isMounted) {
              setSession(session);
              setUser(session?.user ?? null);
            }

            // For master admin, ensure profile is set up correctly
            if (session?.user?.email === 'aalvi.hm@gmail.com' && event === 'SIGNED_IN') {
              setTimeout(async () => {
                try {
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                      id: session.user.id,
                      email: session.user.email!,
                      role: 'master_admin',
                      first_name: session.user.user_metadata?.first_name || 'Master',
                      last_name: session.user.user_metadata?.last_name || 'Admin',
                      updated_at: new Date().toISOString()
                    });

                  if (profileError) {
                    console.error('Error updating master admin profile:', profileError);
                  }
                } catch (err) {
                  console.error('Error in profile update:', err);
                }
              }, 0);
            }
          }
        );

        // Then check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (isMounted) {
          setInitialized(true);
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
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
      const data = await AuthService.signIn(email, password);
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setError(null);
      const data = await AuthService.signUp(email, password, firstName, lastName);
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
    } catch (error) {
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
