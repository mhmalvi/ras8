# H5 Shopify Embedded App - Rollback Guide

## Overview
This document provides step-by-step instructions for safely rolling back the embedded authentication patches if issues are encountered in production.

## 🚨 Emergency Rollback (Under 5 minutes)

If the app is completely broken and merchants cannot access it:

### 1. Quick Environment Rollback
```bash
# Restore previous environment variables (backup your current .env.local first)
cp .env.local .env.local.patched.backup
cp .env.local.backup .env.local  # Restore from backup

# Restart development server
npm run dev
```

### 2. Emergency Database Access Disable RLS
```sql
-- ONLY IN EMERGENCY - This disables security temporarily
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- Re-enable demo policies for immediate access
INSERT INTO auth.policies (/* restore original permissive policies */);
```

### 3. Router Fallback
If routing is broken, quickly modify `src/components/AtomicAppRouter.tsx`:

```typescript
// Emergency fallback - comment out AppBridgeAwareRoute logic
const AppBridgeAwareRoute = ({ children }: { children: React.ReactNode }) => {
  // EMERGENCY: Disable all routing logic
  return <>{children}</>;
};
```

## 🔄 Systematic Rollback Process

### Phase 1: Identify Scope of Issues

**Check these first**:
```bash
# 1. Check if app loads at all
curl -I https://9b75bb04db41.ngrok-free.app/

# 2. Check database connectivity
# Connect to Supabase and run:
SELECT COUNT(*) FROM merchants;

# 3. Check logs for errors
# Check browser console and server logs
```

**Decision Matrix**:
- **Frontend only issues** → Rollback patches 1-4, 7
- **Authentication issues** → Rollback patches 2, 6
- **Database issues** → Rollback patch 8
- **Complete failure** → Full rollback

### Phase 2: File-by-File Rollback Instructions

#### Rollback Patch 1: Embedded Auth Flow
**File**: `src/components/AtomicAppRouter.tsx`

```typescript
// RESTORE ORIGINAL - Replace AppBridgeAwareRoute with:
const AppBridgeAwareRoute = ({ children }: { children: React.ReactNode }) => {
  const { isEmbedded, loading } = useAppBridge();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }
  
  // ORIGINAL BEHAVIOR - Direct dashboard redirect
  if (isEmbedded && window.location.pathname === '/') {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');
    
    const dashboardUrl = `/dashboard${shop || host ? '?' : ''}${shop ? `shop=${encodeURIComponent(shop)}` : ''}${shop && host ? '&' : ''}${host ? `host=${encodeURIComponent(host)}` : ''}`;
    
    console.log('🔄 Embedded app detected, redirecting to dashboard:', { shop, host, url: dashboardUrl });
    return <Navigate to={dashboardUrl} replace />;
  }
  
  if (!isEmbedded && window.location.pathname === '/') {
    return <>{children}</>;
  }
  
  return <>{children}</>;
};
```

#### Rollback Patch 2: Protected Route Auth
**File**: `src/components/AtomicProtectedRoute.tsx`

```typescript
// RESTORE ORIGINAL - Replace validation logic with:
if (!user) {
  // ORIGINAL - Simple shop parameter check
  if (isEmbedded && shop) {
    console.log('🏪 Embedded app with shop parameter, allowing access:', { shop, host });
    return <>{children}</>;
  }
  
  return <Navigate to="/auth" state={{ from: location }} replace />;
}
```

#### Rollback Patch 3: OAuth Start Route
**Files to remove**:
- Delete `src/pages/OAuthStart.tsx`
- Remove route from `AtomicAppRouter.tsx`:

```typescript
// REMOVE THIS LINE:
<Route path="/auth/start" element={<OAuthStart />} />
```

#### Rollback Patch 4: Install OAuth Flow
**File**: `src/pages/ShopifyInstallEnhanced.tsx`

```typescript
// RESTORE ORIGINAL handleInstallClick:
const handleInstallClick = async () => {
  const targetShop = shopInfo?.shop || manualShop;
  
  // ... validation code stays the same ...
  
  setTimeout(() => {
    // ORIGINAL - Always use startOAuthFlow
    startOAuthFlow(shopDomain);
  }, 1500);
};
```

#### Rollback Patch 5: OAuth Callback Handler
**File**: `supabase/functions/shopify-oauth-callback/index.ts`

```typescript
// RESTORE ORIGINAL redirect logic:
const hostParam = btoa(`${shop}/admin`).replace(/=/g, '');
const appUrl = Deno.env.get('VITE_APP_URL') || 'https://930f8f163c65.ngrok-free.app';
const redirectUrl = `${appUrl}/auth/inline?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;

// REMOVE: Initial sync logic, enhanced HTML, etc.
```

**Files to remove**:
- Delete `supabase/functions/initial-merchant-sync/index.ts`

#### Rollback Patch 6: Session Token Middleware
**Files to remove**:
- Delete `src/middleware/sessionTokenMiddleware.ts`
- Delete `supabase/functions/api-with-session-validation/index.ts`
- Delete any imports/usage of session token middleware

#### Rollback Patch 7: CSP Headers
**File**: `index.html`

```html
<!-- REMOVE CSP meta tag -->
<meta charset="UTF-8" />
<!-- Remove the Content-Security-Policy meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**File**: `src/middleware/securityHeaders.ts`

```typescript
// RESTORE ORIGINAL CSP config:
'frame-ancestors': ["'self'", "https://*.shopify.com", "https://*.shopifycloud.com"],
'connect-src': ["'self'", 'https://api.openai.com', 'https://api.stripe.com', 'wss://*.supabase.co', 'https://*.supabase.co', 'wss://*.shopifycloud.com', 'https://*.shopifycloud.com']

// RESTORE:
headers['X-Frame-Options'] = 'SAMEORIGIN';
```

**Files to remove**:
- Delete `src/utils/cspHelpers.ts`

#### Rollback Patch 8: Production RLS Policies
**Database rollback** (BE VERY CAREFUL):

```sql
-- 1. First, backup current state
CREATE TABLE merchants_backup AS SELECT * FROM merchants;
CREATE TABLE returns_backup AS SELECT * FROM returns;
-- ... backup other tables

-- 2. Drop new policies
DROP POLICY IF EXISTS "Merchants can view own record" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own record" ON merchants;  
DROP POLICY IF EXISTS "Service can insert merchants" ON merchants;
-- ... drop all new policies

-- 3. Restore original permissive policies
-- (You'll need to recreate your original policies here)

-- 4. Drop audit triggers
DROP TRIGGER IF EXISTS audit_returns_operations ON returns;
DROP TRIGGER IF EXISTS audit_merchants_operations ON merchants;
DROP FUNCTION IF EXISTS audit_merchant_operations();

-- 5. Optionally disable RLS entirely (least secure)
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
-- ... for other tables
```

### Phase 3: Environment Variables Rollback

**Backup current environment**:
```bash
cp .env.local .env.local.patched.backup
```

**Restore original environment**:
```bash
# Update these to previous working values:
VITE_APP_URL=https://930f8f163c65.ngrok-free.app  # Previous ngrok URL
# Ensure client ID and secret are correct
# Remove any new variables added
```

### Phase 4: Shopify Partner Dashboard Reversion

**Original settings to restore**:
```
App URL: https://930f8f163c65.ngrok-free.app/
Allowed Redirect URLs:
- https://930f8f163c65.ngrok-free.app/functions/v1/shopify-oauth-callback
- https://930f8f163c65.ngrok-free.app/auth/inline  
- https://930f8f163c65.ngrok-free.app/dashboard
- https://930f8f163c65.ngrok-free.app/
```

### Phase 5: Verification After Rollback

**Test these key functions**:
```bash
# 1. App loads
curl -I https://930f8f163c65.ngrok-free.app/

# 2. Database access works  
# Connect to Supabase, try: SELECT * FROM merchants LIMIT 1;

# 3. Existing merchant can access dashboard
# Log in as existing merchant, verify dashboard loads

# 4. OAuth still functions (test with development store)
```

## ⚠️ Common Rollback Issues & Solutions

### Issue 1: Database Connection Errors
**Symptoms**: Can't connect to Supabase
**Solution**: 
```sql
-- Check if service role key is correct
-- Verify database URL hasn't changed
-- Check if RLS policies are blocking service role
```

### Issue 2: Infinite Redirect Loops
**Symptoms**: App keeps redirecting between pages
**Solution**:
```typescript
// Temporarily disable all routing logic
const AppBridgeAwareRoute = ({ children }) => <>{children}</>;
```

### Issue 3: CSP Blocking Resources
**Symptoms**: Console shows CSP violations
**Solution**:
```html
<!-- Remove CSP meta tag entirely -->
<!-- Or use permissive CSP: -->
<meta http-equiv="Content-Security-Policy" content="default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">
```

### Issue 4: Missing Environment Variables
**Symptoms**: App won't start, missing config errors
**Solution**:
```bash
# Check all required vars are present:
echo $VITE_SHOPIFY_CLIENT_ID
echo $SHOPIFY_CLIENT_SECRET  
echo $VITE_APP_URL

# Restore from backup:
cp .env.local.backup .env.local
```

## 📞 Emergency Contacts & Resources

**If rollback fails**:
1. **Contact Details**: [Your emergency contact info]
2. **Supabase Support**: Check dashboard for direct support
3. **Shopify Partner Support**: partners.shopify.com/support

**Critical System Access**:
- **Supabase Dashboard**: [Your project URL]
- **Shopify Partner Dashboard**: [Your partner dashboard]
- **Server Logs**: [Your logging service]

## 🔍 Post-Rollback Analysis

**After successful rollback, document**:
1. **What caused the need for rollback**
2. **Which patches were problematic**  
3. **How long rollback took**
4. **What can be improved for next deployment**

**Create incident report**:
```markdown
## Rollback Incident Report
**Date**: 
**Duration**: 
**Root Cause**: 
**Patches Rolled Back**: 
**Merchant Impact**: 
**Lessons Learned**: 
**Action Items**: 
```

## ✅ Rollback Success Checklist

- [ ] App loads successfully
- [ ] Existing merchants can log in
- [ ] OAuth flow works for new installs
- [ ] Database queries execute without errors
- [ ] No console errors or CSP violations
- [ ] Webhook processing functions normally
- [ ] All API endpoints respond correctly
- [ ] Performance is acceptable
- [ ] Security measures still in place

**Final verification**: Have a real merchant test core functionality before declaring rollback complete.

---

**Remember**: Rollback is a last resort. Always try to fix forward first unless there's immediate danger to merchant data or operations.