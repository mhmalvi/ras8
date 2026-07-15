# Full Codebase Audit Prompt — RAS8 Returns Automation SaaS

> **Instructions**: Copy this entire prompt into a fresh Claude Code session (or any AI coding assistant with full file access). It will perform a 100% end-to-end audit of the RAS8 codebase and produce a detailed report.

---

## PROMPT START

You are a senior full-stack software auditor. Your mission is to perform a **complete, 100% coverage audit** of the RAS8 (Returns Automation SaaS) codebase. This is a Shopify embedded app built with React + TypeScript + Vite + Supabase + Deno Edge Functions.

### PROJECT CONTEXT

- **Root directory**: `I:\CYBERPUNK\ras8-dep\ras8\`
- **Tech stack**: React 18, TypeScript 5.5, Vite 5, Tailwind CSS 3.4, shadcn/ui, Supabase (PostgreSQL + Auth + Edge Functions), Shopify App Bridge 3, Stripe billing, OpenAI (gpt-4o-mini), Sentry, n8n automation, Winston logging
- **Architecture**: Multi-tenant SaaS with RLS, dual auth (Supabase Auth + Shopify Session Tokens), edge-first backend (no Express server), RBAC (merchant_admin, merchant_staff, master_admin)
- **Package manager**: Bun (bun.lockb)
- **Dev server**: localhost:8082
- **Deployment**: Vercel (frontend) + Supabase (backend/DB/edge functions)

### KEY ARCHITECTURAL FACTS

1. **Dual Authentication**: Supabase Auth (standalone) + Shopify App Bridge session tokens (embedded mode) coexist. Route guards: `UnifiedProtectedRoute`, `AtomicProtectedRoute`, `MerchantProtectedRoute`
2. **Multi-Tenancy**: Every data table uses `merchant_id` FK chain with PostgreSQL RLS enforcement. DB function `get_current_user_merchant_id()` provides tenant context.
3. **Edge-First Backend**: No Express/Node server. All backend logic lives in 20+ Supabase Edge Functions (Deno runtime). Frontend calls via `supabase.functions.invoke()`.
4. **RBAC**: Three roles — `merchant_admin`, `merchant_staff`, `master_admin`. DB function `is_master_admin()` gates system routes.
5. **TypeScript Strictness DISABLED**: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` — this is a known risk surface.
6. **Console Override**: `main.tsx` patches `console.error/warn/log` to suppress Shopify platform noise — potential error masking.
7. **50+ SQL Migrations**: Date-ordered from 2025-06-30 through 2025-09-06 in `supabase/migrations/`.
8. **Client-Side Security Middleware**: Rate limiting and security headers are enforced client-side in `src/middleware/` — bypassable by attackers.

---

### AUDIT SCOPE — 100% COVERAGE

You must audit **every single file** in the codebase. Do not skip anything. For each section below, read ALL relevant files, analyze them, and document findings.

**IMPORTANT EXECUTION RULES:**
- Read files in batches using parallel tool calls for speed
- Use `Grep` to search for patterns across the entire codebase
- Use `Glob` to discover all files in each directory
- Run `bun run test:run`, `bun run test:coverage`, `bun run build`, and `bun run lint` to capture real output
- Search for hardcoded secrets with regex patterns: `/(sk_|pk_|ghp_|gho_|xox[bpas]-|AKIA|password\s*=\s*['"]).*/`
- Track every file you read in a running inventory for Appendix A

---

## PHASE 1: STRUCTURAL & CONFIGURATION AUDIT

Read and audit these files/directories:

### 1. Package & Dependencies — `package.json`
- [ ] Check for outdated dependencies (major version gaps)
- [ ] Check for known vulnerable packages (CVEs)
- [ ] Check for unused dependencies (installed but never imported)
- [ ] Check for missing dependencies (imported but not in package.json)
- [ ] Check for duplicate functionality (multiple libs doing the same thing, e.g., `jose` + `jsonwebtoken`)
- [ ] Verify all scripts work and are correctly defined
- [ ] Check for dev dependencies in production bundle

### 2. TypeScript Configuration — `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- [ ] Audit `strict: false` — document every place where strict mode would catch bugs
- [ ] Check `noImplicitAny: false` — find all implicit `any` types that hide bugs
- [ ] Check `strictNullChecks: false` — find potential null/undefined runtime crashes
- [ ] Verify path aliases resolve correctly
- [ ] Check target/module settings match deployment environment

### 3. Vite Configuration — `vite.config.ts`
- [ ] Audit code-splitting strategy (manual chunks)
- [ ] Check CSP plugin (`vite-csp-plugin.js`) for correctness and completeness
- [ ] Check WebSocket plugin (`vite-websocket-plugin.js`) for security
- [ ] Verify build optimization settings
- [ ] Check for source map exposure in production
- [ ] Audit cache-busting strategy

### 4. Environment Variables — `.env.example`, `.env.local`, `.env.mcp`
- [ ] Check for hardcoded secrets anywhere in the codebase (grep for API keys, tokens, passwords)
- [ ] Verify all required env vars are documented in `.env.example`
- [ ] Check env var validation at startup (`main.tsx` validation)
- [ ] Look for env vars used but not validated
- [ ] Check for sensitive env vars exposed to client (`VITE_` prefix leaks to browser)

### 5. Supabase Configuration — `supabase/config.toml`
- [ ] Verify project settings
- [ ] Check JWT settings and expiry
- [ ] Audit edge function configuration

---

## PHASE 2: SECURITY AUDIT (CRITICAL)

This is the highest-priority section. Read EVERY file in `src/middleware/` and all auth-related code.

### 6. Authentication & Authorization
- [ ] Audit `src/contexts/AtomicAuthContext.tsx` — session management, token refresh, sign-out handling
- [ ] Audit `src/contexts/MerchantSessionContext.tsx` — Shopify session token flow
- [ ] Audit `src/components/AppBridgeProvider.tsx` — embedded detection, App Bridge initialization
- [ ] Check ALL route guards: `UnifiedProtectedRoute`, `AtomicProtectedRoute`, `MerchantProtectedRoute`
- [ ] Verify no protected routes are accessible without auth
- [ ] Check for auth bypass vulnerabilities (direct URL access, parameter tampering)
- [ ] Audit the dual-auth model for conflicts/gaps between Supabase Auth and Shopify sessions
- [ ] Check JWT validation in edge functions — verify EVERY edge function validates auth
- [ ] Identify edge functions that skip JWT verification and assess risk

### 7. Row Level Security (RLS) — Read ALL migration files in `supabase/migrations/`
- [ ] Verify RLS is enabled on EVERY table
- [ ] Check every RLS policy for correctness (no tenant data leakage)
- [ ] Look for tables without RLS policies
- [ ] Check for RLS bypass via service role key usage
- [ ] Verify `merchant_id` foreign key chain is consistent across all tables
- [ ] Check for SQL injection in any raw queries

### 8. Input Validation & Sanitization
- [ ] Audit ALL Zod schemas in `src/schemas/` — check for missing validations
- [ ] Check `src/middleware/inputValidation.ts` for completeness
- [ ] Find all user inputs that bypass Zod validation
- [ ] Check for XSS vulnerabilities in rendered user content
- [ ] Check for prototype pollution vectors
- [ ] Audit URL parameter handling throughout

### 9. Middleware & Security Headers
- [ ] Audit `src/middleware/securityMiddleware.ts`
- [ ] Audit `src/middleware/rateLimitMiddleware.ts` — **FLAG: client-side rate limiting is bypassable**
- [ ] Audit `src/middleware/securityHeaders.ts`
- [ ] Audit `src/middleware/sessionTokenMiddleware.ts`
- [ ] Audit `src/middleware/edgeFunctionSecurity.ts`
- [ ] Check CORS configuration in every edge function
- [ ] Verify CSP headers are complete and correct

### 10. Secrets & Token Management
- [ ] Audit `tokenEncryptionService.ts` — encryption algorithm, key management
- [ ] Audit `tokenMigration.ts` — migration safety
- [ ] Check Shopify access token storage security
- [ ] Verify no tokens/secrets logged to console or Sentry
- [ ] Check for secrets in frontend bundle (`VITE_` prefix exposure)
- [ ] Grep entire codebase for: `sk_live`, `sk_test`, `pk_live`, `password`, `secret`, `apikey`, `private_key`

---

## PHASE 3: FRONTEND AUDIT

### 11. React Components — Read ALL files in `src/components/`
- [ ] Check for memory leaks (missing cleanup in useEffect, unsubscribed listeners)
- [ ] Check for stale closure bugs
- [ ] Audit error boundaries — are all critical paths wrapped?
- [ ] Check for missing loading states
- [ ] Check for missing error states
- [ ] Verify accessibility (a11y): ARIA labels, keyboard navigation, focus management
- [ ] Check for hardcoded strings that should be externalized
- [ ] Look for dead/unreachable components
- [ ] Check for prop drilling that should use context/state management
- [ ] Audit conditional rendering logic for edge cases

### 12. Custom Hooks — Read ALL 39 files in `src/hooks/`
- [ ] Check for proper dependency arrays in useEffect/useMemo/useCallback
- [ ] Check for race conditions in async hooks
- [ ] Verify cleanup functions exist where needed
- [ ] Check for infinite re-render loops
- [ ] Audit TanStack Query usage (staleTime, cacheTime, error handling, retry logic)
- [ ] Look for hooks that duplicate functionality
- [ ] Check for hooks with side effects that should be services

### 13. Pages — Read ALL 58 files in `src/pages/`
- [ ] Verify every page has proper auth guards at the router level
- [ ] Check for pages that fetch data without tenant context (`merchant_id`)
- [ ] Audit loading/error/empty states
- [ ] Check for direct Supabase calls that bypass the service layer
- [ ] Verify proper SEO/meta tags where needed

### 14. Routing — `src/components/AtomicAppRouter.tsx`
- [ ] Map every route and verify its protection level
- [ ] Check for route conflicts or overlapping patterns
- [ ] Verify 404 handling
- [ ] Check for dead routes (routes to deleted pages)
- [ ] Audit redirect logic (especially OAuth callbacks)
- [ ] **FLAG: Check if debug/diagnostic routes (`/debug-auth`, `/embed-test`, `/embed-debug`, `/start-oauth`, `/diagnostic`, `/quick-test`, `/partner-platform-test`, `/environment-test`) are accessible in production**

---

## PHASE 4: BACKEND / EDGE FUNCTIONS AUDIT

### 15. Supabase Edge Functions — Read ALL files in `supabase/functions/`

Audit EVERY edge function individually for:
- [ ] Authentication (JWT verification present?)
- [ ] Input validation (request body/params validated?)
- [ ] Error handling (no stack traces leaked to client?)
- [ ] CORS headers (correct origins?)
- [ ] Rate limiting (any server-side throttling?)
- [ ] Proper HTTP status codes
- [ ] Response format consistency

Specific critical checks:
- [ ] **AI functions** (`analyze-return-risk`, `generate-exchange-recommendation`, `generate-advanced-recommendation`, `generate-analytics-insights`, `generate-customer-message`, `predict-return-trends`): Check for prompt injection vulnerabilities — is user input sanitized before being sent to OpenAI?
- [ ] **Shopify OAuth** (`shopify-oauth-start`, `shopify-oauth-callback`, `shopify-oauth`): Check CSRF protection, state parameter validation, token theft prevention
- [ ] **Stripe webhook** (`stripe-webhook-handler`): Verify Stripe signature verification (`stripe.webhooks.constructEvent`)
- [ ] **GDPR webhooks** (`shopify-gdpr-webhooks`): Verify compliance with all three mandatory webhooks (customer data request, customer erasure, shop erasure)
- [ ] **Functions without JWT** (`get-shopify-config`, `stripe-webhook-handler`, `system-health-check`): Assess exposure risk of unauthenticated endpoints

### 16. Database Migrations — Read ALL 50+ migration files in `supabase/migrations/`
- [ ] Check migration order and dependencies
- [ ] Look for destructive migrations without rollback
- [ ] Verify indexes exist for frequently queried columns
- [ ] Check for missing foreign key constraints
- [ ] Audit database functions for SQL injection
- [ ] Check for unused tables or columns
- [ ] Verify enum types are consistent
- [ ] Check for migrations that drop RLS policies without re-adding them

---

## PHASE 5: SERVICE LAYER AUDIT

### 17. Services — Read ALL files in `src/services/`
- [ ] Audit `merchantService.ts` — tenant isolation in every query
- [ ] Audit `returnService.ts` / `merchantReturnsService.ts` — business logic correctness
- [ ] Audit `shopifyService.ts` — API rate limiting, error handling, token usage
- [ ] Audit `stripeService.ts` — subscription handling, webhook processing, plan enforcement
- [ ] Audit `aiService.ts` — prompt injection defense, API key security, error fallbacks
- [ ] Audit `analyticsService.ts` — data accuracy, query performance
- [ ] Audit `notificationService.ts` — delivery reliability
- [ ] Audit `monitoringService.ts` — metric accuracy
- [ ] Audit `n8nService.ts` / `enhancedN8nService.ts` — webhook security, URL validation
- [ ] Check for services making direct DB calls vs using RPC functions
- [ ] Verify error handling is consistent across all services
- [ ] Check for unhandled promise rejections (missing `.catch()` or try/catch)

---

## PHASE 6: UTILITIES & SHARED CODE AUDIT

### 18. Utilities — Read ALL 35+ files in `src/utils/`
- [ ] Audit `edgeFunctionHelper.ts` — error handling, retry logic, timeout handling
- [ ] Audit `healthCheck.ts` — monitoring completeness
- [ ] Check for utility functions with hidden side effects
- [ ] Look for duplicated utility logic across files
- [ ] Verify type safety in utility functions
- [ ] Check for utils that should be services (business logic in utils)

### 19. Types — Read ALL files in `src/types/`
- [ ] Check Supabase types (`src/integrations/supabase/types.ts`) match actual DB schema from migrations
- [ ] Look for `any` types that weaken type safety
- [ ] Check for type inconsistencies between frontend and edge functions
- [ ] Verify enum types match database enums

---

## PHASE 7: TESTING AUDIT

### 20. Test Coverage Analysis
- [ ] **RUN**: `bun run test:run` — capture pass/fail results
- [ ] **RUN**: `bun run test:coverage` — capture coverage percentages
- [ ] Identify all untested files (aim for 100% file coverage)
- [ ] Check test quality — are tests testing behavior or implementation details?
- [ ] Audit test mocks in `src/test/` — are mocks accurate representations?
- [ ] Check for tests that always pass (false positives / tautological assertions)
- [ ] Check for flaky tests (timing-dependent, order-dependent)
- [ ] Verify edge function tests exist (or document their absence)
- [ ] Check E2E test coverage (Playwright config exists — are there actual test files?)
- [ ] **List ALL untested files** grouped by category:

| Category | Untested Files |
|----------|---------------|
| Components | [list each] |
| Hooks | [list each] |
| Services | [list each] |
| Utils | [list each] |
| Pages | [list each] |
| Edge Functions | [list each] |
| Middleware | [list each] |
| Contexts | [list each] |

---

## PHASE 8: PERFORMANCE AUDIT

### 21. Bundle Size & Loading
- [ ] **RUN**: `bun run build` — capture output sizes and any warnings
- [ ] Analyze chunk sizes from build output
- [ ] Check for large dependencies that could be lazy-loaded (Recharts, Framer Motion, etc.)
- [ ] Verify code splitting is effective (check manual chunks in vite.config.ts)
- [ ] Check for unnecessary re-renders (missing React.memo, useMemo, useCallback)
- [ ] Audit image/asset optimization in `public/`

### 22. Database Performance
- [ ] Check for N+1 query patterns in services
- [ ] Verify indexes exist for all WHERE/JOIN/ORDER BY columns in migrations
- [ ] Audit `get_dashboard_metrics_optimized` for actual optimization
- [ ] Check for queries without pagination (fetching unbounded result sets)
- [ ] Look for full table scans (queries without index support)

### 23. API Performance
- [ ] Check TanStack Query caching strategy across all hooks
- [ ] Verify request deduplication (no duplicate fetches on mount)
- [ ] Check for waterfall request patterns (sequential when could be parallel)
- [ ] Audit Shopify API rate limit handling in `shopifyService.ts`

---

## PHASE 9: RELIABILITY & ERROR HANDLING AUDIT

### 24. Error Handling
- [ ] Check ErrorBoundary coverage — are all route trees wrapped?
- [ ] Verify Sentry integration catches all unhandled errors
- [ ] Check `initSentry` configuration for completeness (DSN, environment, tracing, replay)
- [ ] **Search for swallowed errors**: `catch\s*\(\s*\)\s*\{?\s*\}?` and `.catch\(\(\)\s*=>\s*\{\s*\}\)`
- [ ] Audit toast/notification error feedback to users
- [ ] Check for errors that crash the app vs. graceful degradation
- [ ] Verify edge function error responses don't leak internal details (stack traces, SQL errors)

### 25. Resilience
- [ ] Check for retry logic on critical operations (payments, webhooks)
- [ ] Verify service worker (`public/sw.js`) handles offline gracefully
- [ ] Check for race conditions in concurrent operations
- [ ] Audit webhook processing for idempotency (duplicate webhook delivery)
- [ ] Check for data consistency in multi-step operations (partial failures)

---

## PHASE 10: DEPLOYMENT & DEVOPS AUDIT

### 26. Build & Deploy
- [ ] Audit `scripts/deployment-workflow.js` for safety and completeness
- [ ] **FLAG: No GitHub Actions CI/CD pipeline found** — document risk and recommend pipeline
- [ ] Verify environment variable validation runs before deploy
- [ ] Check for production vs development configuration leaks
- [ ] Audit Vercel deployment configuration (if `vercel.json` exists)
- [ ] Check for missing health check endpoints in production

### 27. Observability
- [ ] Verify Sentry configuration (`scripts/verify-sentry-config.cjs`)
- [ ] Check Winston logging levels and rotation
- [ ] Audit monitoring metrics collection (`monitoring_metrics` table)
- [ ] Verify alert rules are properly configured (`alert_rules` table)
- [ ] Check for missing logging in critical paths (auth, payments, webhooks)

---

## PHASE 11: CODE QUALITY AUDIT

### 28. Code Quality
- [ ] **RUN**: `bun run lint` — capture all violations
- [ ] Search for `console.log` statements that should be removed
- [ ] Search for `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP` comments — list each with context
- [ ] Look for dead code (unused exports, unreachable branches)
- [ ] Check for inconsistent naming conventions
- [ ] Look for god components (>500 lines) that should be split — list each with line count
- [ ] Check for circular dependencies between modules
- [ ] **Audit the console.error/warn/log override in main.tsx** — document exactly which errors are being suppressed and whether legitimate errors could be masked

### 29. Documentation Accuracy
- [ ] Cross-reference `md files/README.md` with actual codebase state
- [ ] Check if deployment docs match actual deployment process
- [ ] Verify API documentation matches edge function implementations
- [ ] Check for outdated architecture docs in `docs/` directory

---

## PHASE 12: SHOPIFY-SPECIFIC AUDIT

### 30. Shopify Compliance
- [ ] Verify GDPR webhook handlers implement all three mandatory endpoints:
  - `customers/data_request`
  - `customers/redact`
  - `shop/redact`
- [ ] Check App Bridge initialization and session token handling
- [ ] Verify OAuth flow matches Shopify's latest requirements (2025 standards)
- [ ] Check for proper scope handling in access token requests
- [ ] Verify embedded app navigation works correctly (no full page reloads)
- [ ] Check for Shopify App Store submission requirements compliance
- [ ] Audit Shopify API version usage — check for deprecated API versions
- [ ] Verify `shopify.app.toml` or equivalent app configuration exists

---

## OUTPUT FORMAT

Write the complete audit report to `I:\CYBERPUNK\ras8-dep\ras8\CODEBASE_AUDIT_REPORT.md` with this exact structure:

```markdown
# RAS8 Codebase Audit Report

**Date**: [current date]
**Auditor**: AI Full-Stack Auditor
**Scope**: 100% Codebase Coverage
**Project**: RAS8 — Returns Automation SaaS

---

## Executive Summary
[2-3 paragraph overview: overall health assessment, critical findings count, risk level (Critical/High/Medium/Low), top 3 most urgent issues, overall recommendation]

## Audit Statistics
| Metric | Count |
|--------|-------|
| Total files audited | [number] |
| Critical issues | [count] |
| High-severity issues | [count] |
| Medium-severity issues | [count] |
| Low-severity issues | [count] |
| Informational notes | [count] |
| Test coverage % | [percentage] |
| Files without tests | [count] |

---

## Critical Issues (Must Fix Immediately)

### [CRIT-001] [Issue Title]
- **Location**: `[file path]:[line number]`
- **Category**: [Security | Auth | Data Integrity | Privacy | Payment]
- **Description**: [Precise description of what is wrong]
- **Root Cause**: [Technical explanation of WHY this happened — architecture decision, oversight, etc.]
- **Impact**: [What could go wrong — data breach, financial loss, compliance failure, etc.]
- **Reproduction**: [Steps to verify this issue exists]
- **Fix**: [Specific code change needed, with code snippets if helpful]
- **Effort**: [Low/Medium/High]

[Repeat for each critical issue]

---

## High Severity Issues

### [HIGH-001] [Issue Title]
[Same format as Critical]

---

## Medium Severity Issues

### [MED-001] [Issue Title]
[Same format]

---

## Low Severity Issues

### [LOW-001] [Issue Title]
[Same format]

---

## Informational Notes

### [INFO-001] [Note Title]
[Same format, but Reproduction/Fix may be optional]

---

## Test Coverage Report

### Test Execution Results
[Paste actual output from bun run test:run]

### Coverage Results
[Paste actual output from bun run test:coverage]

### Untested Files (Must Have Tests)

| Category | File | Priority |
|----------|------|----------|
| Service | src/services/xxxService.ts | Critical |
| Hook | src/hooks/useXxx.ts | High |
| ... | ... | ... |

### Test Quality Assessment
[Analysis: are tests meaningful? Do mocks match reality? Are there false-positive tests?]

---

## Build & Lint Report

### Build Output
[Paste actual output from bun run build]

### Lint Violations
[Paste actual output from bun run lint]

---

## Performance Report

### Bundle Analysis
| Chunk | Size | Notes |
|-------|------|-------|
| [chunk name] | [size] | [optimization opportunity] |

### Database Performance
[N+1 patterns, missing indexes, unoptimized queries]

---

## Security Posture Summary
[Overall security assessment: what's good, what's dangerous, specific hardening recommendations ordered by priority]

## Architecture Health
[Assessment of patterns, tech debt score, maintainability, scalability concerns]

---

## Recommended Fix Priority

| Priority | Issue ID | Title | Effort | Impact |
|----------|----------|-------|--------|--------|
| 1 | CRIT-001 | ... | ... | ... |
| 2 | CRIT-002 | ... | ... | ... |
| ... | ... | ... | ... | ... |

---

## Appendix A: Complete File Inventory

| # | File Path | Audited | Issues Found |
|---|-----------|---------|-------------|
| 1 | src/main.tsx | Yes | CRIT-001, MED-003 |
| 2 | src/components/... | Yes | None |
| ... | ... | ... | ... |

## Appendix B: Dependency Audit

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| react | 18.3.1 | OK | |
| jose | ^6.0.13 | Duplicate | Also have jsonwebtoken |
| ... | ... | ... | ... |

## Appendix C: Environment Variable Audit

| Variable | Required | Validated | Client-Exposed | Risk |
|----------|----------|-----------|----------------|------|
| VITE_SUPABASE_URL | Yes | Yes | Yes (VITE_) | Low — public |
| SUPABASE_SERVICE_ROLE_KEY | Yes | ? | No | Critical if leaked |
| ... | ... | ... | ... | ... |

## Appendix D: Secret Scan Results
[Results of grep for hardcoded secrets, tokens, API keys]
```

---

## EXECUTION INSTRUCTIONS

1. **Do NOT skip any file.** Read every `.ts`, `.tsx`, `.js`, `.sql`, `.toml`, `.json` file in the project.
2. **Be specific.** Every finding must include the exact file path and line number.
3. **Include root causes.** Don't just say "X is broken" — explain WHY it's broken and what architectural decision led to it.
4. **Provide fixes.** Every issue must include a concrete remediation with code snippets when appropriate.
5. **Check cross-cutting concerns.** Many bugs only appear at the intersection of systems (e.g., auth + RLS, embedded mode + routing, Shopify session + Supabase auth).
6. **Run all commands** and include real output:
   - `bun run test:run` — test results
   - `bun run test:coverage` — coverage report
   - `bun run build` — build output and warnings
   - `bun run lint` — lint violations
7. **Search for secrets** — grep the entire codebase for patterns:
   - `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`
   - `ghp_`, `gho_`, `github_pat_`
   - `xox[bpas]-`
   - `AKIA`
   - `password`, `secret`, `apikey`, `private_key`, `access_token` (in non-variable-name contexts)
8. **Verify the audit is 100% complete** by listing every file in Appendix A and confirming each was reviewed.
9. **Prioritize ruthlessly** — Critical issues should be things that could cause data breaches, financial loss, or compliance violations. Don't inflate severity.
10. **Track your progress** — Use the task list to mark each phase as you complete it so nothing is missed.

**Write the report to**: `I:\CYBERPUNK\ras8-dep\ras8\CODEBASE_AUDIT_REPORT.md`

---

## PROMPT END

---

## How to Use This Prompt

1. Open a **fresh Claude Code session** with maximum context (or use Claude with extended thinking)
2. Paste everything between `PROMPT START` and `PROMPT END`
3. The AI will systematically work through all **12 phases / 30 audit categories**
4. It will run tests, builds, and linting to capture real output
5. The final output is `CODEBASE_AUDIT_REPORT.md` with every issue, root cause, and fix

### What Makes This Prompt Effective

- **Tailored to RAS8**: References exact file paths, tech stack, architecture patterns, and known quirks
- **Pre-flagged risk areas**: Known issues like `strict: false`, client-side rate limiting, console override, debug routes in production
- **Actionable output**: Every issue includes location, root cause, impact, reproduction steps, and specific fix
- **Verifiable**: Runs real commands (test, build, lint) and includes output — no guessing
- **Complete inventory**: Appendix A tracks every file to ensure nothing is skipped
- **Prioritized**: Issues ranked by severity with effort estimates for fix planning
