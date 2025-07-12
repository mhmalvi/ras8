
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
   * Create master admin account with special handling
   */
  static async createMasterAdmin() {
    try {
      // First, try to sign up the master admin with email confirmation disabled for this specific case
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'aalvi.hm@gmail.com',
        password: '90989098',
        user_metadata: {
          first_name: 'Master',
          last_name: 'Admin'
        },
        email_confirm: true // Auto-confirm the email
      });

      if (error) {
        console.error('Error creating master admin user:', error);
        // If admin.createUser fails, try regular signup
        return await this.signUp('aalvi.hm@gmail.com', '90989098', 'Master', 'Admin');
      }

      // Now create the profile using the service role (bypassing RLS)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              role: 'master_admin',
              first_name: 'Master',
              last_name: 'Admin',
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Error creating master admin profile:', profileError);
          } else {
            console.log('✅ Master admin profile created successfully');
          }
        } catch (err) {
          console.error('Error in profile creation:', err);
        }
      }

      return data;
    } catch (error) {
      console.error('Error in createMasterAdmin:', error);
      // Fallback to regular signup
      return await this.signUp('aalvi.hm@gmail.com', '90989098', 'Master', 'Admin');
    }
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string) {
    // First try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // If sign in fails and this is the master admin email, try to create the account
    if (error && email === 'aalvi.hm@gmail.com' && password === '90989098') {
      console.log('Master admin account not found, creating it...');
      
      try {
        // Create the master admin account with special handling
        await this.createMasterAdmin();
        
        // Wait a moment for the account to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now try to sign in again
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          throw new Error(signInError.message);
        }
        
        return signInData;
      } catch (signUpError) {
        console.error('Error creating master admin account:', signUpError);
        throw new Error(error.message);
      }
    }

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
