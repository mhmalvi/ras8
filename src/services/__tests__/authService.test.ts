import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../authService';
import { supabase } from '@/integrations/supabase/client';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://test.app.com' },
      writable: true,
    });
  });

  describe('signUp', () => {
    it('should sign up user with email and password', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123', user: mockUser };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await AuthService.signUp('test@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://test.app.com/',
          data: {
            first_name: '',
            last_name: '',
          },
        },
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should sign up user with first and last name', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      await AuthService.signUp('test@example.com', 'password123', 'John', 'Doe');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://test.app.com/',
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      });
    });

    it('should throw error on sign up failure', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email already registered', name: 'AuthError', status: 400 },
      });

      await expect(
        AuthService.signUp('test@example.com', 'password123')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { first_name: 'John', last_name: 'Doe' }
      };
      const mockSession = { access_token: 'token-123', user: mockUser };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock profile exists check
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { id: 'user-123' },
          error: null,
        }),
      } as any);

      const result = await AuthService.signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should create profile if it does not exist', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { first_name: 'John', last_name: 'Doe' }
      };
      const mockSession = { access_token: 'token-123', user: mockUser };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock profile does not exist
      const mockInsert = vi.fn().mockResolvedValueOnce({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
        insert: mockInsert,
      } as any);

      await AuthService.signIn('test@example.com', 'password123');

      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'merchant_admin',
      });
    });

    it('should handle profile creation failure gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      // Mock profile check fails
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Profile creation failed', code: '23505' },
        }),
      } as any);

      const result = await AuthService.signIn('test@example.com', 'password123');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw error on sign in failure', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', name: 'AuthError', status: 400 },
      });

      await expect(
        AuthService.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      await AuthService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should preserve embedded context before logout', async () => {
      const landingDecision = {
        context: {
          shopDomain: 'test-store.myshopify.com',
          isEmbedded: true,
        },
      };

      localStorage.setItem('last_landing_decision', JSON.stringify(landingDecision));

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      await AuthService.signOut();

      const preservedContext = localStorage.getItem('preserved_embedded_context');
      expect(preservedContext).toBeTruthy();

      const parsed = JSON.parse(preservedContext!);
      expect(parsed.shopDomain).toBe('test-store.myshopify.com');
      expect(parsed.isEmbedded).toBe(true);
      expect(parsed.preservedAt).toBeTruthy();
    });

    it('should not preserve context for non-embedded apps', async () => {
      const landingDecision = {
        context: {
          shopDomain: null,
          isEmbedded: false,
        },
      };

      localStorage.setItem('last_landing_decision', JSON.stringify(landingDecision));

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      await AuthService.signOut();

      const preservedContext = localStorage.getItem('preserved_embedded_context');
      expect(preservedContext).toBeNull();
    });

    it('should throw error on sign out failure', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: { message: 'Sign out failed', name: 'AuthError', status: 500 },
      });

      await expect(AuthService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        access_token: 'token-123',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await AuthService.getCurrentSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await AuthService.getCurrentSession();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Session error', name: 'AuthError', status: 500 },
      });

      const result = await AuthService.getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user exists', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User error', name: 'AuthError', status: 500 },
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await AuthService.resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://test.app.com/auth?mode=reset-password',
        }
      );
    });

    it('should throw error on reset password failure', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: { message: 'Email not found', name: 'AuthError', status: 400 },
      });

      await expect(
        AuthService.resetPassword('nonexistent@example.com')
      ).rejects.toThrow('Email not found');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      await AuthService.updatePassword('newPassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('should throw error on update password failure', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Password update failed', name: 'AuthError', status: 400 },
      });

      await expect(
        AuthService.updatePassword('weak')
      ).rejects.toThrow('Password update failed');
    });
  });
});