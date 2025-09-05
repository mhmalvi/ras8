● Phase 1 Analysis Report

  System Architecture Map

  Framework: React 18 + Vite + TypeScript SPA with Supabase backendApp Bridge:
  @shopify/app-bridge@3.7.10Session Storage: Supabase Auth + localStorage for Shopify     
   parametersDatabase: Supabase PostgreSQLQueue: Supabase Edge FunctionsWebhook 
  Handlers: Supabase Edge Functions at /functions/v1/

  Auth and Install Routes Analysis

  Frontend Routes (src/components/AtomicAppRouter.tsx:142-434)

  - /auth - Auth page (AtomicPublicRoute)
  - /auth/callback - Custom OAuth callback handler (line 149)
  - /shopify/install - Shopify installation page (line 146)
  - / - Root landing page with AppBridgeAwareRoute logic (line 232)
  - /dashboard - Main embedded entry point (line 241)

  Backend Routes (Supabase Edge Functions)

  - /functions/v1/shopify-oauth - OAuth initiation
  (supabase/functions/shopify-oauth/index.ts)
  - /functions/v1/shopify-oauth-callback - OAuth callback handler
  (supabase/functions/shopify-oauth-callback/index.ts)
  - /functions/v1/shopify-webhook - Shopify webhook handler
  - /functions/v1/shopify-gdpr-webhooks - GDPR compliance webhooks

  Environment Configuration

  VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
  SHOPIFY_CLIENT_SECRET=e993e23eed15e1cef5bd22b300fd062f
  VITE_APP_URL=https://be14c1221073.ngrok-free.app
  VITE_DEV_MODE=true

  App Bridge Initialization (src/components/AppBridgeProvider.tsx:30-70)

  - Detects host and shop URL parameters
  - Creates App Bridge instance with hardcoded client ID
  - Initializes error handling
  - Sets isEmbedded state based on parameters

  Current Redirect Chain Analysis

  Expected Flow:
  1. Install from Shopify Admin → /shopify/install
  2. OAuth initiation → Shopify OAuth → /functions/v1/shopify-oauth-callback
  3. Callback creates App Bridge redirect HTML → Shopify Admin embedding

  Actual Implementation Issues:
  1. /auth/callback route exists but conflicts with Supabase function
  2. OAuth callback returns HTML with App Bridge redirect (lines 156-176 in
  shopify-oauth-callback)
  3. No proper Top-Level OAuth → re-embed flow

  Critical Findings

  🚨 Root Cause Analysis (Ranked by Likelihood)

  1. MISSING TOP-LEVEL OAUTH RE-EMBED FLOW (HIGH) - The OAuth callback directly tries     
   to use App Bridge instead of implementing the required top-level → re-embed
  sequence for third-party cookie compatibility.
  2. CONFLICTING ROUTE HANDLERS (HIGH) - Frontend /auth/callback route conflicts with     
   expected Supabase Edge Function callback URL.
  3. INVALID HOST PARAMETER (HIGH) - App Bridge initialization may be receiving
  malformed or missing host parameter after OAuth callback.
  4. HARDCODED CLIENT ID MISMATCH (MEDIUM) - Client ID is hardcoded in App Bridge
  provider instead of using environment variable.
  5. NO SESSION PERSISTENCE FOR SHOPIFY CONTEXT (MEDIUM) - No mechanism to persist        
  shop/host between OAuth and embedded app loading.

  Session/Cookie Issues

  - Uses Supabase Auth (not Shopify-specific)
  - No evidence of SameSite=None; Secure cookie handling
  - localStorage used for Shopify parameters
  (src/components/AtomicAppRouter.tsx:103-104)

  Route Existence Issues

  - /auth/callback frontend route may never be reached due to Supabase function
  - All protected routes exist and are properly defined

  Partners Configuration (shopify.app.toml)

  application_url = "https://be14c1221073.ngrok-free.app"
  embedded = true
  redirect_urls = [
    "https://be14c1221073.ngrok-free.app/auth/callback",
    "https://be14c1221073.ngrok-free.app/shopify/install",
    "https://be14c1221073.ngrok-free.app/"
  ]

  Issues:
  - Redirect URL points to frontend route, not Supabase function
  - Should be:
  https://be14c1221073.ngrok-free.app/functions/v1/shopify-oauth-callback

  Risk Assessment

  1. Third-party cookies disabled → App embedded without Top-Level OAuth fails
  2. Host parameter corruption → Argus WebSocket fails, blank admin page
  3. Route mismatch → OAuth callback never reaches handler
  4. Session not preserved → User authenticated but Shopify context lost

  ---

● Update Todos
  ⎿  ☒ Map application architecture and framework
     ☒ Identify all auth and install routes
     ☒ Analyze environment variables and configuration
     ☒ Examine App Bridge initialization
     ☒ Document current redirect chain
     ☒ Validate Top-Level OAuth implementation
     ☒ Check route existence and 404s
     ☒ Audit cookie and session handling
     ☒ Analyze Partners configuration
     ☒ Check health endpoints
     ☒ Generate Phase 1 report

● Phase 2 - Remediation Plan

  Based on the analysis, here's the precise implementation plan to fix the Shopify        
  embedded app installation:

  A) Top-Level OAuth & Re-embed Flow Implementation

  Problem

  Current OAuth callback tries to directly embed using App Bridge, violating
  Shopify's required Top-Level OAuth flow for third-party cookie compatibility.

  Solution

  File: supabase/functions/shopify-oauth-callback/index.ts
  - Replace App Bridge redirect HTML (lines 156-176) with top-level re-embed flow
  - Redirect to /auth/inline?shop={shop}&host={host} instead of App Bridge

  New File: src/pages/AuthInline.tsx
  - Create top-level HTML page that uses App Bridge to redirect back into Shopify
  admin
  - Include proper host validation and error handling

  File: src/components/AtomicAppRouter.tsx
  - Add route: /auth/inline → <AuthInline />

  Acceptance Criteria

  - After OAuth, user lands on top-level /auth/inline page
  - Page automatically redirects user back into Shopify admin with valid host
  - No direct App Bridge usage in OAuth callback response

  B) Fix Partners Configuration URLs

  Problem

  Partners dashboard redirect URLs point to frontend routes instead of Supabase Edge      
  Functions.

  Solution

  File: shopify.app.toml
  - Change redirect URL from /auth/callback to /functions/v1/shopify-oauth-callback       
  - Keep /auth/inline for re-embed step

  Acceptance Criteria

  - OAuth callback reaches Supabase function correctly
  - No 404s during OAuth flow

  C) App Bridge Host Parameter Fixes

  Problem

  Hardcoded client ID and potential host parameter corruption.

  Solution

  File: src/components/AppBridgeProvider.tsx
  - Replace hardcoded client ID with import.meta.env.VITE_SHOPIFY_CLIENT_ID
  - Add host parameter validation and reconstruction
  - Add debug logging for host/shop parameters

  Acceptance Criteria

  - App Bridge initializes with correct host from URL
  - Debug logs show valid host parameter
  - No Argus WebSocket connection errors

  D) Route and Session Management

  Problem

  Frontend /auth/callback route conflicts with OAuth flow.

  Solution

  File: src/components/AtomicAppRouter.tsx
  - Remove unused /auth/callback route (line 149)
  - Ensure /dashboard route preserves shop/host parameters
  - Add host/shop parameter preservation in AppBridgeAwareRoute

  Acceptance Criteria

  - No conflicting routes
  - Dashboard loads with preserved Shopify context
  - URLs include required host parameter

  Implementation Order

  PR 1: OAuth Flow Fix

  1. Update supabase/functions/shopify-oauth-callback/index.ts
  2. Create src/pages/AuthInline.tsx
  3. Add /auth/inline route to AtomicAppRouter
  4. Update shopify.app.toml redirect URLs

  PR 2: App Bridge Hardening

  1. Fix hardcoded client ID in AppBridgeProvider
  2. Add host parameter validation
  3. Remove conflicting /auth/callback route
  4. Add parameter preservation in routing

  PR 3: Testing & Verification

  1. E2E test: Install from dev store → embedded dashboard
  2. Unit tests for URL parameter handling
  3. Integration test for OAuth flow

  Expected URLs After Fix

  Install Flow:
  1. https://admin.shopify.com/store/{store}/apps → Install button
  2. https://be14c1221073.ngrok-free.app/functions/v1/shopify-oauth → OAuth start
  3. Shopify OAuth →
  https://be14c1221073.ngrok-free.app/functions/v1/shopify-oauth-callback
  4. Callback redirects to:
  https://be14c1221073.ngrok-free.app/auth/inline?shop={shop}&host={host}
  5. AuthInline uses App Bridge to redirect to:
  https://admin.shopify.com/store/{store}/apps/{app}?shop={shop}&host={host}
  6. Final embedded URL:
  https://be14c1221073.ngrok-free.app/dashboard?shop={shop}&host={host}

  Test Plan

  E2E Test Steps

  1. Open Shopify admin → Apps → Browse apps
  2. Click "Install" on Returns Automation app
  3. Complete OAuth authorization
  4. Verify landing in embedded dashboard
  5. Verify no console errors (especially Argus WebSocket)
  6. Verify host parameter present in URL

  Expected Results

  - No "There's no page at this address" error
  - No Argus WebSocket failures
  - App loads successfully in Shopify admin iframe
  - All navigation works within embedded context

  The root cause is the missing Top-Level OAuth re-embed flow combined with incorrect     
   Partners configuration URLs. This plan addresses both issues systematically.