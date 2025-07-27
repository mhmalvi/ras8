
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedAuthService, AuthState } from '@/services/enhancedAuthService';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;

        // Update state synchronously
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle post-auth actions asynchronously
        if (session?.user && event === 'SIGNED_IN') {
          // Defer profile creation/update to avoid deadlock
          setTimeout(async () => {
            try {
              await ensureUserProfile(session.user);
            } catch (error) {
              console.error('Profile creation error:', error);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const session = await EnhancedAuthService.getCurrentSession();
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const ensureUserProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'merchant_staff'
          });

        if (error) {
          console.error('Profile creation error:', error);
        } else {
          console.log('✅ Profile created for user:', user.email);
        }
      }
    } catch (error) {
      console.error('Profile check error:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await EnhancedAuthService.signIn(email, password);
    return result;
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const result = await EnhancedAuthService.signUp(email, password, firstName, lastName);
    return result;
  };

  // Legacy methods for backward compatibility
  const signInWithEmail = async (email: string, password: string) => {
    const result = await EnhancedAuthService.signIn(email, password);
    return { error: result.success ? null : new Error(result.error) };
  };

  const signUpWithEmail = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const result = await EnhancedAuthService.signUp(email, password, firstName, lastName);
    return { error: result.success ? null : new Error(result.error) };
  };

  const signOut = async () => {
    const result = await EnhancedAuthService.signOut();
    if (result.success) {
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    return await EnhancedAuthService.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    return await EnhancedAuthService.updatePassword(newPassword);
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
      } else if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Session refresh exception:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    signInWithEmail,
    signUpWithEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

