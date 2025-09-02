  1) Quick Reality Check (Pre-Audit)

  What happens today immediately after login/sign-up?
  Your system has dual authentication paths: (1) Standalone users sign in via Supabase Auth and land on /dashboard, which shows a "Connect Shopify Store" setup guide      
  if no merchant session exists. (2) Shopify embedded users complete OAuth → get JWT session cookie → redirect to /auth/inline → then /dashboard with shop/host params.    

  Can a user without a linked Shopify merchant reach any protected features?
  Yes, this is a key gap. Standalone users can access the full dashboard and feature set without any Shopify connection. The dashboard shows a setup guide but doesn't     
  gate access to returns, analytics, or other core features.

  Do returning users ever get asked to reconnect even when already linked?
  Potentially yes. Your AtomicProtectedRoute validates Shopify sessions via /api/session/me, but if that fails, it redirects to /shopify/install even for users with       
  existing valid tokens.

  Are there any redirect loops, dead ends, or "blank" states?
  Yes. Multiple potential loops exist between AtomicProtectedRoute and MerchantProtectedRoute when embedded detection conflicts with session validation. Also, no clear    
   handling of expired/revoked Shopify tokens.

  ---
  2) Inventory the Current System

  Pages/Routes:
  - Auth Entry: /auth (Supabase login/signup)
  - OAuth Flow: /auth/start → Shopify OAuth → /auth/callback → /auth/inline → /dashboard
  - Installation: /shopify/install, /install (both point to ShopifyInstallEnhanced)
  - Dashboard: /dashboard (dual-mode: embedded vs standalone)
  - Protected Features: /returns, /analytics, /settings/* (20+ routes)
  - Admin: /master-admin (separate protection)
  - Debug: /debug-auth, /embed-test, /diagnostic, etc.

  Guards/Middleware:
  - AtomicProtectedRoute: Checks Supabase auth + Shopify session validation
  - MerchantProtectedRoute: Checks MerchantSession context
  - AtomicPublicRoute: Redirects authenticated users away from /auth
  - AppBridgeAwareRoute: Handles embedded app routing decisions

  Data Model/Flags:
  - User Auth: Supabase auth.users + profiles table (role: merchant_staff, master_admin)
  - Merchant Sessions: JWT cookies with { merchantId, shopDomain, sessionId, expiresAt }
  - OAuth State: oauth_states table for CSRF protection
  - Shop Data: Implied merchants table (encrypted access tokens)

  Session/Auth Sources:
  - Standalone: Supabase JWT tokens in localStorage
  - Embedded: JWT session cookies + App Bridge session tokens
  - Admin: Profile role checking via useMerchantProfile

  ---
  3) Trace the Actual Post-Auth Flow (As-Is)

  A. New user, no merchant linked:
  Login/Signup → Supabase auth success → /dashboard → Shows "Connect Shopify Store" setup guide but allows access to all features

  B. Returning user with active link:
  Embedded: Shop admin → App Bridge → /dashboard?shop=X&host=Y → Session validation → Dashboard
  Standalone: Login → /dashboard → AtomicProtectedRoute validates session → Dashboard

  C. Returning user with revoked/uninstalled link:
  AtomicProtectedRoute calls /api/session/me → 401/403 → Redirects to /shopify/install (may cause confusion if they expect reconnect flow)

  D. Deep-link to protected page while unlinked:
  URL like /analytics?shop=X → AtomicProtectedRoute → Session validation fails → Redirects to /shopify/install?shop=X&host=Y (no next param preservation)

  E. Multi-store handling:
  No evidence of multi-store support in current implementation. Single shopDomain per merchant session.

  ---
  4) Root-Cause Analysis

  R1: Source-of-truth drift ✅ CONFIRMED
  - Symptom: AtomicProtectedRoute and MerchantProtectedRoute use different validation logic
  - Cause: AtomicProtectedRoute calls /api/session/me, MerchantProtectedRoute uses MerchantSession context
  - Evidence: Different loading states, different redirect targets between the two guards

  R2: Missing server-side gate ✅ CONFIRMED
  - Symptom: Standalone users access features without Shopify connection
  - Cause: No server-side enforcement of merchant link requirement for protected features
  - Evidence: Dashboard.tsx:148-230 shows setup guide but doesn't block access

  R4: Status modeling gaps ✅ CONFIRMED
  - Symptom: No clear distinction between active/revoked/pending merchant links
  - Cause: JWT session only has expiresAt, no status field for token validity
  - Evidence: No handling of Shopify app uninstalls or token revocation in session structure

  R5: OAuth callback returns nowhere ⚠️ PARTIAL
  - Symptom: OAuth callback redirects to /auth/inline without preserving deep-link targets
  - Cause: No next parameter handling in OAuth flow
  - Evidence: ShopifyAuthCallback and related components don't preserve pre-auth URLs

  R6: Incomplete page inventory ✅ CONFIRMED
  - Symptom: Multiple install pages (/install, /shopify/install) but no dedicated reconnect flow
  - Cause: OAuth error handling uses same install flow regardless of context
  - Evidence: Both revoked users and new users get same installation experience

  R9: Redirect loop or whitelist bugs ✅ CONFIRMED
  - Symptom: Potential loops when embedded detection conflicts with auth state
  - Cause: AppBridgeAwareRoute and AtomicProtectedRoute can create competing redirects
  - Evidence: Complex nested routing logic in AtomicAppRouter.tsx:342-357

  ---
  5) Canonical Decision Model (Crystal Logic)

  | isAuthenticated | hasActiveMerchantLink | merchantStatus | isEmbedded | shop | Target Route                                   | Rationale
       |
  |-----------------|-----------------------|----------------|------------|------|------------------------------------------------|------------------------------------    
  -----|
  | No              | N/A                   | N/A            | No         | No   | /auth                                          | Standalone login required
       |
  | No              | N/A                   | N/A            | Yes        | Yes  | /shopify/install?shop=X&host=Y                 | OAuth installation needed
       |
  | Yes             | No                    | none           | No         | No   | /connect-shopify                               | Force Shopify connection for
  standalone |
  | Yes             | No                    | none           | Yes        | Yes  | /shopify/install?shop=X&host=Y                 | OAuth required for embedded
       |
  | Yes             | Yes                   | active         | Any        | Any  | /dashboard                                     | Full access granted
       |
  | Yes             | No/Yes                | revoked        | Any        | Any  | /reconnect?reason=revoked                      | Explain why reconnect needed
       |
  | Yes             | Yes                   | active         | Yes        | Yes  | Validate shop match → /dashboard or /reconnect | Verify shop domain consistency
       |

  Route Whitelist (No merchant link required):
  /auth, /auth/inline, /shopify/install, /reconnect, /auth/callback, /landing, /return-portal, OAuth debug pages

  ---
  6) Page Contracts

  /auth: Supabase login/signup. On success, evaluate merchant link server-side and redirect per decision table.

  /shopify/install: OAuth initiation with shop validation. Must preserve next param. Shows clear "Install H5 App" messaging.

  /auth/callback: OAuth completion. Validate HMAC, exchange code for token, create/update merchant record, set session cookie, redirect to /auth/inline.

  /auth/inline: Post-OAuth re-embed handler. Verify session cookie, redirect to /dashboard?shop=X&host=Y or next target.

  /dashboard: CRITICAL: Must verify merchant link server-side. If embedded without valid session → redirect to install. If standalone without merchant link → redirect     
  to /connect-shopify.

  /reconnect: New page needed. Same OAuth flow as install but with "Reconnect" messaging and reason explanation.

  ---
  7) Guarding Strategy

  Server Authority: All protected routes must verify merchant link server-side via /api/session/me or equivalent middleware. The merchant JWT session is authoritative.    

  Client-side guards serve UX optimization but cannot bypass server enforcement.

  Enforcement: Return 302 redirects to /connect-shopify?next=X for standalone users, /shopify/install?shop=X&host=Y&next=Z for embedded users.

  ---
  8) Data & Status Model

  Current merchant_sessions:
  { merchantId: string, shopDomain: string, sessionId: string, expiresAt: string }

  Recommended enhancement:
  {
    merchantId: string,
    shopDomain: string,
    sessionId: string,
    expiresAt: string,
    status: 'active' | 'revoked' | 'pending',
    tokenLastValidated: string,
    installationId?: string
  }

  Status transitions:
  - pending → active (OAuth success)
  - active → revoked (API 401, uninstall webhook, manual revocation)
  - revoked → active (successful reconnection)

  ---
  9) Prioritized Fix Plan

  1. Server-side merchant link gate on all protected routes (blocks R2)
  2. Unified session validation in AtomicProtectedRoute (fixes R1)
  3. Add merchant status field to session structure (addresses R4)
  4. Create dedicated /reconnect page with contextual messaging (fixes R6)
  5. Preserve next parameter through OAuth flows (fixes R5)
  6. Simplify routing logic to prevent loops between guards (addresses R9)
  7. Add token validation background job to flip status to revoked
  8. Update Dashboard logic to redirect unlinked standalone users

  ---
  10) Manual Verification Checklist

  1. New user flow: Sign up → Should redirect to /connect-shopify → Block dashboard access until connected
  2. Returning user flow: Login with merchant link → Should go directly to /dashboard
  3. Revoked flow: User with revoked token → Should redirect to /reconnect with explanation
  4. Deep-link return: Visit /analytics while unlinked → Should preserve URL through auth flow
  5. Embedded install: Shopify admin → Install app → Should complete OAuth and embed properly
  6. Embedded revoked: App uninstalled → Revisit → Should show reconnection prompt
  7. Loop prevention: Navigate between protected routes → Should not redirect repeatedly
  8. Master admin: Admin user → Should redirect to /master-admin from /dashboard
  9. Standalone setup: Login without Shopify → Should show setup guide and block features
  10. Session expiry: Wait for token expiration → Should prompt for reconnection gracefully

  Acceptance Criteria: All flows above work without loops, dead ends, or bypassing merchant requirements. Clear user feedback at each step.