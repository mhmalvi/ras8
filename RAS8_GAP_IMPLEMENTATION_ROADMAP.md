# RAS8 Gap Implementation Roadmap
**Created:** December 26, 2025
**Based On:** RAS8_COMPREHENSIVE_END_TO_END_ANALYSIS.md
**Purpose:** Detailed implementation plans for all identified gaps

---

## Table of Contents

1. [Critical Priority: Automated Testing](#1-critical-priority-automated-testing)
2. [Critical Priority: Rate Limiting](#2-critical-priority-rate-limiting)
3. [High Priority: HMAC Validation](#3-high-priority-hmac-validation)
4. [High Priority: Error Handling](#4-high-priority-error-handling)
5. [Medium Priority: Observability & Logging](#5-medium-priority-observability--logging)
6. [Medium Priority: API Documentation](#6-medium-priority-api-documentation)
7. [Medium Priority: Database ER Diagram](#7-medium-priority-database-er-diagram)
8. [Medium Priority: Accessibility](#8-medium-priority-accessibility)
9. [Medium Priority: Disaster Recovery Plan](#9-medium-priority-disaster-recovery-plan)
10. [Low Priority: Performance Optimization](#10-low-priority-performance-optimization)
11. [Implementation Timeline](#implementation-timeline)

---

# 1. CRITICAL PRIORITY: Automated Testing

## 1.1 Overview

**Current State:** 0% test coverage, no test files in src/
**Target State:** 60% coverage in 2 weeks, 80% in 1 month
**Impact:** High - Prevents regressions, enables confident refactoring
**Effort:** 40-60 hours over 2 weeks

## 1.2 Testing Strategy

### Testing Pyramid
```
        E2E Tests (5%)
       ─────────────────
      Integration Tests (20%)
     ───────────────────────
    Unit Tests (75%)
   ─────────────────────────
```

## 1.3 Phase 1: Unit Tests (Week 1)

### 1.3.1 Setup Test Infrastructure

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_SHOPIFY_CLIENT_ID: 'test-client-id',
  VITE_APP_URL: 'https://test.app.com',
  VITE_DEV_MODE: 'true',
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

// Mock Shopify App Bridge
vi.mock('@shopify/app-bridge', () => ({
  default: vi.fn(() => ({
    subscribe: vi.fn(),
  })),
}));

vi.mock('@shopify/app-bridge-utils', () => ({
  getSessionToken: vi.fn(() => Promise.resolve('mock-token')),
}));
```

### 1.3.2 Utility Function Tests

**File:** `src/utils/__tests__/landingResolver.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLandingRoute } from '../landingResolver';

describe('landingResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('resolveLandingRoute', () => {
    it('should redirect to dashboard for embedded app with shop param', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: 'test-store.myshopify.com',
        isEmbedded: true,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/dashboard');
    });

    it('should redirect to error if no profile exists', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: null,
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/error');
    });

    it('should redirect to master-admin for master_admin role', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'master_admin',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/master-admin');
    });

    it('should redirect to connect-shopify for no merchant link', async () => {
      // Mock database response
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          has_merchant_link: false,
          integration_status: 'no-merchant-link',
        },
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/connect-shopify');
    });
  });
});
```

### 1.3.3 Service Tests

**File:** `src/services/__tests__/authService.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../authService';
import { supabase } from '@/integrations/supabase/client';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await AuthService.signUp(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
          emailRedirectTo: expect.any(String),
        },
      });

      expect(result.user).toEqual(mockUser);
    });

    it('should throw error on failed sign up', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Sign up failed'),
      });

      await expect(
        AuthService.signUp('test@example.com', 'password123')
      ).rejects.toThrow('Sign up failed');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in existing user', async () => {
      const mockSession = {
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      const result = await AuthService.signIn(
        'test@example.com',
        'password123'
      );

      expect(result.user).toEqual(mockSession.user);
    });

    it('should create profile if missing on sign in', async () => {
      const mockSession = {
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      // Mock profile check - doesn't exist
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      } as any);

      // Mock profile creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: 'test-user-id', role: 'user' },
          error: null,
        }),
      } as any);

      await AuthService.signIn('test@example.com', 'password123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });
});
```

### 1.3.4 Hook Tests

**File:** `src/hooks/__tests__/useRealReturnsData.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealReturnsData } from '../useRealReturnsData';
import { supabase } from '@/integrations/supabase/client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useRealReturnsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch returns data successfully', async () => {
    const mockReturns = [
      {
        id: '1',
        customer_email: 'test@example.com',
        status: 'pending',
        total_amount: '100.00',
      },
    ];

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({
        data: mockReturns,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useRealReturnsData('merchant-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockReturns);
  });

  it('should handle errors', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      }),
    } as any);

    const { result } = renderHook(() => useRealReturnsData('merchant-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

## 1.4 Phase 2: Component Tests (Week 1)

### 1.4.1 Component Test Example

**File:** `src/components/__tests__/RealReturnsTable.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RealReturnsTable } from '../RealReturnsTable';

const mockReturns = [
  {
    id: '1',
    order_id: 'ORDER-123',
    customer_email: 'test@example.com',
    status: 'pending',
    total_amount: '100.00',
    created_at: '2025-12-26T10:00:00Z',
  },
];

describe('RealReturnsTable', () => {
  it('should render returns data', () => {
    render(<RealReturnsTable returns={mockReturns} />);

    expect(screen.getByText('ORDER-123')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('should call onProcess when process button is clicked', () => {
    const onProcess = vi.fn();
    render(
      <RealReturnsTable returns={mockReturns} onProcess={onProcess} />
    );

    const processButton = screen.getByRole('button', { name: /process/i });
    fireEvent.click(processButton);

    expect(onProcess).toHaveBeenCalledWith('1');
  });

  it('should show empty state when no returns', () => {
    render(<RealReturnsTable returns={[]} />);

    expect(screen.getByText(/no returns found/i)).toBeInTheDocument();
  });

  it('should filter by status', () => {
    render(
      <RealReturnsTable
        returns={mockReturns}
        filters={{ status: 'pending' }}
      />
    );

    expect(screen.getByText('ORDER-123')).toBeInTheDocument();
  });
});
```

## 1.5 Phase 3: Integration Tests (Week 2)

### 1.5.1 API Integration Test

**File:** `src/__tests__/integration/auth.integration.test.ts`
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Authentication Integration', () => {
  let supabaseClient;

  beforeAll(() => {
    // Use test Supabase instance or local instance
    supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL_TEST || 'http://localhost:54321',
      process.env.VITE_SUPABASE_ANON_KEY_TEST || 'test-key'
    );
  });

  afterAll(async () => {
    // Cleanup test users
  });

  it('should complete full auth flow', async () => {
    // Sign up
    const { data: signUpData, error: signUpError } =
      await supabaseClient.auth.signUp({
        email: 'integration-test@example.com',
        password: 'testpassword123',
      });

    expect(signUpError).toBeNull();
    expect(signUpData.user).toBeDefined();

    // Sign in
    const { data: signInData, error: signInError } =
      await supabaseClient.auth.signInWithPassword({
        email: 'integration-test@example.com',
        password: 'testpassword123',
      });

    expect(signInError).toBeNull();
    expect(signInData.session).toBeDefined();

    // Check profile created
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();

    // Sign out
    const { error: signOutError } = await supabaseClient.auth.signOut();
    expect(signOutError).toBeNull();
  });
});
```

## 1.6 Phase 4: E2E Tests (Week 2)

### 1.6.1 Playwright Setup

**File:** `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8082',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
  },
});
```

**File:** `e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/auth');

    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Test');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show verification message
    await expect(page).toHaveURL(/\/(dashboard|auth)/);
  });

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/auth');

    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to appropriate landing page
    await expect(page).toHaveURL(/\/(dashboard|connect-shopify|reconnect)/);
  });

  test('should handle sign in error', async ({ page }) => {
    await page.goto('/auth');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible();
  });
});
```

## 1.7 Test Automation

### 1.7.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 1.8 Success Criteria

- ✅ 60% unit test coverage
- ✅ Critical paths have integration tests
- ✅ E2E tests for main user flows (auth, returns, billing)
- ✅ Tests run on every commit (CI/CD)
- ✅ Coverage reports generated
- ✅ All tests passing

## 1.9 Estimated Timeline

- **Week 1, Days 1-2:** Test infrastructure setup (8 hours)
- **Week 1, Days 3-5:** Unit tests for utilities, services, hooks (24 hours)
- **Week 2, Days 1-2:** Component tests (16 hours)
- **Week 2, Days 3-4:** Integration tests (12 hours)
- **Week 2, Day 5:** E2E tests + CI/CD setup (8 hours)

**Total:** 68 hours (~2 weeks with 1 developer)

---

# 2. CRITICAL PRIORITY: Rate Limiting

## 2.1 Overview

**Current State:** No rate limiting on any endpoint
**Target State:** Rate limits on all API endpoints
**Impact:** High - Prevents abuse, DOS attacks
**Effort:** 8-12 hours

## 2.2 Implementation Strategy

### 2.2.1 Vercel Edge Middleware Approach

**File:** `middleware.ts` (root directory)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter with Upstash Redis
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

// Different limits for different endpoint types
const limits = {
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 auth attempts per 15 min
  }),
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 API calls per minute
  }),
  webhooks: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 webhooks per minute
  }),
};

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const pathname = request.nextUrl.pathname;

  // Determine which rate limit to apply
  let limiter = limits.api;
  if (pathname.startsWith('/api/auth')) {
    limiter = limits.auth;
  } else if (pathname.startsWith('/api/webhooks')) {
    limiter = limits.webhooks;
  }

  // Check rate limit
  const { success, limit, reset, remaining } = await limiter.limit(ip);

  // Add rate limit headers
  const response = success
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        },
        { status: 429 }
      );

  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### 2.2.2 Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2.2.3 Upstash Redis Setup

1. Sign up at https://upstash.com
2. Create a new Redis database
3. Get REST API URL and Token
4. Add to environment variables:

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 2.2.4 Alternative: In-Memory Rate Limiting (No External Dependency)

**File:** `api/_middleware/rateLimit.ts`
```typescript
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return (req: Request): { allowed: boolean; remaining: number; reset: number } => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${req.url}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // Initialize or reset
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        reset: store[key].resetTime,
      };
    }

    store[key].count++;

    if (store[key].count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        reset: store[key].resetTime,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - store[key].count,
      reset: store[key].resetTime,
    };
  };
}
```

**Usage in API endpoint:**

**File:** `api/auth/start.js`
```javascript
import { rateLimit } from '../_middleware/rateLimit';

const limiter = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export default async function handler(req, res) {
  // Apply rate limit
  const rateLimitResult = limiter(req);

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
    });
  }

  // Add headers
  res.setHeader('X-RateLimit-Limit', '5');
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());

  // Continue with normal logic
  // ...
}
```

## 2.3 Rate Limit Configuration

### 2.3.1 Recommended Limits

```typescript
const RATE_LIMITS = {
  // Authentication endpoints - strict
  auth: {
    signIn: { max: 5, window: '15m' },
    signUp: { max: 3, window: '1h' },
    callback: { max: 10, window: '5m' },
  },

  // API endpoints - moderate
  api: {
    default: { max: 100, window: '1m' },
    merchant: { max: 200, window: '1m' }, // Authenticated users get more
  },

  // Webhooks - lenient (Shopify may send bursts)
  webhooks: {
    default: { max: 1000, window: '1m' },
  },

  // Public endpoints - strict
  public: {
    health: { max: 10, window: '1m' },
    customerPortal: { max: 20, window: '1m' },
  },
};
```

## 2.4 Testing Rate Limits

**File:** `src/__tests__/rateLimit.test.ts`
```typescript
import { describe, it, expect } from 'vitest';

describe('Rate Limiting', () => {
  it('should block requests after limit exceeded', async () => {
    const responses = [];

    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      const res = await fetch('http://localhost:8082/api/auth/start?shop=test.myshopify.com');
      responses.push(res.status);
    }

    // First 5 should succeed
    expect(responses.slice(0, 5).every(s => s === 200)).toBe(true);

    // 6th should be rate limited
    expect(responses[5]).toBe(429);
  });

  it('should reset after window expires', async () => {
    // First request
    const res1 = await fetch('http://localhost:8082/api/auth/start?shop=test.myshopify.com');
    expect(res1.status).toBe(200);

    // Wait for window to expire (mock time or use small window in test)
    await new Promise(resolve => setTimeout(resolve, 16 * 60 * 1000));

    // Should work again
    const res2 = await fetch('http://localhost:8082/api/auth/start?shop=test.myshopify.com');
    expect(res2.status).toBe(200);
  });
});
```

## 2.5 Monitoring & Alerts

### 2.5.1 Log Rate Limit Events

```typescript
if (!rateLimitResult.allowed) {
  console.warn('Rate limit exceeded', {
    ip,
    endpoint: req.url,
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry
  Sentry.captureMessage('Rate limit exceeded', {
    level: 'warning',
    extra: { ip, endpoint: req.url },
  });
}
```

### 2.5.2 Dashboard for Monitoring

Create a simple admin page to view rate limit stats:

**File:** `src/pages/admin/RateLimitDashboard.tsx`
```typescript
// Display top IPs hitting rate limits
// Show rate limit statistics
// Alert on suspicious patterns
```

## 2.6 Success Criteria

- ✅ Rate limits on all API endpoints
- ✅ Different limits for different endpoint types
- ✅ Rate limit headers in responses
- ✅ 429 status code with retry information
- ✅ Logging of rate limit events
- ✅ Tests for rate limiting logic

## 2.7 Estimated Timeline

- **Day 1, Hours 1-4:** Choose and set up rate limiting solution (4 hours)
- **Day 1, Hours 5-8:** Implement rate limiting middleware (4 hours)
- **Day 2, Hours 1-4:** Apply to all endpoints with appropriate limits (4 hours)
- **Day 2, Hours 5-6:** Testing (2 hours)

**Total:** 14 hours (~2 days)

---

# 3. HIGH PRIORITY: HMAC Validation

## 3.1 Overview

**Current State:** HMAC validation prepared but not fully implemented
**Target State:** All Shopify webhooks validate HMAC
**Impact:** High - Security vulnerability if missing
**Effort:** 4-6 hours

## 3.2 Implementation

### 3.2.1 HMAC Validation Utility

**File:** `api/_utils/hmacValidation.ts`
```typescript
import crypto from 'crypto';

/**
 * Validates Shopify webhook HMAC signature
 * @param rawBody - Raw request body as string
 * @param hmacHeader - HMAC header from Shopify
 * @param secret - Shopify Client Secret
 * @returns boolean - True if valid
 */
export function validateShopifyHMAC(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  if (!hmacHeader || !secret || !rawBody) {
    console.error('Missing required parameters for HMAC validation');
    return false;
  }

  try {
    // Compute HMAC
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Compare using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader),
      Buffer.from(computedHmac)
    );
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

/**
 * Validates Shopify OAuth callback HMAC
 * @param query - Query parameters object
 * @param secret - Shopify Client Secret
 * @returns boolean - True if valid
 */
export function validateOAuthHMAC(
  query: Record<string, string>,
  secret: string
): boolean {
  const { hmac, ...params } = query;

  if (!hmac || !secret) {
    console.error('Missing HMAC or secret for OAuth validation');
    return false;
  }

  try {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Compute HMAC
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(sortedParams, 'utf8')
      .digest('hex');

    // Compare using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(computedHmac)
    );
  } catch (error) {
    console.error('OAuth HMAC validation error:', error);
    return false;
  }
}
```

### 3.2.2 Apply to Webhook Endpoint

**File:** `api/webhooks/app/uninstalled.js`
```javascript
import { validateShopifyHMAC } from '../../_utils/hmacValidation';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get HMAC from header
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];

    // Get raw body (IMPORTANT: Need raw body, not parsed JSON)
    const rawBody = JSON.stringify(req.body);

    // Validate HMAC
    const isValid = validateShopifyHMAC(
      rawBody,
      hmacHeader,
      process.env.SHOPIFY_CLIENT_SECRET
    );

    if (!isValid) {
      console.error('Invalid HMAC signature', {
        shop: shopDomain,
        timestamp: new Date().toISOString(),
      });

      // Log to webhook_events table with hmac_valid=false
      await supabase.from('webhook_events').insert({
        shop_domain: shopDomain,
        event_type: 'app/uninstalled',
        payload: req.body,
        hmac_valid: false,
        processing_status: 'failed',
        error_message: 'Invalid HMAC signature',
      });

      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    // HMAC is valid, continue processing
    console.log('✅ HMAC validated for shop:', shopDomain);

    // Log webhook event
    await supabase.from('webhook_events').insert({
      shop_domain: shopDomain,
      event_type: 'app/uninstalled',
      payload: req.body,
      hmac_valid: true,
      processing_status: 'success',
    });

    // Process uninstallation
    const success = await supabase.rpc('mark_merchant_uninstalled', {
      p_shop_domain: shopDomain,
    });

    if (success) {
      // Log analytics event
      await supabase.from('analytics_events').insert({
        event_type: 'app_uninstalled',
        event_data: { shop_domain: shopDomain },
      });
    }

    // Always return 200 to prevent Shopify retries
    return res.status(200).json({
      success: true,
      shop: shopDomain,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(200).json({ success: false });
  }
}
```

### 3.2.3 Raw Body Parsing for Webhooks

Shopify requires the raw body for HMAC validation. Configure Vercel to provide raw body:

**File:** `api/webhooks/_middleware.js`
```javascript
export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing
  },
};

export async function middleware(req, res, next) {
  // Parse raw body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Attach raw body
  req.rawBody = rawBody;

  // Also parse as JSON for convenience
  try {
    req.body = JSON.parse(rawBody);
  } catch (e) {
    req.body = {};
  }

  return next();
}
```

### 3.2.4 Apply to OAuth Callback

**File:** `api/auth/callback.js`
```javascript
import { validateOAuthHMAC } from '../_utils/hmacValidation';

export default async function handler(req, res) {
  const { code, shop, state, hmac, timestamp, ...otherParams } = req.query;

  // Validate HMAC
  const isValid = validateOAuthHMAC(
    req.query,
    process.env.SHOPIFY_CLIENT_SECRET
  );

  if (!isValid) {
    console.error('Invalid OAuth HMAC', { shop, timestamp });
    return res.status(401).send('Invalid HMAC signature');
  }

  // Continue with OAuth flow
  // ...
}
```

## 3.3 Testing HMAC Validation

**File:** `src/__tests__/hmacValidation.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { validateShopifyHMAC, validateOAuthHMAC } from '../hmacValidation';

describe('HMAC Validation', () => {
  const SECRET = 'test-secret-key';

  describe('validateShopifyHMAC', () => {
    it('should validate correct HMAC', () => {
      const body = JSON.stringify({ shop: 'test.myshopify.com' });
      const hmac = crypto
        .createHmac('sha256', SECRET)
        .update(body, 'utf8')
        .digest('base64');

      expect(validateShopifyHMAC(body, hmac, SECRET)).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const body = JSON.stringify({ shop: 'test.myshopify.com' });
      const invalidHmac = 'invalid-hmac';

      expect(validateShopifyHMAC(body, invalidHmac, SECRET)).toBe(false);
    });

    it('should reject tampered body', () => {
      const body = JSON.stringify({ shop: 'test.myshopify.com' });
      const hmac = crypto
        .createHmac('sha256', SECRET)
        .update(body, 'utf8')
        .digest('base64');

      const tamperedBody = JSON.stringify({ shop: 'hacker.myshopify.com' });

      expect(validateShopifyHMAC(tamperedBody, hmac, SECRET)).toBe(false);
    });
  });

  describe('validateOAuthHMAC', () => {
    it('should validate correct OAuth HMAC', () => {
      const params = {
        code: 'auth-code',
        shop: 'test.myshopify.com',
        state: 'nonce-123',
        timestamp: '1234567890',
      };

      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      const hmac = crypto
        .createHmac('sha256', SECRET)
        .update(sortedParams, 'utf8')
        .digest('hex');

      expect(validateOAuthHMAC({ ...params, hmac }, SECRET)).toBe(true);
    });

    it('should reject invalid OAuth HMAC', () => {
      const params = {
        code: 'auth-code',
        shop: 'test.myshopify.com',
        hmac: 'invalid',
      };

      expect(validateOAuthHMAC(params, SECRET)).toBe(false);
    });
  });
});
```

## 3.4 Success Criteria

- ✅ All webhook endpoints validate HMAC
- ✅ OAuth callback validates HMAC
- ✅ Invalid HMAC returns 401 and logs event
- ✅ Tests cover all validation scenarios
- ✅ Failed validations logged to webhook_events table

## 3.5 Estimated Timeline

- **Hours 1-2:** Implement HMAC validation utilities (2 hours)
- **Hours 3-4:** Apply to all webhook endpoints (2 hours)
- **Hours 5-6:** Testing and verification (2 hours)

**Total:** 6 hours (~1 day)

---

# 4. HIGH PRIORITY: Error Handling

## 4.1 Overview

**Current State:** Inconsistent error handling, some edge cases missing try-catch
**Target State:** Standardized error handling across all endpoints and components
**Impact:** Medium - Better UX, easier debugging
**Effort:** 8-12 hours

## 4.2 Implementation Strategy

### 4.2.1 Error Response Standard

**File:** `api/_utils/errorHandler.ts`
```typescript
export interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleAPIError(error: unknown, req: Request): APIError {
  console.error('API Error:', error);

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    return {
      error: 'Database Error',
      message: supabaseError.message,
      code: supabaseError.code,
      timestamp: new Date().toISOString(),
    };
  }

  // Custom AppError
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    };
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Unknown error
  return {
    error: 'Unknown Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  };
}

export function sendErrorResponse(res: Response, error: unknown, statusCode = 500) {
  const errorResponse = handleAPIError(error, req);

  // Log to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: errorResponse,
    });
  }

  return res.status(statusCode).json(errorResponse);
}
```

### 4.2.2 Apply to API Endpoints

**File:** `api/auth/start.js` (Updated)
```javascript
import { AppError, sendErrorResponse } from '../_utils/errorHandler';

export default async function handler(req, res) {
  try {
    const { shop } = req.query;

    // Validation
    if (!shop) {
      throw new AppError(400, 'MISSING_SHOP', 'Shop parameter is required');
    }

    if (!shop.endsWith('.myshopify.com')) {
      throw new AppError(400, 'INVALID_SHOP', 'Invalid shop domain format');
    }

    // Business logic
    // ...

  } catch (error) {
    return sendErrorResponse(res, error, error.statusCode || 500);
  }
}
```

### 4.2.3 Frontend Error Handling

**File:** `src/utils/apiClient.ts`
```typescript
export class APIClient {
  private static async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(
          response.status,
          data.code || 'API_ERROR',
          data.message || 'Request failed',
          data.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network error
      throw new APIError(
        0,
        'NETWORK_ERROR',
        'Failed to connect to server'
      );
    }
  }

  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  static async post<T>(url: string, body: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

**Usage in components:**

```typescript
import { APIClient, APIError } from '@/utils/apiClient';
import { toast } from 'sonner';

async function handleSubmit() {
  try {
    const result = await APIClient.post('/api/returns', returnData);
    toast.success('Return created successfully');
  } catch (error) {
    if (error instanceof APIError) {
      // User-friendly error message
      if (error.code === 'VALIDATION_ERROR') {
        toast.error('Please check your input');
      } else if (error.code === 'UNAUTHORIZED') {
        toast.error('Please sign in again');
        navigate('/auth');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.error('An unexpected error occurred');
    }

    console.error('Error creating return:', error);
  }
}
```

### 4.2.4 React Error Boundary Enhancement

**File:** `src/components/EnhancedErrorBoundary.tsx`
```typescript
import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isNetworkError = error.message.includes('network') || error.message.includes('fetch');
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized');

  React.useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: true,
        isNetworkError,
        isAuthError,
      },
    });
  }, [error, isNetworkError, isAuthError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {isNetworkError ? 'Connection Error' :
             isAuthError ? 'Authentication Error' :
             'Something Went Wrong'}
          </h2>

          <p className="text-muted-foreground">
            {isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection.'
              : isAuthError
              ? 'Your session has expired. Please sign in again.'
              : 'We encountered an unexpected error. Our team has been notified.'}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-muted p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold mb-2">
              Error Details
            </summary>
            <pre className="text-xs overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={resetErrorBoundary} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button onClick={() => (window.location.href = '/')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Error ID: {Math.random().toString(36).substr(2, 9)}
        </p>
      </div>
    </div>
  );
}

export function EnhancedErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
      }}
      onReset={() => {
        // Reset application state if needed
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 4.2.5 Database Error Mapping

**File:** `src/utils/databaseErrors.ts`
```typescript
const ERROR_MESSAGES = {
  // PostgreSQL error codes
  '23505': 'A record with this information already exists',
  '23503': 'Referenced record does not exist',
  '23502': 'Required field is missing',
  '22P02': 'Invalid data format',
  '42P01': 'Database table not found',

  // Supabase specific
  'PGRST116': 'Record not found',
  'PGRST301': 'Authentication required',
  '42501': 'Permission denied',
};

export function getDatabaseErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || 'A database error occurred';
}
```

## 4.3 Success Criteria

- ✅ All API endpoints have try-catch blocks
- ✅ Standardized error response format
- ✅ User-friendly error messages
- ✅ Errors logged to Sentry with context
- ✅ Frontend handles all error types gracefully
- ✅ Enhanced error boundary with recovery options

## 4.4 Estimated Timeline

- **Hours 1-3:** Create error handling utilities (3 hours)
- **Hours 4-7:** Apply to all API endpoints (4 hours)
- **Hours 8-10:** Frontend error handling (3 hours)
- **Hours 11-12:** Testing (2 hours)

**Total:** 12 hours (~1.5 days)

---

*[Continued in next part due to length...]*

Would you like me to:
1. **Continue with the remaining implementation plans** (Observability, API Docs, Accessibility, etc.)?
2. **Focus on specific gaps** you want to tackle first?
3. **Create a sprint plan** with prioritized tasks?
4. **Generate code templates** for any specific implementation?
