
import { vi } from 'vitest';

export const createMockSupabaseQuery = (mockData: any = null, mockError: any = null) => {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    then: vi.fn().mockResolvedValue({ data: mockData, error: mockError })
  };
};

export const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  functions: {
    invoke: vi.fn()
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn()
  })
};

// Sample test data
export const mockMerchant = {
  id: 'merchant-1',
  shop_domain: 'test-store.myshopify.com',
  access_token: 'test-access-token',
  plan_type: 'starter',
  settings: {},
  created_at: '2024-01-01T00:00:00Z'
};

export const mockProfile = {
  id: 'user-1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  merchant_id: 'merchant-1',
  role: 'admin'
};

export const mockReturn = {
  id: 'return-1',
  shopify_order_id: '12345',
  customer_email: 'customer@example.com',
  reason: 'Size issue',
  status: 'requested',
  total_amount: 100,
  merchant_id: 'merchant-1',
  created_at: '2024-01-01T00:00:00Z'
};

export const mockOrder = {
  id: 'order-1',
  shopify_order_id: '12345',
  customer_email: 'customer@example.com',
  total_amount: 100,
  status: 'completed',
  created_at: '2024-01-01T00:00:00Z'
};

export const mockAnalyticsData = {
  totalReturns: 25,
  pendingReturns: 5,
  approvedReturns: 15,
  rejectedReturns: 5,
  exchangeRate: 60,
  avgProcessingTime: 2.5,
  topReturnReasons: [
    { reason: 'Size issue', count: 10 },
    { reason: 'Quality issue', count: 8 },
    { reason: 'Wrong item', count: 7 }
  ]
};
