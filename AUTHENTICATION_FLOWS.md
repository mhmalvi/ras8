# H5 Returns Automation - Authentication Flows Documentation

## Overview

H5 implements a **dual-stream authentication architecture** that supports both standalone web app usage and Shopify embedded app integration. This document details the complete authentication flows, security implementations, and troubleshooting guidance.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    H5 Dual Authentication System                    │
├─────────────────────────────────────────────────────────────────────┤
│  🌐 STANDALONE MODE          │  🏪 SHOPIFY EMBEDDED MODE            │
│  - Supabase Auth (JWT)       │  - OAuth 2.0 → Merchant JWT          │
│  - Email/Password Login      │  - App Bridge Session Tokens         │
│  - Session Persistence       │  - Top-level → Iframe Re-embed       │
│  - /auth → /dashboard        │  - /auth/start → /auth/callback       │
└─────────────────────────────────────────────────────────────────────┘
```

## Flow 1: Standalone Web App Authentication

### Endpoints
- **Login**: `/auth` 
- **Dashboard**: `/dashboard` (protected)
- **Session**: Supabase Auth JWT tokens

### Process
1. User visits `https://ras-8.vercel.app/auth`
2. Enters email/password credentials
3. Supabase Auth validates and issues JWT
4. JWT stored in localStorage/sessionStorage
5. Protected routes check for valid Supabase session
6. Dashboard shows tenant-isolated data via RLS

### Implementation Files
- `src/pages/Auth.tsx`: Login/signup forms
- `src/contexts/AtomicAuthContext.tsx`: Supabase auth management
- `src/components/AtomicProtectedRoute.tsx`: Route protection
- Database RLS policies ensure tenant isolation

## Flow 2: Shopify Embedded App Authentication

### Endpoints
- **Install Initiation**: `/auth/start?shop=<domain>`
- **OAuth Callback**: `/auth/callback` 
- **Re-embed**: `/auth/inline?shop=<domain>&host=<host>`
- **Session Validation**: `/api/session/me`

### Installation Process

#### Step 1: Top-Level OAuth Initiation
```typescript
// From Shopify Admin → Install App
https://ras-8.vercel.app/auth/start?shop=example.myshopify.com

// Validates shop domain, generates CSRF state
// Breaks out of iframe, redirects to:
https://example.myshopify.com/admin/oauth/authorize?
  client_id=2da34c83e89f6645ad1fb2028c7532dd&
  scope=read_orders,write_orders,...&
  redirect_uri=https://ras-8.vercel.app/auth/callback&
  state=<encrypted-state>
```

#### Step 2: OAuth Callback & Session Creation
```typescript
// After merchant consent, Shopify redirects to:
https://ras-8.vercel.app/auth/callback?
  code=<auth-code>&
  shop=example.myshopify.com&
  state=<state>&
  hmac=<signature>

// Server validates HMAC, exchanges code for access token
// Creates encrypted merchant record in database
// Issues merchant JWT session cookie (HttpOnly, SameSite=None)
// Redirects to re-embed endpoint
```

#### Step 3: Re-embed in Shopify Admin
```typescript
// Callback redirects to:
https://ras-8.vercel.app/auth/inline?
  shop=example.myshopify.com&
  host=<base64-host>

// Page detects valid session cookie
// Redirects to embedded dashboard:
https://ras-8.vercel.app/dashboard?shop=example.myshopify.com&host=<host>
```

#### Step 4: Embedded Runtime Authentication
```typescript
// Dashboard loads App Bridge, requests session token
// Each API call includes: Authorization: Bearer <app-bridge-token>
// Server validates App Bridge token OR session cookie
// Returns merchant-scoped data
```

### Implementation Files

#### Server-Side (API Routes)
- `api/auth/start.ts`: OAuth initiation with CSRF protection
- `api/auth/callback.ts`: OAuth callback, token exchange, session creation
- `api/session/me.ts`: Session validation for both auth methods

#### Client-Side (React Components)
- `src/pages/OAuthStart.tsx`: OAuth initiation UI
- `src/pages/AuthInline.tsx`: Post-OAuth re-embed handler  
- `src/contexts/MerchantSessionContext.tsx`: Embedded auth management
- `src/components/MerchantProtectedRoute.tsx`: Embedded route protection

#### Configuration
- `shopify.app.toml`: Partner Dashboard app settings
- `vercel.json`: Route rewrites and CSP headers
- `supabase/migrations/`: OAuth state tracking table

## Security Implementation

### CSRF Protection
- OAuth state parameter includes encrypted timestamp and nonce
- State validated and marked as used in database
- 10-minute expiration window

### HMAC Validation
```typescript
// Every Shopify request validated against shared secret
function validateHmac(query: any, secret: string): boolean {
  const { hmac, ...rest } = query;
  const sortedParams = Object.keys(rest).sort()
    .map(key => `${key}=${rest[key]}`).join('&');
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams).digest('hex');
  return calculatedHmac === hmac;
}
```

### Token Encryption
- Shopify access tokens encrypted using AES-256-GCM
- Encryption key derived from client secret
- Version tracking for key rotation

### Session Management
- Merchant JWTs signed with server secret
- HttpOnly cookies prevent XSS attacks
- SameSite=None for iframe compatibility
- 24-hour expiration with refresh capability

### Content Security Policy
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.shopify.com;
  frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com;
  connect-src 'self' https://*.shopify.com https://pvadajelvewdazwmvppk.supabase.co;
```

## Database Schema

### OAuth State Tracking
```sql
CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  shop_domain TEXT NOT NULL,
  host_param TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL
);
```

### Merchant Records
```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL, -- encrypted
  token_encrypted_at TIMESTAMPTZ,
  token_encryption_version INTEGER DEFAULT 3,
  plan_type TEXT DEFAULT 'starter',
  settings JSONB DEFAULT '{}'::jsonb
);
```

## Testing

### Playwright E2E Tests
```bash
# Run authentication flow tests
npm run test:e2e tests/e2e/shopify-auth-flow.spec.ts

# Test coverage:
# - OAuth initiation and redirect
# - Embedded app routing
# - CSP header validation  
# - Session validation endpoints
# - Invalid shop domain handling
# - Security token exposure checks
```

### Manual Testing URLs
```bash
# OAuth start (should redirect to Shopify)
https://ras-8.vercel.app/auth/start?shop=test-store.myshopify.com

# Embedded app (should redirect to install if no session)
https://ras-8.vercel.app/dashboard?shop=test-store.myshopify.com&host=<host>

# Session validation (should return 401)
https://ras-8.vercel.app/api/session/me

# Standalone auth (should show login form)
https://ras-8.vercel.app/auth
```

## Environment Variables

### Required for Production
```bash
# Shopify Configuration
VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
SHOPIFY_CLIENT_SECRET=<secret-from-partner-dashboard>

# Application URLs  
VITE_APP_URL=https://ras-8.vercel.app

# Database & Auth
VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# JWT Signing
JWT_SECRET_KEY=<strong-random-secret>
```

### Shopify Partner Dashboard Configuration
```
App URL: https://ras-8.vercel.app
Redirect URLs: https://ras-8.vercel.app/auth/callback
Webhook URLs:
  - Orders: https://pvadajelvewdazwmvppk.supabase.co/functions/v1/enhanced-shopify-webhook
  - GDPR: https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-gdpr-webhooks
```

## Troubleshooting

### Common Issues

#### "Installation never completes"
- **Cause**: OAuth redirect URL mismatch
- **Fix**: Verify `shopify.app.toml` redirect URLs match Partner Dashboard
- **Check**: Browser network tab shows 302 redirect to `/auth/callback`

#### "No authenticated user found" 
- **Cause**: Session cookie not set or App Bridge token missing
- **Fix**: Check `/api/session/me` response, verify cookie headers
- **Check**: Console shows App Bridge token retrieval logs

#### "Frame ancestors CSP violation"
- **Cause**: Missing or incorrect CSP headers
- **Fix**: Verify `vercel.json` CSP includes `https://admin.shopify.com`
- **Check**: Response headers contain frame-ancestors directive

#### "Redirect loops in embedded mode"
- **Cause**: Authentication check routing conflicts  
- **Fix**: Review `MerchantProtectedRoute` logic and App Bridge detection
- **Check**: Console logs show routing decisions

### Debug Tools

#### Session Validation
```bash
# Test with shop parameter
curl -H "Shop: test-store.myshopify.com" \
  https://ras-8.vercel.app/api/session/me

# Test with App Bridge token (from browser console)
curl -H "Authorization: Bearer <app-bridge-token>" \
  https://ras-8.vercel.app/api/session/me
```

#### OAuth Flow Validation
```bash
# Check OAuth start redirects properly  
curl -I "https://ras-8.vercel.app/auth/start?shop=test-store.myshopify.com"

# Verify callback handles errors correctly
curl -I "https://ras-8.vercel.app/auth/callback" # Should return 400
```

## Migration Notes

### From Previous Authentication System
1. Existing cookie-based sessions remain valid for 24 hours
2. New installs use the JWT session system
3. App Bridge token validation is backwards compatible
4. RLS policies updated to support merchant JWT claims

### Breaking Changes
- Removed multiple redirect URLs (consolidated to single callback)
- Service role key no longer exposed in client environment 
- OAuth state tracking requires database migration
- CSP headers strengthened (may block some third-party resources)

---

**Version**: 8.0.0  
**Last Updated**: August 25, 2025  
**Contact**: engineering@h5returns.com