import React from 'react';
import { vi } from 'vitest';
import { User, Session } from '@supabase/supabase-js';

// Mock AuthContext Provider for tests
interface MockAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const mockAuthContextValue: MockAuthContextType = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  } as User,
  session: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
    } as User,
  } as Session,
  loading: false,
  initialized: true,
  error: null,
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue(undefined),
};

// Mock AtomicAuthContext
const MockAtomicAuthContext = React.createContext<MockAuthContextType>(mockAuthContextValue);

export const MockAtomicAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAtomicAuthContext.Provider value={mockAuthContextValue}>
      {children}
    </MockAtomicAuthContext.Provider>
  );
};

// Mock Profile Context
interface MockProfileContextType {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    merchant_id: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const mockProfileContextValue: MockProfileContextType = {
  profile: {
    id: 'test-profile-id',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    merchant_id: 'test-merchant-id',
  },
  loading: false,
  error: null,
};

const MockProfileContext = React.createContext<MockProfileContextType>(mockProfileContextValue);

export const MockProfileProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockProfileContext.Provider value={mockProfileContextValue}>
      {children}
    </MockProfileContext.Provider>
  );
};

// Mock Query Client Provider for React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });

export const MockQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Combined Test Providers
export const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockQueryProvider>
      <MockAtomicAuthProvider>
        <MockProfileProvider>
          {children}
        </MockProfileProvider>
      </MockAtomicAuthProvider>
    </MockQueryProvider>
  );
};

// Custom render function for tests
import { render, RenderOptions } from '@testing-library/react';

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export { customRender as renderWithProviders };

// Export mock values for tests that need to assert against them
export { mockAuthContextValue, mockProfileContextValue };