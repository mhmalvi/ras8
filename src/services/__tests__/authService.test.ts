import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../authService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('AuthService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await AuthService.signIn('test@example.com', 'password');

      expect(result).toEqual({ user: mockUser });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle authentication errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(AuthService.signIn('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await AuthService.signUp('test@example.com', 'password');

      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(AuthService.signOut()).resolves.not.toThrow();
    });
  });
});