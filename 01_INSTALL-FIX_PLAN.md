# Install Bug Fix Plan - H5 Returns Automation

## Executive Summary

This plan provides a **step-by-step remediation strategy** to fix the critical installation failures affecting the H5 Shopify embedded app across all test stores. The fixes address authentication architecture mismatches, session management, database access policies, and deployment configuration issues.

**Implementation Priority**: P0 items must be completed before any production deployment.  
**Estimated Timeline**: 3-5 development days for P0 fixes, 2-3 days for P1 items.

---

## Partner Dashboard Configuration Checklist

### ✅ Shopify Partner Dashboard Settings

**App URL**: `https://ras-5.vercel.app`  
**App Type**: Embedded app  
**Client ID**: `2da34c83e89f6645ad1fb2028c7532dd` ✅ Already set

#### Redirect URLs (Copy-Paste Configuration)
```
https://ras-5.vercel.app/functions/v1/shopify-oauth-callback
https://ras-5.vercel.app/auth/inline  
https://ras-5.vercel.app/dashboard
https://ras-5.vercel.app/
```

#### Webhook URLs (Copy-Paste Configuration)
```
Orders: https://ras-5.vercel.app/functions/v1/shopify-webhook
App Lifecycle: https://ras-5.vercel.app/functions/v1/shopify-webhook  
GDPR: https://ras-5.vercel.app/functions/v1/shopify-gdpr-webhooks
```

#### App Distribution Settings
- [x] Embedded app
- [x] Distribute via Shopify App Store (when ready)
- [x] Private app distribution enabled for testing

### ⚠️ Required Partner Dashboard Updates
1. **Scopes**: Verify scopes match `shopify.app.toml:10`
2. **URLs**: Confirm all URLs point to Vercel domain (not ngrok)
3. **Webhooks**: Ensure webhook endpoints are configured
4. **App Submission**: Remove "development app" status when ready

---

## 🔄 **ARCHITECTURE MODEL FLIP: Supabase Auth → Merchant Sessions**

### 🚨 **Root Cause Confirmed from Production Failure**

**Test Store**: test42434.myshopify.com  
**Environment**: https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app/  
**Critical Error**: HTTP 406 (Not Acceptable) when querying merchants table  

```javascript
❌ No authenticated user
GET https://pvadajelvewdazwmvppk.supabase.co/rest/v1/merchants?select=id%2Cshop_domain%2Csettings&shop_domain=eq.test42434.myshopify.com
Status: 406 (Not Acceptable)
❌ No authenticated user - merchant record: {merchant: null, hasSettings: false, oauthCompleted: undefined}
```

**The Problem**: App tries to use Supabase user authentication for Shopify embedded apps, which is fundamentally incompatible.

**The Solution**: Complete authentication model flip to "merchant-session" approach:

### 🎯 **New Authentication Model Architecture**

#### ❌ **Remove**: Supabase User Authentication
- Delete dependency on `user` state from AtomicAuthContext
- Remove RLS policies requiring `auth.uid() IS NOT NULL`
- Stop using Supabase anon keys for merchant data access

#### ✅ **Add**: Merchant Session JWTs  
- OAuth success → Create signed JWT with merchant_id, shop_domain, session_id
- Store as HttpOnly, Secure, SameSite=None cookie
- Frontend validates via `/session/me` endpoint
- Database access via server-side proxy with service role

#### ✅ **Add**: Top-Level OAuth + Re-embed Flow
- Install always starts at top-level `/auth` page
- OAuth completes at top-level `/auth/callback`
- Creates session cookie, redirects to `/auth/inline`
- Re-embeds with valid session

#### ✅ **Add**: Server-Side Database Proxy
- Remove fragile Vercel → Supabase function proxying
- Create Vercel API routes that validate session cookies
- Use Supabase service role for database access
- Explicit merchant_id filtering on all queries

---

## P0 - Critical Implementation Steps

**📋 DETAILED IMPLEMENTATION PLAN**: See `MERCHANT-SESSION_IMPLEMENTATION_PLAN.md` for complete code examples and step-by-step implementation.

### 1. Create Merchant Session JWT Service

**Priority**: P0 - CRITICAL  
**Files to Create**: 
- `src/services/merchantSessionService.ts` - JWT creation/validation
- `api/session/me.ts` - Session validation endpoint
- `src/contexts/MerchantSessionContext.tsx` - Replace AtomicAuthContext

**Implementation Details**: 
- JWT creation/validation service with 24-hour expiry
- HttpOnly, Secure, SameSite=None cookies for embedded apps
- Session validation via `/api/session/me` endpoint
- MerchantSessionContext to replace AtomicAuthContext

**Addresses**: HTTP 406 errors, "no authenticated user" console logs

**Validation**: Session cookie created after OAuth, accessible via validation endpoint

---

### 2. Replace Frontend Database Access with Server-Side Proxy

**Priority**: P0 - CRITICAL  
**Files to Create**: 
- `src/services/supabaseServerService.ts` - Server-side Supabase client
- `api/merchants/[merchantId]/returns.ts` - Returns data API
- `api/merchants/[merchantId]/orders.ts` - Orders data API
- `api/merchants/[merchantId]/analytics.ts` - Analytics API

**Implementation**: 
- Remove direct Supabase client calls from frontend
- Create Vercel API routes that validate session cookies
- Use Supabase service role for database access with explicit merchant filtering
- No RLS policy changes needed - server-side filtering ensures tenant isolation

**Addresses**: 
- HTTP 406 (Not Acceptable) errors
- RLS policy conflicts
- Tenant isolation concerns

**Validation**: 
- No HTTP 406 errors in console
- API calls return 200 with merchant data
- Database queries filtered by merchant_id server-side

---

### 3. Remove Vercel Proxying and Create Top-Level OAuth Flow

**Priority**: P0 - CRITICAL  
**Files to Modify**: 
- `vercel.json` - Remove Supabase function proxying
- `src/pages/Auth.tsx` - Top-level OAuth initiation
- `src/components/MerchantProtectedRoute.tsx` - Replace AtomicProtectedRoute

**Implementation**: 
- Remove all `/functions/v1/*` proxy rules from vercel.json
- Create direct Vercel API routes for OAuth flow
- Implement "redirect-once" logic in route guards
- Add top-level OAuth page that sets session cookies

**Addresses**: 
- "idbo ml... 404" function errors
- Infinite redirect loops
- Header stripping issues

**Validation**: 
- OAuth flow completes at top-level without iframe issues
- Session cookies properly set across domains
- No function proxy 404 errors

---

### 4. Add Health Check and Environment Validation

**Priority**: P1 - HIGH  
**Files to Create**:
- `api/health/install.ts` - Installation health check
- Enhanced logging in OAuth flow

**Implementation**:
- Comprehensive health check endpoint
- Environment variable validation
- Session creation testing
- Database connectivity checks

**Validation**: `/api/health/install` returns all systems healthy before deployment

---

## 📋 **COMPLETE IMPLEMENTATION REFERENCE**

**Detailed Code Examples**: See `MERCHANT-SESSION_IMPLEMENTATION_PLAN.md` for:
- Complete JWT session service implementation  
- Full session validation endpoint code
- MerchantProtectedRoute component replacement
- Server-side database proxy services
- Comprehensive health check endpoints
- 6-day implementation timeline with validation criteria

---

## Environment Variables & Deployment Configuration

### Required Environment Variables

#### ⚠️ **URL Mismatch Issue Identified from Console Logs**
**Current Production URL**: https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app/  
**Expected App URL**: https://ras-5.vercel.app  
**Partner Dashboard Configuration**: https://ras-5.vercel.app  

**Action Required**: Update VITE_APP_URL to match actual deployed URL or configure custom domain.

#### Vercel Environment Variables (Production)
```bash
VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
VITE_APP_URL=https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app  
VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Supabase Edge Function Variables
```bash
SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
SHOPIFY_CLIENT_SECRET=e993e23eed15e1cef5bd22b300fd062f
SHOPIFY_WEBHOOK_SECRET=e993e23eed15e1cef5bd22b300fd062f
SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co  
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://ras-5-e65t9r566-info-quadquetechs-projects.vercel.app
```

#### Environment Variable Validation Script
```bash
# Create deployment validation script
echo "Checking Vercel environment variables..."
vercel env ls
echo "Checking Supabase environment variables..." 
supabase functions invoke get-env-status
```

---

## First-Run Data Sync Configuration

### Post-Installation Merchant Sync

#### Step 1: Trigger Initial Sync in OAuth Callback
```typescript
// In shopify-oauth-callback/index.ts after merchant storage
try {
  // Trigger initial data sync
  const syncResponse = await supabase.functions.invoke('shopify-initial-sync', {
    body: {
      merchant_id: merchant.id,
      shop_domain: shop,
      access_token: encryptedToken
    }
  });
  
  console.log('✅ Initial sync triggered for merchant:', merchant.id);
} catch (syncError) {
  console.error('⚠️ Sync trigger failed (non-blocking):', syncError);
  // Don't fail installation if sync fails
}
```

#### Step 2: Create Background Sync Function
```typescript
// Create: supabase/functions/shopify-initial-sync/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const { merchant_id, shop_domain, access_token } = await req.json();
  
  // Sync products, customers, orders in background
  const syncTasks = [
    syncProducts(shop_domain, access_token),
    syncCustomers(shop_domain, access_token), 
    syncOrders(shop_domain, access_token)
  ];
  
  // Run sync tasks in parallel
  await Promise.allSettled(syncTasks);
  
  return new Response(JSON.stringify({ success: true }));
});
```

#### Step 3: UI Loading State During Sync
```typescript
// In Dashboard.tsx - show sync status
const [syncStatus, setSyncStatus] = useState<'syncing' | 'complete' | 'error'>('syncing');

useEffect(() => {
  // Check sync status on load
  checkSyncStatus();
}, []);

const checkSyncStatus = async () => {
  // Query for recent sync events
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('event_type', 'initial_sync_complete')
    .eq('merchant_id', merchantId);
    
  if (events && events.length > 0) {
    setSyncStatus('complete');
  }
};
```

**Validation**: After installation, merchant data should begin syncing in background with UI indicators.

---

## Regression Testing Matrix

### Test Cases by Environment

| Test Case | Chrome | Firefox | Safari | Embedded | Standalone | Production | Preview |
|-----------|--------|---------|---------|----------|------------|------------|---------|
| Fresh Install - TEST-43 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reinstall - RAS-3S | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| OAuth Flow | ❌ | ❌ | ❌ | ❌ | N/A | ❌ | ❌ |
| Dashboard Load | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Data Sync | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### Test Store Configuration

#### Required Test Stores
- **TEST-43**: Fresh install testing
- **RAS-3S**: Reinstall/repair testing  
- **TEST-3SDF**: Edge case testing
- **TEST-6666**: Load testing
- **RAS-5**: Production testing

#### Test Data Requirements
- At least 10 orders per test store
- 5-10 customers per test store
- 5-10 products per test store
- Various return scenarios

---

## Acceptance Criteria

### Primary Success Criteria
1. ✅ **Fresh Install**: User can install app from Shopify Admin without loops
2. ✅ **Dashboard Access**: App loads in embedded context after install
3. ✅ **Data Sync**: Merchant data begins syncing within 30 seconds
4. ✅ **No Console Errors**: No authentication or RLS policy errors
5. ✅ **WebSocket Connection**: Stable connection to argus.shopifycloud.com

### Secondary Success Criteria  
1. ✅ **Multi-Browser**: Works in Chrome, Firefox, Safari
2. ✅ **Reinstall**: Previously installed merchants can reinstall
3. ✅ **Error Recovery**: Graceful error handling for failed installs
4. ✅ **Performance**: Install completes within 15 seconds

### Validation Steps
1. Deploy all P0 fixes to staging environment
2. Test installation flow on TEST-43 store
3. Verify dashboard loads with merchant data
4. Check browser console for errors
5. Validate data sync completion
6. Repeat across all test stores

---

## Implementation Timeline & Owners

### Phase 1: P0 Critical Fixes (3-5 days)
- **Day 1-2**: Authentication architecture (Session tokens, RLS policies)
- **Day 2-3**: Vercel proxy configuration and edge function fixes  
- **Day 3-4**: Testing and validation
- **Day 4-5**: Bug fixes and edge case handling

### Phase 2: P1 High Priority (2-3 days)  
- **Day 1**: Top-level OAuth and App Bridge fixes
- **Day 2**: First-run data sync implementation
- **Day 3**: Regression testing and optimization

### Phase 3: Validation & Production (1-2 days)
- **Day 1**: Production deployment and testing
- **Day 2**: Monitor and resolve any remaining issues

### Risk Assessment
- **High**: Authentication changes may break existing functionality
- **Medium**: Database migration may require downtime
- **Low**: Vercel configuration changes are reversible

**Recommendation**: Implement fixes in staging environment first, then perform comprehensive testing before production deployment.

---

## 🎯 **IMMEDIATE ACTION SUMMARY**

### **Root Cause Resolution**
The HTTP 406 errors and infinite redirect loops are caused by using **Supabase user authentication** for **Shopify embedded apps**. The solution is a complete architecture flip to **merchant-session authentication**.

### **Key Changes Required**
1. **Authentication Model**: Supabase Auth → Merchant Session JWTs
2. **Database Access**: Frontend RLS → Server-side proxy with service role  
3. **OAuth Flow**: Embedded loops → Top-level OAuth + re-embed
4. **Function Calls**: Vercel proxying → Direct Vercel API routes

### **Success Criteria**
- ✅ No HTTP 406 errors in console
- ✅ No "no authenticated user" messages
- ✅ OAuth completes without infinite loops
- ✅ Dashboard loads with merchant data on test42434.myshopify.com
- ✅ Session persists across page refreshes

### **Implementation Priority**
- **Days 1-3**: Merchant session JWT system (Phases 1-2)
- **Days 4-5**: Route protection and database proxy (Phases 3-4)  
- **Day 6**: Health checks and production deployment (Phase 5)

**Next Step**: Begin implementation with `MERCHANT-SESSION_IMPLEMENTATION_PLAN.md` Phase 1.

---

## Emergency Rollback Plan

### Rollback Triggers
- Installation success rate drops below 50%
- Dashboard access failure rate above 10%  
- Database errors increase significantly
- WebSocket connection failures spike

### Rollback Steps
1. Revert Vercel deployment to previous version
2. Rollback database migrations if needed
3. Restore previous Shopify Partner Dashboard configuration
4. Monitor error rates return to baseline
5. Investigate and fix issues in staging

### Rollback Validation
- Verify previous working functionality restored
- Check error rates return to baseline
- Confirm no data loss or corruption
- Document rollback reason and next steps