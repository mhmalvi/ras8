# 🔎 Client Landing Logic, Shopify Integration & Implementation Plan - Audit Report

**Generated:** 2025-01-02  
**Repo:** E:\Aethon_draft\ras-9\ras8  
**Stack:** React/Vite, Supabase (auth+DB+RLS), Shopify Admin API + App Bridge, Vercel  

---

## 📋 Executive Summary

This audit reveals a **partially implemented** landing system with **critical gaps** in the unified landing decision logic. While the codebase has foundations for both standalone and embedded Shopify flows, it **lacks the authoritative `resolveLandingRoute()` function** and proper new vs returning user detection required by the stated goals.

### 🚨 Critical Findings

1. **No centralized landing decision logic** - Routes are scattered across multiple components
2. **Database schema missing key relationships** - No `shopify_tokens` table, incomplete merchant tracking
3. **Mixed authentication contexts** - AtomicAuth + MerchantSession creates conflicts
4. **Security implemented but incomplete** - HMAC validation present but no systematic token validation
5. **Embedded vs standalone flows not properly unified** - Different codepaths, potential for duplicate merchants

---

## 🔍 Current Landing Decision Logic Analysis

### Current State: FRAGMENTED ❌

**Location:** Multiple files handle routing decisions independently:
- `AtomicProtectedRoute.tsx:113-122` - Master admin detection
- `Dashboard.tsx` - Authentication checks
- `MerchantProtectedRoute.tsx` - Shopify-specific auth
- No single authoritative landing resolver

### Authentication Flow Scatter

```typescript
// Current fragmented approach across multiple files:
// 1. AtomicProtectedRoute.tsx
if (isMasterAdmin && isOnRootOrDashboard && isNotOnMasterAdmin) {
  return <Navigate to="/master-admin" replace />;
}

// 2. AtomicProtectedRoute.tsx:95-110 
if (!user) {
  if (isEmbedded && shop && shopifySessionValid) {
    return <>{children}</>;
  }
  return <Navigate to="/auth" state={{ from: location }} replace />;
}

// 3. MerchantProtectedRoute - separate embedded logic
// 4. Dashboard - authentication state checks
```

**Issues:**
- No unified decision tree
- Inconsistent state checks
- No merchant status validation
- Missing token freshness checks

---

## 🔄 Current Standalone vs Embedded Integration Paths

### Standalone Flow Analysis ✅ BASIC

**Entry Points:**
- `/shopify/install` → `ShopifyInstallation.tsx`
- Manual domain input → OAuth redirect
- Callback: `/auth/callback` → `callback.js`

**Flow:**
1. User enters shop domain in `ShopifyInstallation.tsx:222`
2. OAuth URL generated with state parameter
3. Redirect to Shopify: `https://${shop}/admin/oauth/authorize`
4. Callback processes: HMAC validation, token exchange, merchant upsert
5. Redirect to: `/auth/inline?shop=${shop}&host=${host}`

**Strengths:**
- HMAC validation implemented (`callback.js:15-31`)
- State parameter security (`callback.js:104-152`)
- Token encryption (`callback.js:54-70`)
- Merchant record creation

### Embedded Flow Analysis ⚠️ INCOMPLETE  

**Entry Points:**
- `/auth/start?shop=X&host=Y` → `start.js`
- App Bridge integration via `MerchantSessionContext.tsx`

**Flow:**
1. Shopify Admin opens app → `/auth/start`
2. Top-level OAuth breakout (`start.js:79-144`)
3. Same callback processing as standalone
4. Redirect to embedded context

**Issues:**
- **No session token exchange** with App Bridge tokens
- **Potential duplicate merchants** - same shop could create multiple records
- **Missing App Bridge session validation** in protected routes
- Embedded context not properly detected in all guards

---

## 🗄️ Database Schema Analysis

### Current Schema: INCOMPLETE ❌

**Tables Found:**
```sql
-- From migrations analysis
merchants(
  id UUID PRIMARY KEY,
  shop_domain TEXT UNIQUE, -- ✅ Good
  access_token TEXT,       -- ❌ Should be in separate tokens table
  token_encrypted_at TIMESTAMPTZ,
  token_encryption_version INTEGER,
  plan_type TEXT,
  settings JSONB
)

profiles(
  id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES merchants(id), -- ✅ Good FK
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'admin'
)
```

**Missing Required Tables:**
```sql
-- ❌ MISSING: Dedicated tokens table
shopify_tokens(
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  access_token TEXT ENCRYPTED,
  scopes TEXT[],
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- ❌ MISSING: Enhanced merchant status tracking
-- Current merchants table lacks:
-- - shop_id BIGINT UNIQUE (Shopify's internal ID)
-- - status ENUM('active','uninstalled','pending','suspended')
-- - installed_at TIMESTAMPTZ
-- - uninstalled_at TIMESTAMPTZ
```

**Critical Database Gaps:**
1. No separation of concerns - tokens mixed with merchant data
2. Missing `shop_id` field - only `shop_domain` (problematic for domain changes)
3. No systematic token validation tracking
4. No merchant status lifecycle management

---

## 🔐 Security Implementation Analysis

### Current Security: PARTIAL ✅⚠️

**Implemented:**
- ✅ HMAC validation (`callback.js:15-31`)
- ✅ OAuth state/nonce protection (`callback.js:104-152`)
- ✅ Token encryption (`callback.js:54-70`)
- ✅ JWT session tokens with expiry (`callback.js:34-51`)
- ✅ CSP headers for embedded contexts
- ✅ RLS policies on all tables

**Security Strengths:**
```javascript
// HMAC validation
function validateHmac(query, secret) {
  const { hmac, signature, ...rest } = query;
  const sortedParams = Object.keys(rest).sort().map(key => 
    `${key}=${rest[key]}`
  ).join('&');
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
  return calculatedHmac === hmac;
}

// State validation with timestamp
const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
const stateTimestamp = parseInt(decodedState.timestamp);
const now = Date.now();
if (now - stateTimestamp > oneHour) {
  throw new Error('OAuth state expired');
}
```

**Security Gaps:**
- ❌ No systematic token freshness validation (12-24h cadence)
- ❌ No webhook signature validation for app uninstall events
- ❌ Missing proper App Bridge session token validation
- ❌ No duplicate merchant prevention during OAuth
- ❌ Weak token encryption fallback (`base64` instead of failing)

---

## 🎯 Authoritative Landing Decision Algorithm

### Required Implementation: `resolveLandingRoute()`

```typescript
type LandingDecision =
  | { route: "/dashboard"; reason: "integrated-active" }
  | { route: "/reconnect"; reason: "uninstalled-or-invalid-token" } 
  | { route: "/connect-shopify"; reason: "no-merchant-link" }
  | { route: "/error"; reason: "unexpected" };

async function resolveLandingRoute(userId: string, context: 'standalone' | 'embedded'): Promise<LandingDecision> {
  // 1. Get user profile with merchant link
  const profile = await getProfile(userId);
  if (!profile) return { route: "/error", reason: "no-profile" };
  
  // 2. Check master admin special case
  if (profile.role === 'master_admin') {
    return { route: "/master-admin", reason: "master-admin" };
  }
  
  // 3. No merchant link = NEW user
  if (!profile.merchant_id) {
    return { route: "/connect-shopify", reason: "no-merchant-link" };
  }
  
  // 4. Load merchant and token status  
  const merchant = await getMerchantWithToken(profile.merchant_id);
  if (!merchant) return { route: "/error", reason: "merchant-not-found" };
  
  // 5. Check merchant status and token validity
  const isActive = merchant.status === 'active';
  const hasValidToken = merchant.token?.is_valid === true;
  const isTokenFresh = merchant.token?.last_verified_at > (Date.now() - 24*60*60*1000);
  
  if (isActive && hasValidToken && isTokenFresh) {
    return { route: "/dashboard", reason: "integrated-active" };
  }
  
  if (merchant.status === 'uninstalled' || !hasValidToken || !isTokenFresh) {
    return { route: "/reconnect", reason: "uninstalled-or-invalid-token" };
  }
  
  return { route: "/error", reason: "unexpected" };
}
```

---

## 🧪 Comprehensive Test Plan

### Phase 1: Unit Tests for Landing Logic

```typescript
// tests/unit/landingLogic.test.ts
describe('resolveLandingRoute', () => {
  test('returning integrated user → /dashboard', async () => {
    const mockProfile = { id: 'user1', merchant_id: 'merchant1', role: 'admin' };
    const mockMerchant = { 
      id: 'merchant1', 
      status: 'active',
      token: { is_valid: true, last_verified_at: Date.now() - 1000 }
    };
    
    mockGetProfile.mockResolvedValue(mockProfile);
    mockGetMerchantWithToken.mockResolvedValue(mockMerchant);
    
    const result = await resolveLandingRoute('user1', 'standalone');
    expect(result).toEqual({ route: '/dashboard', reason: 'integrated-active' });
  });

  test('new user → /connect-shopify', async () => {
    const mockProfile = { id: 'user1', merchant_id: null, role: 'admin' };
    mockGetProfile.mockResolvedValue(mockProfile);
    
    const result = await resolveLandingRoute('user1', 'standalone');
    expect(result).toEqual({ route: '/connect-shopify', reason: 'no-merchant-link' });
  });

  test('uninstalled merchant → /reconnect', async () => {
    const mockProfile = { id: 'user1', merchant_id: 'merchant1', role: 'admin' };
    const mockMerchant = { 
      id: 'merchant1', 
      status: 'uninstalled',
      token: { is_valid: false }
    };
    
    mockGetProfile.mockResolvedValue(mockProfile);
    mockGetMerchantWithToken.mockResolvedValue(mockMerchant);
    
    const result = await resolveLandingRoute('user1', 'standalone');
    expect(result).toEqual({ route: '/reconnect', reason: 'uninstalled-or-invalid-token' });
  });
});
```

### Phase 2: E2E Tests with Playwright

```typescript
// tests/e2e/landing-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Flows', () => {
  test('New user standalone flow', async ({ page }) => {
    // Seed: No profile.merchant_id
    await seedDatabase({
      users: [{ id: 'user1', email: 'test@example.com' }],
      profiles: [{ id: 'user1', merchant_id: null, email: 'test@example.com' }]
    });

    await page.goto('/auth');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    
    // Should redirect to connect-shopify
    await expect(page).toHaveURL('/connect-shopify');
    await expect(page.locator('h1')).toContainText('Connect your Shopify store');
  });

  test('Returning integrated user → dashboard', async ({ page }) => {
    // Seed: Active merchant with valid token
    await seedDatabase({
      merchants: [{
        id: 'merchant1',
        shop_domain: 'test-store.myshopify.com',
        status: 'active'
      }],
      profiles: [{
        id: 'user1', 
        merchant_id: 'merchant1',
        email: 'test@example.com'
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        access_token: 'encrypted_token',
        is_valid: true,
        last_verified_at: new Date()
      }]
    });

    await page.goto('/auth');
    await loginAs('user1');
    
    // Should redirect directly to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('Embedded app flow parity', async ({ page, context }) => {
    // Simulate Shopify Admin iframe context
    await context.addInitScript(() => {
      window.location.search = '?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29t';
    });

    // Seed same merchant as standalone test
    await seedDatabase({
      merchants: [{ 
        id: 'merchant1', 
        shop_domain: 'test-store.myshopify.com',
        status: 'active' 
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        is_valid: true,
        last_verified_at: new Date()
      }]
    });

    await page.goto('/');
    
    // Should land in embedded dashboard (same merchant record)
    await expect(page.locator('[data-embedded="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('Uninstalled app → reconnect flow', async ({ page }) => {
    await seedDatabase({
      merchants: [{ 
        id: 'merchant1',
        shop_domain: 'test-store.myshopify.com', 
        status: 'uninstalled' 
      }],
      profiles: [{ 
        id: 'user1',
        merchant_id: 'merchant1',
        email: 'test@example.com' 
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        is_valid: false
      }]
    });

    await page.goto('/auth');
    await loginAs('user1');
    
    await expect(page).toHaveURL('/reconnect');
    await expect(page.locator('button')).toContainText('Reconnect');
  });
});
```

### Phase 3: Security Tests

```typescript
// tests/security/oauth-security.spec.ts
test.describe('OAuth Security', () => {
  test('rejects invalid HMAC', async ({ request }) => {
    const response = await request.get('/auth/callback', {
      params: {
        code: 'test-code',
        shop: 'test-store.myshopify.com',
        state: 'valid-state',
        hmac: 'invalid-hmac'
      }
    });
    expect(response.status()).toBe(403);
  });

  test('prevents duplicate merchant creation', async ({ request }) => {
    // First OAuth for shop
    await seedDatabase({
      merchants: [{ shop_domain: 'test-store.myshopify.com' }]
    });
    
    // Second OAuth attempt should reuse existing merchant
    const response = await request.get('/auth/callback', {
      params: {
        code: 'test-code',
        shop: 'test-store.myshopify.com', 
        state: createValidState(),
        hmac: createValidHmac()
      }
    });
    
    // Verify only one merchant exists
    const merchants = await db.merchants.findMany({ 
      where: { shop_domain: 'test-store.myshopify.com' } 
    });
    expect(merchants).toHaveLength(1);
  });
});
```

---

## 🛠️ Implementation Plan

### Phase 0: Database & Constraints (Week 1)

```sql
-- 1. Create missing shopify_tokens table
CREATE TABLE shopify_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- encrypted
  scopes TEXT[] DEFAULT ARRAY['read_orders','write_orders','read_customers','read_products'],
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For future token refresh support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id) -- One active token per merchant
);

-- 2. Add missing merchant fields  
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS shop_id BIGINT UNIQUE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active','uninstalled','pending','suspended'));
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS uninstalled_at TIMESTAMPTZ;

-- 3. Migrate existing tokens
INSERT INTO shopify_tokens (merchant_id, access_token, is_valid, last_verified_at)
SELECT id, access_token, true, token_encrypted_at
FROM merchants 
WHERE access_token IS NOT NULL;

-- 4. Remove tokens from merchants table (after migration)
ALTER TABLE merchants DROP COLUMN access_token;
ALTER TABLE merchants DROP COLUMN token_encrypted_at;
ALTER TABLE merchants DROP COLUMN token_encryption_version;

-- 5. Add unique constraints
CREATE UNIQUE INDEX merchants_shop_domain_unique ON merchants(shop_domain);
CREATE UNIQUE INDEX merchants_shop_id_unique ON merchants(shop_id) WHERE shop_id IS NOT NULL;
```

### Phase 1: Landing Guard Implementation (Week 2)

```typescript
// src/utils/landingResolver.ts
export async function resolveLandingRoute(
  userId: string, 
  context: 'standalone' | 'embedded' = 'standalone'
): Promise<LandingDecision> {
  // Implementation as shown above
}

// src/components/UnifiedProtectedRoute.tsx  
const UnifiedProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAtomicAuth();
  const { isEmbedded } = useAppBridge();
  const [landingDecision, setLandingDecision] = useState<LandingDecision | null>(null);

  useEffect(() => {
    if (user && !loading) {
      resolveLandingRoute(user.id, isEmbedded ? 'embedded' : 'standalone')
        .then(setLandingDecision);
    }
  }, [user, loading, isEmbedded]);

  if (loading || !landingDecision) {
    return <LoadingSpinner />;
  }

  if (landingDecision.route !== '/dashboard') {
    return <Navigate to={landingDecision.route} replace />;
  }

  return <>{children}</>;
};
```

### Phase 2: UX & Routes Standardization (Week 3)

```typescript
// src/pages/ConnectShopify.tsx - NEW
const ConnectShopify = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Your Shopify Store</CardTitle>
          <CardDescription>
            Link your Shopify store to start managing returns with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopifyConnectionForm />
        </CardContent>
      </Card>
    </div>
  );
};

// src/pages/Reconnect.tsx - NEW  
const Reconnect = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reconnect Your Store</CardTitle>
          <CardDescription>
            Your store connection needs to be refreshed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReconnectButton />
        </CardContent>
      </Card>
    </div>
  );
};
```

### Phase 3: Embedded App Hardening (Week 4)

```typescript
// src/utils/appBridgeAuth.ts
export class AppBridgeAuthManager {
  async validateSessionToken(shopDomain: string): Promise<boolean> {
    try {
      const app = createApp({
        apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID!,
        host: getHostParam(),
        forceRedirect: true
      });
      
      const sessionToken = await getSessionToken(app);
      
      // Verify with backend
      const response = await fetch('/api/session/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shop: shopDomain })
      });
      
      return response.ok;
    } catch (error) {
      console.error('App Bridge session validation failed:', error);
      return false;
    }
  }

  triggerTopLevelAuth(shopDomain: string) {
    const authUrl = `/auth/start?shop=${encodeURIComponent(shopDomain)}`;
    if (window.top && window.top !== window.self) {
      window.top.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  }
}
```

### Phase 4: Tests & Observability (Week 5)

```typescript
// src/utils/landingMetrics.ts
export function logLandingDecision(decision: LandingDecision, context: {
  userId: string,
  userAgent: string,
  isEmbedded: boolean,
  shopDomain?: string
}) {
  // Structured logging for observability
  console.log('LANDING_DECISION', {
    decision: decision.reason,
    route: decision.route,
    context,
    timestamp: new Date().toISOString()
  });

  // Analytics event
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'landing_decision', {
      decision_reason: decision.reason,
      target_route: decision.route,
      is_embedded: context.isEmbedded
    });
  }
}
```

**Runnable Commands:**
```bash
# Run landing logic tests
npm run test -- --grep "Landing"

# Run E2E tests  
npx playwright test tests/e2e/landing-flows.spec.ts

# Run security tests
npx playwright test tests/security/oauth-security.spec.ts

# Seed test data
npm run db:seed:test
```

---

## ✅ Acceptance Criteria Validation

### Current Goals Compliance:

**Goal #1: Standalone app flow** ⚠️ PARTIAL
- ✅ "Connect your Shopify store" UI exists (`ShopifyInstallation.tsx`)
- ✅ OAuth initiation works
- ❌ **No unified landing logic** - returning users may see connect screen
- ❌ **Missing systematic token validation**

**Goal #2: Embedded app flow** ❌ INCOMPLETE  
- ✅ Install from Shopify Admin triggers OAuth
- ✅ App Bridge integration exists
- ❌ **Not guaranteed to reuse same merchant record** (potential duplicates)
- ❌ **Missing session token exchange validation**
- ❌ **No embedded/standalone parity verification**

### Required Fixes for Compliance:

1. **Implement `resolveLandingRoute()`** - Centralized decision logic
2. **Database schema updates** - Separate tokens, add merchant status
3. **Unified authentication guard** - Replace fragmented route protection
4. **Embedded session validation** - Proper App Bridge token handling
5. **Duplicate merchant prevention** - Unique constraints + upsert logic

---

## 🔐 Non-Negotiables Status

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| HMAC verification | ✅ DONE | `callback.js:15-31` |
| OAuth state/nonce | ✅ DONE | `callback.js:104-152` |
| SameSite=None cookies | ✅ DONE | `callback.js:250-260` |
| App uninstall webhook | ❌ MISSING | Need webhook handler |
| Unique shop constraints | ⚠️ PARTIAL | Missing shop_id unique |
| Profile ⇄ merchant linking | ✅ DONE | FK exists in profiles |

---

## 🚨 Critical Action Items

### Immediate (This Sprint):
1. **Create `resolveLandingRoute()` function** - Core landing logic
2. **Add missing database constraints** - Unique shop_id, merchant status 
3. **Implement unified route guard** - Replace scattered auth checks
4. **Add merchant status to OAuth callback** - Set status='active' on install

### Next Sprint:
1. **Build comprehensive test suite** - Unit + E2E + Security tests
2. **Add app uninstall webhook** - Mark merchants inactive
3. **Implement token freshness validation** - 24h verification cadence
4. **Add embedded session validation** - App Bridge token verification

### Post-MVP:
1. **Add observability dashboard** - Landing decision metrics
2. **Implement token refresh** - Automatic token renewal
3. **Add merchant migration tools** - Domain change handling
4. **Performance optimization** - Cache landing decisions

---

**Report Complete** ✅  
**Next Step:** Implement Phase 0 database migrations and `resolveLandingRoute()` function