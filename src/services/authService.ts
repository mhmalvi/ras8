
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export class AuthService {
  /**
   * Sign up new user
   */
  static async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName || '',
          last_name: lastName || ''
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string) {
    console.log('🔐 Sign in attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Sign in successful for:', email);
    
    // Ensure profile exists for this user (for legacy users who might not have profiles)
    if (data.user) {
      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('⚠️ Error checking profile existence:', profileError);
        }
        
        // If no profile exists, create one
        if (!existingProfile) {
          console.log('🔧 Creating missing profile for user:', data.user.email);
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              first_name: data.user.user_metadata?.first_name || null,
              last_name: data.user.user_metadata?.last_name || null,
              role: 'merchant_admin'
            });
            
          if (createError) {
            console.error('❌ Failed to create profile:', createError);
            // Don't throw here - user should still be able to sign in
          } else {
            console.log('✅ Profile created successfully for:', data.user.email);
          }
        }
      } catch (profileErr) {
        console.error('❌ Profile check/creation failed:', profileErr);
        // Don't throw here - user should still be able to sign in
      }
    }
    
    return data;
  }

  /**
   * Sign out user
   */
  static async signOut() {
    // Preserve embedded context before logout
    let embeddedContext = null;
    try {
      const lastDecision = localStorage.getItem('last_landing_decision');
      if (lastDecision) {
        const decision = JSON.parse(lastDecision);
        if (decision.context?.isEmbedded && decision.context?.shopDomain) {
          embeddedContext = {
            shopDomain: decision.context.shopDomain,
            isEmbedded: decision.context.isEmbedded,
            preservedAt: new Date().toISOString()
          };
          console.log('💾 Preserving embedded context for re-login:', embeddedContext);
        }
      }
    } catch (e) {
      console.warn('Could not preserve embedded context:', e);
    }

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    // Restore preserved embedded context after logout
    if (embeddedContext) {
      localStorage.setItem('preserved_embedded_context', JSON.stringify(embeddedContext));
      console.log('✅ Embedded context preserved for next login');
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
