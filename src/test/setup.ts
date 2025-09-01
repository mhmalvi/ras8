import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Setup globals for jsdom
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SHOPIFY_CLIENT_ID: 'test-client-id',
    VITE_APP_URL: 'http://localhost:3000',
    VITE_DEV_MODE: 'true',
  },
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        limit: vi.fn(() => ({
          data: [],
          error: null,
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        then: vi.fn().mockResolvedValue({ data: [], error: null })
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null,
        then: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
          then: vi.fn().mockResolvedValue({ data: null, error: null })
        })),
        then: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
          then: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: null
      })),
      signUp: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))
    }
  }
}));

// Mock AtomicAuthContext
vi.mock('@/contexts/AtomicAuthContext', () => ({
  useAtomicAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    session: null,
    loading: false,
    initialized: true,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  })),
  AtomicAuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock hooks that depend on auth
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    profile: {
      id: 'test-profile-id',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      merchant_id: 'test-merchant-id'
    },
    loading: false,
    error: null
  }))
}));

vi.mock('@/hooks/useLiveData', () => ({
  useLiveData: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    dashboardKPIs: {
      totalReturns: 150,
      pendingReturns: 20,
      totalRevenue: 12500,
      aiAccuracy: 85
    },
    analyticsData: {
      returnsByStatus: { requested: 20, approved: 80, completed: 50 },
      statusBreakdown: [
        { status: 'Requested', count: 20 },
        { status: 'Approved', count: 80 },
        { status: 'Completed', count: 50 }
      ],
      topReturnReasons: [
        { reason: 'Size issues', count: 45 },
        { reason: 'Quality concerns', count: 30 }
      ],
      monthlyTrends: [
        { month: 'Jan', returns: 40, revenue: 3200, exchanges: 12 },
        { month: 'Feb', returns: 55, revenue: 4100, exchanges: 18 }
      ]
    }
  }))
}));

// Mock Recharts globally
vi.mock('recharts', async () => {
  const rechartsMocks = await import('@/test/mocks/recharts');
  return rechartsMocks.default;
});

// Mock additional hooks
vi.mock('@/hooks/useRealAnalyticsData', () => ({
  useRealAnalyticsData: vi.fn(() => ({
    analytics: {
      totalReturns: 150,
      totalRevenue: 12500,
      totalExchanges: 45,
      exchangeRate: 30,
      avgProcessingTime: 2.5,
      returnRate: 8.5,
      customerSatisfactionScore: 4.2,
      aiAcceptanceRate: 75,
      revenueImpact: 25,
      returnsByStatus: { requested: 20, approved: 80, completed: 50 },
      topReturnReasons: [
        { reason: 'Size issues', count: 45 },
        { reason: 'Quality concerns', count: 30 }
      ],
      monthlyTrends: [
        { month: 'Jan', returns: 40, revenue: 3200, exchanges: 12 },
        { month: 'Feb', returns: 55, revenue: 4100, exchanges: 18 }
      ],
      recentActivity: []
    },
    loading: false,
    error: null,
    refetch: vi.fn()
  }))
}));

vi.mock('@/hooks/useReturnsManagement', () => ({
  useReturnsManagement: vi.fn(() => ({
    returns: [
      {
        id: '1',
        customer_email: 'test@example.com',
        status: 'requested',
        reason: 'Size too small',
        total_amount: 99.99,
        created_at: '2024-01-01',
        return_items: [{ product_name: 'Test Product', quantity: 1 }]
      }
    ],
    loading: false,
    error: null,
    updateReturn: vi.fn(),
    refetch: vi.fn()
  }))
}));

// Mock router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    pathname: '/dashboard',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}));

// Mock theme provider
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark'],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Reset console in cleanup
beforeEach(() => {
  global.console = {
    ...originalConsole,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
});