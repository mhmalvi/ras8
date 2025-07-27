import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { signUpSchema, signInSchema, validateRequest } from '@/schemas/validationSchemas';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
}

/**
 * Enhanced Authentication Service with JWT token rotation and validation
 */
export class EnhancedAuthService {
  private static refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Sign up new user with input validation
   */
  static async signUp(
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<AuthResult> {
    try {
      // Validate input data
      const validation = validateRequest(signUpSchema, {
        email,
        password,
        firstName,
        lastName
      });

      if (!validation.success) {
        return {
          success: false,
          error: 'errors' in validation ? validation.errors.join(', ') : 'Validation failed'
        };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: validation.data.firstName || '',
            last_name: validation.data.lastName || ''
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Setup token refresh if session exists
      if (data.session) {
        this.setupTokenRefresh(data.session);
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  }

  /**
   * Sign in user with input validation
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Validate input data
      const validation = validateRequest(signInSchema, { email, password });

      if (!validation.success) {
        return {
          success: false,
          error: 'errors' in validation ? validation.errors.join(', ') : 'Validation failed'
        };
      }

      console.log('🔐 Sign in attempt for:', validation.data.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Sign in successful for:', validation.data.email);

      // Setup token refresh
      if (data.session) {
        this.setupTokenRefresh(data.session);
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Sign out user and cleanup token refresh
   */
  static async signOut(): Promise<AuthResult> {
    try {
      // Clear token refresh timer
      this.clearTokenRefresh();

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  /**
   * Setup automatic token refresh
   */
  private static setupTokenRefresh(session: Session): void {
    // Clear any existing timer
    this.clearTokenRefresh();

    // Calculate refresh time (15 minutes before expiry)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
    const refreshTime = expiresAt - Date.now() - (15 * 60 * 1000); // 15 minutes before expiry

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          console.log('🔄 Refreshing token...');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('❌ Token refresh failed:', error.message);
            // Force sign out on refresh failure
            await this.signOut();
            return;
          }

          if (data.session) {
            console.log('✅ Token refreshed successfully');
            // Setup next refresh
            this.setupTokenRefresh(data.session);
          }
        } catch (error) {
          console.error('💥 Token refresh exception:', error);
        }
      }, refreshTime);

      console.log(`⏰ Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);
    }
  }

  /**
   * Clear token refresh timer
   */
  private static clearTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get current session with validation
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      // Check if token is expired
      if (session && session.expires_at) {
        const expiresAt = session.expires_at * 1000;
        if (Date.now() >= expiresAt) {
          console.warn('⚠️ Session token expired, attempting refresh...');
          const { data: refreshData } = await supabase.auth.refreshSession();
          return refreshData.session;
        }
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get current user with session validation
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.getCurrentSession();
      return session?.user ?? null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Reset password with validation
   */
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      const validation = validateRequest(
        signInSchema.pick({ email: true }), 
        { email }
      );

      if (!validation.success) {
        return {
          success: false,
          error: 'errors' in validation ? validation.errors.join(', ') : 'Validation failed'
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  /**
   * Update user password with validation
   */
  static async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const validation = validateRequest(
        signUpSchema.pick({ password: true }), 
        { password: newPassword }
      );

      if (!validation.success) {
        return {
          success: false,
          error: 'errors' in validation ? validation.errors.join(', ') : 'Validation failed'
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: validation.data.password
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password update failed'
      };
    }
  }

  /**
   * Validate session strength and security
   */
  static validateSessionSecurity(session: Session | null): {
    isValid: boolean;
    warnings: string[];
    expiresIn?: number;
  } {
    const warnings: string[] = [];

    if (!session) {
      return { isValid: false, warnings: ['No active session'] };
    }

    // Check expiration
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const expiresIn = Math.max(0, expiresAt - Date.now());

    if (expiresIn === 0) {
      warnings.push('Session expired');
    } else if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
      warnings.push('Session expires soon');
    }

    // Check token freshness
    const issuedAt = session.user?.created_at ? new Date(session.user.created_at).getTime() : 0;
    const tokenAge = Date.now() - issuedAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      warnings.push('Token is older than recommended');
    }

    return {
      isValid: warnings.length === 0 || warnings.every(w => !w.includes('expired')),
      warnings,
      expiresIn: Math.round(expiresIn / 1000)
    };
  }
}