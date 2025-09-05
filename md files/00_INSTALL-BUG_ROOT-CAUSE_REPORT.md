# Zero-Code Install Failure Root Cause Analysis Report

## Executive Summary

**Installation Status**: 🔴 **CRITICAL FAILURE**  
**App**: H5 Returns Automation SaaS (Shopify Embedded App)  
**Deployment Target**: Vercel (https://ras-5.vercel.app)  
**Test Stores Affected**: RAS-3S, TEST-43, TEST-3SDF, TEST-6666, TEST-42434  

The H5 Shopify embedded app suffers from **multiple critical architectural flaws** preventing successful installation across test stores. Previously installed instances on RAS-3S and TEST-42434 are now showing severe errors including "no authenticated user or merchant found" logs and 404 responses from Supabase edge functions.

**Root Cause**: Fundamental mismatch between Shopify embedded app requirements, Supabase authentication flow, and Vercel deployment configuration.

---

## Symptoms & Reproduction

### Installation Failure Sequence

**Test Environment**: Any Shopify test store  
**Reproduction Steps**:
1. Navigate to Shopify Admin → Apps → Browse Apps
2. Search for "Returns Automation" or access via Partner Dashboard
3. Click "Install" button
4. **Result**: Redirect loops, installation never completes

### Observed Error States

#### 1. Redirect Loop Pattern
```
User clicks "Install" →
Shopify OAuth redirect to /functions/v1/shopify-oauth-callback →
OAuth callback redirects to /?shop=X&host=Y →
AppBridgeAwareRoute redirects to /dashboard?shop=X&host=Y →
AtomicProtectedRoute detects no authenticated user →
Redirects to /shopify/install?shop=X&host=Y →
Installation page starts OAuth again →
INFINITE LOOP
```

#### 2. Console Error Logs
- **Browser**: "no authenticated user or merchant found"
- **Supabase**: "idbo ml..." function not found (404 errors)
- **Network**: Failed WebSocket connections to argus.shopifycloud.com

#### 3. URL Parameter Loss
- Host parameter corruption during redirects
- Shop parameter persists but becomes unreliable
- Session state not maintained across OAuth flow

---

## Observed Logs & Evidence

### 1. Critical Code Paths (File References)

#### OAuth Callback Handler
**File**: `supabase/functions/shopify-oauth-callback/index.ts:239-240`
```typescript
const redirectUrl = `${appUrl}/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;
```

#### App Router Logic
**File**: `src/components/AtomicAppRouter.tsx:158-164`
```typescript
if (currentPath === '/') {
  console.log('🔄 Embedded app on root with shop param, redirecting to dashboard');
  const redirectUrl = host 
    ? `/dashboard?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`
    : `/dashboard?shop=${encodeURIComponent(shop)}`;
  return <Navigate to={redirectUrl} replace />;
}
```

#### Protected Route Authentication Check
**File**: `src/components/AtomicProtectedRoute.tsx:91-106`
```typescript
if (!user) {
  // For embedded apps with valid shop parameters AND valid Shopify session, allow access
  if (isEmbedded && shop && shopifySessionValid) {
    return <>{children}</>;
  }
  
  // For embedded apps without valid session, redirect to OAuth flow
  if (isEmbedded && shop && !shopifySessionValid) {
    const installUrl = `/shopify/install?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host || '')}`;
    return <Navigate to={installUrl} replace />;
  }
  
  // For standalone apps or embedded apps without shop, require authentication
  return <Navigate to="/auth" state={{ from: location }} replace />;
}
```

### 2. Partner Dashboard Configuration Issues

#### Shopify App Configuration
**File**: `shopify.app.toml:4-18`
```toml
client_id = "2da34c83e89f6645ad1fb2028c7532dd"
application_url = "https://ras-5.vercel.app"
embedded = true

[auth]
redirect_urls = [
    "https://ras-5.vercel.app/functions/v1/shopify-oauth-callback",
    "https://ras-5.vercel.app/auth/inline",
    "https://ras-5.vercel.app/dashboard",
    "https://ras-5.vercel.app/"
  ]
```

#### Vercel Proxy Configuration
**File**: `vercel.json:9-11`
```json
{
  "source": "/functions/v1/(.*)",
  "destination": "https://pvadajelvewdazwmvppk.supabase.co/functions/v1/$1"
}
```

### 3. Authentication Flow Breakdown

#### Supabase Auth Context Initialization
**File**: `src/contexts/AtomicAuthContext.tsx:71-88`
```typescript
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError) {
  console.error('❌ Error getting session:', sessionError);
  if (isMounted) {
    setError(sessionError.message);
    setInitialized(true);
    setLoading(false);
  }
}
```

### 4. Critical Console Log Evidence (Production Environment)

#### Live Installation Failure - test42434.myshopify.com
**Environment**: Production (https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app)  
**Test Store**: test42434.myshopify.com  
**Browser**: Chrome 139.0.0.0  
**Timestamp**: 2025-08-24T14:40:26.054Z  

#### Environment Configuration (Confirmed Working)
```javascript
✅ VITE_SHOPIFY_CLIENT_ID: "2da34c83e89f6645ad1fb2028c7532dd"
✅ VITE_APP_URL: "https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app/"
✅ VITE_DEV_MODE: "true"
✅ VITE_SUPABASE_URL: "https://pvadajelvewdazwmvppk.supabase.co"
✅ VITE_SUPABASE_ANON_KEY: ***MASKED***
Mode: production, Dev: false, Prod: true
```

#### App Bridge Initialization (Working)
```javascript
🚀 Initializing App Bridge: {
  clientId: '2da34c83e89f6645ad1fb2028c7532dd', 
  host: 'YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdDQyNDM0', 
  shop: 'test42434.myshopify.com'
}
```

#### Critical Routing Flow (Leading to Loop)
```javascript
🔍 AppBridge Route Analysis: {
  isEmbedded: true, 
  shop: 'test42434.myshopify.com', 
  host: 'present', 
  currentPath: '/', 
  search: '?embedded=1&hmac=2f37ea631ca9261d2477ead782f74ea7c…shop=test42434.myshopify.com&timestamp=1756046434'
}
🔄 Embedded app on root with shop param, redirecting to dashboard
❌ No authenticated user
```

#### Database Access Failure (406 Not Acceptable)
```javascript
GET https://pvadajelvewdazwmvppk.supabase.co/rest/v1/merchants?select=id%2Cshop_domain%2Csettings&shop_domain=eq.test42434.myshopify.com 
Status: 406 (Not Acceptable)

❌ No authenticated user - merchant record: {
  merchant: null, 
  hasSettings: false, 
  oauthCompleted: undefined
}
```

### 4. CSP Header Conflicts

#### Development CSP Configuration
**File**: `vite-csp-plugin.js:10-22`
```javascript
res.setHeader('Content-Security-Policy', [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://*.shopifycloud.com https://ras-5.vercel.app",
  "frame-ancestors 'self' https://*.shopify.com https://*.shopifycloud.com https://admin.shopify.com https://partners.shopify.com",
  // ... additional directives
].join('; '));
```

#### Production Vercel Headers
**File**: `vercel.json:26-28`
```json
{
  "key": "Content-Security-Policy",
  "value": "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://*.shopifycloud.com;"
}
```

---

## Architecture & Flow Mapping

### Current Broken Install Flow (Based on Console Logs)

**Live Failure Sequence** - test42434.myshopify.com:

```
1. User accesses embedded app from Shopify Admin
   ↓
2. App loads: https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app/
   ↓
3. Environment validation ✅ PASSES
   ↓
4. App Bridge initialization ✅ SUCCEEDS:
   - clientId: '2da34c83e89f6645ad1fb2028c7532dd'
   - host: 'YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdDQyNDM0'
   - shop: 'test42434.myshopify.com'
   ↓
5. AppBridgeAwareRoute Analysis:
   - isEmbedded: true
   - shop: 'test42434.myshopify.com'
   - host: 'present'
   - currentPath: '/'
   ↓
6. 🔄 Embedded app redirects to /dashboard ✅
   ↓
7. AtomicProtectedRoute checks authentication:
   - ❌ No authenticated user (Supabase Auth)
   ↓
8. 🚨 CRITICAL FAILURE: Database query for merchant record:
   GET /rest/v1/merchants?shop_domain=eq.test42434.myshopify.com
   → HTTP 406 (Not Acceptable) ❌
   ↓
9. shopifySessionValid = FALSE ❌
   ↓
10. Redirect to: /shopify/install?shop=test42434.myshopify.com
    ↓
11. INFINITE LOOP 🔄 (Process repeats)
```

### Root Cause Location: Step 11

The critical failure occurs in `AtomicProtectedRoute.tsx` where two separate authentication systems conflict:

1. **Supabase Auth** (`user` state) - Never gets populated for Shopify installs
2. **Shopify Session Validation** (`shopifySessionValid`) - Depends on merchant record existing

---

## Root Causes (Prioritized)

### P0 - Authentication Architecture Mismatch

**Severity**: 🔴 **CRITICAL**  
**Files**: 
- `src/components/AtomicProtectedRoute.tsx:91-106`
- `src/contexts/AtomicAuthContext.tsx:44-108`

**Issue**: The app expects traditional Supabase user authentication (`user` state) but Shopify embedded apps should use merchant-based authentication tied to shop domains.

**Evidence**:
```typescript
// AtomicProtectedRoute expects user to be non-null
if (!user) {
  // Redirect logic that breaks embedded apps
}
```

**Console Log Proof**:
```javascript
❌ No authenticated user
❌ No authenticated user - merchant record: {merchant: null, hasSettings: false, oauthCompleted: undefined}
```

**Impact**: All embedded installs fail because `user` is always null for Shopify merchants.

### P0 - Missing Session Token Implementation

**Severity**: 🔴 **CRITICAL**  
**Files**: 
- `supabase/functions/shopify-oauth-callback/index.ts:195-276`
- Missing: Session token creation for embedded apps

**Issue**: OAuth callback successfully stores merchant data but doesn't create a session token that the frontend can use for authentication.

**Evidence**: No JWT/session token generation in OAuth callback for frontend consumption.

**Impact**: Frontend has no way to authenticate against Supabase after successful OAuth.

### P0 - Vercel Proxy Breaking Edge Functions

**Severity**: 🔴 **CRITICAL**  
**Files**: 
- `vercel.json:9-11`

**Issue**: Vercel proxies `/functions/v1/*` to Supabase, but this may be causing headers/context loss.

**Evidence**: "idbo ml..." function not found errors suggest proxy issues.

**Impact**: Edge functions return 404 or malformed responses.

### P0 - RLS Policies Block Merchant Access (HTTP 406 Error)

**Severity**: 🔴 **CRITICAL**  
**Files**: 
- `supabase/migrations/99999999999999_fix_analytics_rls.sql:11-16`
- Multiple migration files with conflicting policies

**Issue**: Row Level Security policies require authenticated Supabase users, but embedded apps authenticate via Shopify sessions.

**Evidence**:
```sql
CREATE POLICY "Authenticated users can read analytics" ON public.analytics_events
FOR SELECT USING (auth.uid() IS NOT NULL);
```

**Console Log Proof** (HTTP 406 Not Acceptable):
```javascript
GET https://pvadajelvewdazwmvppk.supabase.co/rest/v1/merchants?select=id%2Cshop_domain%2Csettings&shop_domain=eq.test42434.myshopify.com
Status: 406 (Not Acceptable)
```

**Impact**: Database queries fail for embedded app users, preventing merchant record lookup and session validation.

### P1 - App Bridge Host Parameter Corruption

**Severity**: 🟡 **HIGH**  
**Files**: 
- `src/components/AppBridgeProvider.tsx:60-70`

**Issue**: Host parameter construction and validation logic is unreliable.

**Evidence**:
```typescript
if (!validHost && shop) {
  validHost = btoa(shop + '/admin').replace(/=/g, '');
  console.log('🔧 Constructed host from shop:', { shop, host: validHost });
}
```

**Impact**: App Bridge initialization fails, breaking embedded app functionality.

### P2 - Environment Variable Inconsistencies

**Severity**: 🟠 **MEDIUM**  
**Files**: 
- `.env.local`
- `vercel.json:40-42`

**Issue**: Multiple environment configurations with potential conflicts.

**Evidence**: VITE_APP_URL defined in both .env.local and vercel.json.

**Impact**: Configuration drift between local and production deployments.

---

## Impact Assessment

### Severity Matrix

| Component | Impact | Blast Radius | Production Risk |
|-----------|---------|--------------|----------------|
| Authentication Flow | **CRITICAL** | All embedded installs | Complete failure |
| Session Management | **CRITICAL** | All authenticated routes | Data access blocked |
| Vercel Proxy | **HIGH** | All edge function calls | API failures |
| RLS Policies | **HIGH** | Database access | Query failures |
| App Bridge Init | **MEDIUM** | Shopify integration | UI degradation |

### Test Store vs Production Differences

The issues affect **ALL deployment environments** equally:
- Test stores and production stores follow identical OAuth flows
- No environment-specific code paths
- Same authentication architecture used across all stores

---

## Dependencies & Assumptions

### Critical Dependencies

1. **Shopify Partner Dashboard Configuration**
   - App URLs must match deployed Vercel instance
   - Redirect URLs must point to functional endpoints
   - Client ID/Secret must be properly configured

2. **Supabase Edge Function Deployment**
   - Functions must be deployed and accessible
   - Environment variables must be set in Supabase
   - Database schema must match application expectations

3. **Vercel Deployment Configuration**
   - Proxy rules must correctly route to Supabase
   - Environment variables must be set
   - Build process must complete successfully

### Architectural Assumptions (Currently Violated)

1. **Authentication Model**: App assumes traditional user authentication ❌
2. **Session Persistence**: App assumes Supabase sessions work for embedded apps ❌
3. **Database Access**: App assumes RLS policies work with Shopify authentication ❌
4. **Host Parameter Integrity**: App assumes host parameter remains valid across redirects ❌

### Shopify Embedded App Requirements (Not Met)

1. **Session Tokens**: Embedded apps should use JWT session tokens ❌
2. **Top-Level OAuth**: OAuth should complete at top-level, then re-embed ❌
3. **SameSite Cookie Handling**: Third-party cookie restrictions not addressed ❌
4. **App Bridge Error Handling**: Proper error handling for embedded context missing ❌

---

## Deployment Environment Analysis

### Vercel Configuration Issues
- Proxy configuration may be causing header loss
- Environment variables not properly synchronized
- CSP headers conflict between dev and production

### Supabase Edge Function Issues
- Functions returning 404 errors suggest deployment or routing problems
- Environment variables may not be properly set
- RLS policies blocking legitimate access

### App Bridge Version Compatibility
- Using @shopify/app-bridge@3.7.10
- May have compatibility issues with current Shopify Admin
- Error handling insufficient for embedded context

**Recommendation**: Complete architectural redesign required to align with Shopify embedded app requirements and Supabase authentication model.