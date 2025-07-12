
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
   * Sign in user with improved master admin handling
   */
  static async signIn(email: string, password: string) {
    // For master admin, try direct sign in first
    if (email === 'aalvi.hm@gmail.com') {
      console.log('🔐 Master admin login attempt');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // If successful, return immediately
      if (!error && data.user) {
        console.log('✅ Master admin signed in successfully');
        return data;
      }

      // If the error is invalid credentials and this is master admin with the specific password
      if (error && error.message.includes('Invalid login credentials') && password === '90989098') {
        console.log('🔐 Master admin account not found, creating it...');
        
        try {
          // Create the master admin account
          const signUpResult = await this.signUp(email, password, 'Master', 'Admin');
          
          if (signUpResult.user) {
            console.log('✅ Master admin account created successfully');
            
            // Wait a bit longer for the account to be fully processed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try to sign in again
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              console.error('❌ Error signing in after master admin creation:', signInError);
              // Return the signup result if sign-in still fails
              return signUpResult;
            }
            
            console.log('✅ Master admin signed in after creation');
            return signInData;
          }
        } catch (signUpError) {
          console.error('❌ Error creating master admin account:', signUpError);
          throw new Error(error.message);
        }
      }

      if (error) {
        throw new Error(error.message);
      }
    }

    // Regular user sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign out user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
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
