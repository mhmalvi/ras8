# H5 Shopify Embedded App - Test Plan & Acceptance Criteria

## Overview
This test plan validates the embedded Shopify app OAuth flow, session management, and multi-tenant data isolation after applying the production-ready patches.

## Pre-Test Setup

### 1. Environment Configuration
```bash
# Ensure these environment variables are set correctly
VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
SHOPIFY_CLIENT_SECRET=e993e23eed15e1cef5bd22b300fd062f
VITE_APP_URL=https://9b75bb04db41.ngrok-free.app
SHOPIFY_WEBHOOK_SECRET=e993e23eed15e1cef5bd22b300fd062f
```

### 2. Shopify Partner Dashboard Settings
```
App URL: https://9b75bb04db41.ngrok-free.app/shopify/install
Allowed Redirect URLs:
- https://9b75bb04db41.ngrok-free.app/functions/v1/shopify-oauth-callback
- https://9b75bb04db41.ngrok-free.app/auth/inline
- https://9b75bb04db41.ngrok-free.app/dashboard
- https://9b75bb04db41.ngrok-free.app/
Embedded: ✅ Yes
OAuth Scopes: read_orders,write_orders,read_customers,read_products,write_draft_orders,read_inventory,read_locations
```

### 3. Database Setup
- Apply RLS policies from `PATCHES/08-production-rls-policies.patch`
- Ensure all tables have proper indexes
- Verify audit triggers are active

## Test Scenarios

### 🔴 CRITICAL: Test Case 1 - Fresh Installation from Shopify Admin

**Objective**: Verify complete OAuth flow works without bouncing back to Admin

**Steps**:
1. Open Shopify Admin in Chrome (private/incognito mode)
2. Navigate to Apps section
3. Click "Install" on your test app
4. **Expected**: Redirects to `https://9b75bb04db41.ngrok-free.app/shopify/install?shop=X&host=Y`
5. **Expected**: Shows installation page with shop auto-detected
6. Click "Install Returns Automation" button
7. **Expected**: Breaks out of iframe, shows top-level OAuth consent
8. Approve permissions
9. **Expected**: Redirects through OAuth callback to `/auth/inline`
10. **Expected**: Shows re-embedding loader page
11. **Expected**: App Bridge redirects back to embedded `/dashboard`
12. **Expected**: Dashboard loads successfully inside Shopify Admin iframe

**Acceptance Criteria**:
- ✅ No bouncing back to Admin dashboard during installation
- ✅ OAuth consent appears in top-level window (not iframe)
- ✅ After OAuth, app successfully embeds in Shopify Admin
- ✅ Dashboard shows inside iframe with navigation working
- ✅ Console shows App Bridge initialization messages
- ✅ Merchant record created in database
- ✅ Analytics event logged for `app_installed`

### 🟡 Test Case 2 - Session Token Authentication

**Objective**: Verify API calls use session tokens, not cookies

**Prerequisites**: Complete Test Case 1 first

**Steps**:
1. With app loaded in Shopify Admin, open Chrome DevTools
2. Go to Network tab, clear existing requests
3. Navigate to different pages in the app (Returns, Analytics, Settings)
4. Check API requests in Network tab

**Acceptance Criteria**:
- ✅ API requests include `Authorization: Bearer <token>` header
- ✅ No reliance on third-party cookies for authentication
- ✅ Session tokens are valid JWT format
- ✅ Token validation succeeds on server-side
- ✅ Merchant data properly scoped by shop from token

**Manual Checks**:
```javascript
// In browser console (when app is loaded):
console.log('Session token test');

// Check if App Bridge is available
if (window.app) {
  window.app.idToken().then(token => {
    console.log('Session token:', token);
    // Decode token (don't log in production!)
    console.log('Decoded:', JSON.parse(atob(token.split('.')[1])));
  });
}
```

### 🔴 CRITICAL: Test Case 3 - Host/Shop Parameter Preservation

**Objective**: Ensure host and shop parameters survive all redirects

**Steps**:
1. Start installation with specific shop parameter
2. Monitor URL parameters through entire flow:
   - Installation page → OAuth start → Shopify consent → OAuth callback → Re-embed → Dashboard
3. Verify parameters are preserved at each step

**Acceptance Criteria**:
- ✅ Shop parameter matches original store throughout flow
- ✅ Host parameter properly encoded/decoded
- ✅ No parameter corruption or loss during redirects
- ✅ App Bridge initializes with correct host value

**Debug Commands**:
```javascript
// Check current URL parameters
const params = new URLSearchParams(window.location.search);
console.log('Shop:', params.get('shop'));
console.log('Host:', params.get('host'));

// Decode host parameter
const host = params.get('host');
if (host) {
  try {
    console.log('Decoded host:', atob(host));
  } catch (e) {
    console.log('Host decode failed:', e);
  }
}
```

### 🟡 Test Case 4 - Multi-Tenant Data Isolation

**Objective**: Verify RLS policies prevent cross-tenant data access

**Prerequisites**: Need access to two different Shopify stores

**Steps**:
1. Install app on Store A, create some test data
2. Install app on Store B, create different test data
3. Using database client, verify data isolation:

```sql
-- Test as Store A
SELECT set_config('request.jwt.claims', '{"shop": "store-a.myshopify.com"}', true);
SELECT * FROM returns; -- Should only show Store A data

-- Test as Store B  
SELECT set_config('request.jwt.claims', '{"shop": "store-b.myshopify.com"}', true);
SELECT * FROM returns; -- Should only show Store B data

-- Test invalid shop
SELECT set_config('request.jwt.claims', '{"shop": "invalid-shop.myshopify.com"}', true);
SELECT * FROM returns; -- Should show no data
```

**Acceptance Criteria**:
- ✅ Each store only sees its own data
- ✅ No cross-tenant data leakage
- ✅ Invalid shop tokens return empty results
- ✅ Audit logs capture all operations

### 🟡 Test Case 5 - Initial Data Sync

**Objective**: Verify first-time merchant onboarding syncs required data

**Steps**:
1. Complete fresh installation (Test Case 1)
2. Check database for synced data:

```sql
-- Check merchant record
SELECT * FROM merchants WHERE shop_domain = 'your-test-shop.myshopify.com';

-- Check analytics events
SELECT * FROM analytics_events WHERE event_type IN ('app_installed', 'initial_sync_completed');

-- Check any synced orders (if applicable)
SELECT COUNT(*) FROM orders WHERE merchant_id = (
  SELECT id FROM merchants WHERE shop_domain = 'your-test-shop.myshopify.com'
);
```

**Acceptance Criteria**:
- ✅ Merchant record created with encrypted access token
- ✅ Shop details synced to merchant.settings
- ✅ Installation event logged in analytics_events
- ✅ Initial sync completion event logged
- ✅ Basic store data populated (products/orders if implemented)

### 🟡 Test Case 6 - CSP Headers & Embedding

**Objective**: Verify Content Security Policy allows proper embedding

**Steps**:
1. Load app in Shopify Admin
2. Check console for CSP violations
3. Verify frame-ancestors directive
4. Test App Bridge functionality

**Acceptance Criteria**:
- ✅ No CSP violations in browser console
- ✅ App loads successfully in Shopify iframe
- ✅ App Bridge JavaScript executes without CSP blocks
- ✅ External resources (fonts, APIs) load correctly

**Manual CSP Check**:
```javascript
// In browser console
const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
console.log('CSP:', cspMeta ? cspMeta.getAttribute('content') : 'No CSP found');

// Check for frame-ancestors
if (cspMeta) {
  const csp = cspMeta.getAttribute('content');
  console.log('Frame ancestors allowed:', csp.includes('frame-ancestors'));
  console.log('Shopify domains allowed:', csp.includes('shopify.com'));
}
```

### 🔴 CRITICAL: Test Case 7 - Error Handling & Recovery

**Objective**: Verify graceful error handling during OAuth flow

**Test Scenarios**:

**7a. Invalid Shop Domain**:
1. Try to install with invalid shop: `https://9b75bb04db41.ngrok-free.app/shopify/install?shop=invalid-shop`
2. **Expected**: Error message, no OAuth attempt

**7b. OAuth Rejection**:
1. Start OAuth flow but click "Cancel" on Shopify consent
2. **Expected**: Proper error handling, option to retry

**7c. Network Errors**:
1. Simulate network failure during OAuth callback
2. **Expected**: Error message with retry option

**Acceptance Criteria**:
- ✅ Invalid inputs show clear error messages
- ✅ OAuth cancellation handled gracefully
- ✅ Network errors don't break the app
- ✅ Users can retry failed installations
- ✅ Error states logged for debugging

## Browser Compatibility Testing

### Supported Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Testing
- ✅ iOS Safari (Shopify Mobile Admin)
- ✅ Android Chrome (Shopify Mobile Admin)

## Performance Testing

### Load Time Metrics
- ✅ Initial app load < 3 seconds
- ✅ OAuth redirect < 1 second
- ✅ Dashboard render < 2 seconds
- ✅ API response times < 500ms

## Security Testing

### Authentication Security
- ✅ Session tokens expire appropriately
- ✅ Invalid tokens rejected
- ✅ No sensitive data in client-side storage
- ✅ HTTPS enforced for all requests

### Data Security
- ✅ Access tokens encrypted in database
- ✅ RLS policies prevent unauthorized access
- ✅ Audit trails for all operations
- ✅ Input validation on all endpoints

## Regression Testing Checklist

Before deploying patches, verify existing functionality:

- [ ] Existing merchant logins still work
- [ ] Webhook processing continues functioning
- [ ] Analytics data collection unaffected
- [ ] Returns management features operational
- [ ] AI insights processing working
- [ ] Billing integration functional

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Remove test merchants (BE CAREFUL!)
DELETE FROM analytics_events WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain LIKE '%-test.myshopify.com'
);

DELETE FROM returns WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain LIKE '%-test.myshopify.com'  
);

DELETE FROM merchants WHERE shop_domain LIKE '%-test.myshopify.com';
```

## Success Criteria Summary

✅ **Critical Success Metrics**:
1. Fresh installation completes without bouncing to Admin
2. OAuth flow works in top-level window
3. Session tokens authenticate API calls
4. Multi-tenant data isolation enforced
5. Host/shop parameters preserved throughout flow

✅ **Performance Metrics**:
1. Installation completes in < 30 seconds
2. Dashboard loads in < 3 seconds after OAuth
3. API calls respond in < 500ms

✅ **Security Metrics**:
1. No CSP violations
2. RLS policies prevent cross-tenant access
3. Session tokens properly validated
4. Audit trails capture all operations

## Failure Recovery

If any critical test fails:

1. **Stop deployment immediately**
2. **Investigate root cause using logs**
3. **Apply fixes and re-test**
4. **Document lessons learned**

## Sign-off

- [ ] **Developer**: All patches applied and unit tested
- [ ] **QA**: All test cases pass
- [ ] **Security**: Security review completed  
- [ ] **DevOps**: Production deployment ready

**Test Environment**: `https://9b75bb04db41.ngrok-free.app`
**Test Date**: _________________
**Tested By**: _________________
**Sign-off**: _________________