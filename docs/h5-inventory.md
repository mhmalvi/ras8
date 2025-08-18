# H5 Shopify App Repository Inventory

## Repository Overview

- **Framework**: React 18.3.1 + Vite 5.4.1
- **Language**: TypeScript
- **UI Library**: Radix UI + Tailwind CSS (shadcn/ui)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM v6
- **Testing**: Vitest + Testing Library
- **Backend**: Supabase Edge Functions
- **Error Monitoring**: Sentry

## Shopify SDK Dependencies

✅ **Found Shopify Dependencies:**
- `@shopify/app-bridge`: ^3.7.10 (Current, good version)

❌ **Missing Critical Shopify Dependencies:**
- `@shopify/shopify-api` - Server-side Shopify API client
- `@shopify/polaris` - Shopify design system (optional but recommended)

## Current App Configuration

### From `shopify.app.toml`:
- **App Name**: `returns-automation` ⚠️ (NEEDS TO BE "H5")
- **Client ID**: `2da34c83e89f6645ad1fb2028c7532dd`
- **Embedded**: ✅ `true`
- **Application URL**: `https://930f8f163c65.ngrok-free.app`
- **API Version**: `2024-01` (should consider upgrading to 2024-10 or 2025-01)

### Scopes:
- read_orders, write_orders ✅
- read_customers ✅  
- read_products ✅
- write_draft_orders ✅
- read_inventory ✅
- read_locations ✅

### Auth Redirect URLs:
- `/functions/v1/shopify-oauth-callback` ✅
- `/auth/inline` ✅
- `/dashboard` ✅
- `/` ✅

## Session Storage Strategy

⚠️ **Session storage implementation not clearly identified**
- Need to investigate Supabase edge functions for session persistence
- No clear session adapter configuration found

## Data Models & Multi-tenancy

Based on file structure analysis:
- ✅ Multi-tenant architecture appears implemented
- ✅ Supabase as backend database
- ✅ Merchant scoping in hooks: `useMasterAdminData`, `useMerchantProfile`

## Webhook Configuration

✅ **Configured Webhooks:**
- orders/create, orders/updated, orders/paid → `/functions/v1/shopify-webhook`
- app/uninstalled → `/functions/v1/shopify-webhook`
- GDPR webhooks → `/functions/v1/shopify-gdpr-webhooks`

## Environment Variables

### Required (.env.local):
- ✅ `VITE_SHOPIFY_CLIENT_ID`
- ✅ `SHOPIFY_CLIENT_SECRET`
- ✅ `VITE_APP_URL`
- ✅ `VITE_DEV_MODE`

### Missing Environment Variables:
- `SHOPIFY_SCOPES` (optional, defined in toml)
- Database connection strings for Supabase
- Webhook verification secrets

## Critical Issues Identified

### 🚨 HIGH PRIORITY:
1. **App Name**: Must change from "returns-automation" to "H5"
2. **Missing Server-side Shopify API**: No @shopify/shopify-api for backend operations
3. **Session Management**: No clear session storage strategy visible
4. **HMAC Verification**: Need to verify webhook signature validation

### ⚠️ MEDIUM PRIORITY:
1. **API Version**: Consider upgrading from 2024-01 to latest
2. **Missing Polaris**: No Shopify design system integration
3. **Environment Validation**: No startup environment validation

### ℹ️ LOW PRIORITY:
1. **Service Worker**: Custom service worker may conflict with App Bridge
2. **Console Suppression**: Heavy console override might hide important errors

## Next Steps

1. ✅ Update app name to "H5" in shopify.app.toml
2. 🔄 Verify App Bridge initialization and embedded detection
3. 🔄 Audit OAuth flow and session management
4. 🔄 Review webhook HMAC verification
5. 🔄 Test multi-tenant data scoping
6. 🔄 Add missing Shopify backend API integration