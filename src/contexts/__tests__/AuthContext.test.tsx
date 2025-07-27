import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    }
  }
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    renderWithAuth();
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('should show no user initially', () => {
    renderWithAuth();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should handle successful sign in', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };
    
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    });

    renderWithAuth();
    
    const signInButton = screen.getByText('Sign In');
    await userEvent.click(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('should handle sign in errors', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    renderWithAuth();
    
    const signInButton = screen.getByText('Sign In');
    await userEvent.click(signInButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('should handle successful sign up', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null
    });

    renderWithAuth();
    
    const signUpButton = screen.getByText('Sign Up');
    await userEvent.click(signUpButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          emailRedirectTo: expect.stringContaining(window.location.origin),
          data: {
            first_name: '',
            last_name: ''
          }
        }
      });
    });
  });

  it('should handle sign out', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    renderWithAuth();
    
    const signOutButton = screen.getByText('Sign Out');
    await userEvent.click(signOutButton);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});