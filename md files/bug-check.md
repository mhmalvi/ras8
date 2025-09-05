Zero‑Code Install Failure Audit for Shopify Embedded App (Test Stores)

Role: You are a principal software architect and senior full‑stack developer auditing a Shopify embedded app that fails to install on Shopify test stores (redirect loops, refreshes, never completes). The same code works as a standalone web app, but not as an embedded app inside Shopify Admin. You must perform a zero‑code deep audit and produce two Markdown reports. Do not modify any files. Do not generate patches. Be exhaustive, precise, and actionable.

Objective:

Identify the root causes blocking install on Shopify test stores in embedded mode.

Produce a prioritized fix plan (configuration + code change plan) to achieve one‑click install and first‑run data sync for each merchant, with multi‑tenant isolation.

Scope & Constraints

Do not write or change code.

Read all source files, configs, .env samples, deployment files, CI/CD, docs, and all .md files in the repo.

Consider the current hosting target is Vercel (Ngrok is deprecated).

The stack includes Shopify (embedded app) + Supabase (DB/APIs) + possible Stripe/n8n glue.

We’ve observed errors like:

CSP violations (e.g., “Refused to execute inline script…”, frame/iframe issues)

WebSocket disconnects to argus.shopifycloud.com

Env var warnings (e.g., SHOPIFY_CLIENT_SECRET, SHOPIFY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY missing)

Install/redirect loops when clicking Install app from Shopify Admin on a test store

Goal state: true one‑click install in Embedded Admin, correct OAuth, session, App Bridge host handling, and first‑run merchant data sync (products, customers, orders/returns) with per‑tenant isolation.

Deliverables (create these at repo root)

00_INSTALL-BUG_ROOT-CAUSE_REPORT.md
A detailed technical investigation with:

Executive Summary (1–2 paragraphs).

Symptoms & Reproduction: exact steps to reproduce the failure on a Shopify test store (include URLs/paths, query params like host, embedded, shop, and screenshots/log names if present).

Observed Logs & Evidence: collect console logs, network traces, server logs, and build logs. Quote relevant lines; link to file paths. Include CSP header dumps, response headers, and any X-Frame-Options.

Architecture & Flow Mapping: diagram or bullet the complete install flow (Admin → OAuth start → callback → session storage → token fetch → embedded mount → App Bridge init → first page). Identify where the loop occurs.

Root Causes (Prioritized): For each issue, include:

Why it breaks embedded test store installs.

The exact repo locations (files/lines) and configs involved.

How it manifests (CSP error, cookie rejection, host param loss, callback URL mismatch, etc.).

Impact Assessment: severity, blast radius, and whether it’s prod/test‑store specific.

Dependencies & Assumptions: e.g., Shopify Partner Dashboard configuration, Vercel headers, envs, App Bridge versioning.

01_INSTALL-FIX_PLAN.md
A step‑by‑step plan to resolve all issues, with checklists and validation steps:

Partner Dashboard Configuration Checklist (copy‑pastable):

App URL {{APP_URL}} (must be the deployed Vercel URL).

Allowed redirection URL(s) (include exact OAuth callback paths used by the app, e.g., /auth/callback or /api/auth/callback).

Add all required embedded domains and redirect URLs for local and prod (e.g., Vercel preview & production).

Vercel / Hosting Headers:

Set CSP with correct frame-ancestors:

Must include https://admin.shopify.com and https://*.myshopify.com.

Ensure no conflicting X-Frame-Options (must be absent or compatible).

Avoid over‑restrictive script-src that breaks Shopify injected scripts/App Bridge.

OAuth & Session:

Verify HMAC validation, nonce, and host parameter propagation across redirects.

Ensure SameSite=None; Secure for cookies in embedded context and token/session strategy compatible with third‑party cookie restrictions (use Session Tokens / JWT via App Bridge if applicable).

Confirm callback path and app URL alignment.

App Bridge Initialization:

Confirm correct App Bridge version and initialization order.

Ensure the host param is read from the URL and stored/propagated across routes.

WebSockets / GraphQL:

Address the argus.shopifycloud.com connection lifecycle; ensure auth headers and embedded context are correct; do not block WS with CSP.

Environment Variables:

List all required envs with exact names the code expects:

SHOPIFY_API_KEY, SHOPIFY_CLIENT_SECRET (or SHOPIFY_API_SECRET)

SHOPIFY_SCOPES

SHOPIFY_WEBHOOK_SECRET

APP_URL / HOST (canonical https base)

SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

Any STRIPE_* if billing gates install

Map where each is read in code and which deploy targets (local/vercel) need them.

First‑Run Data Sync:

Define the post‑install job: fetch shop, products, customers, orders/returns.

Confirm multi‑tenant scoping (DB schemas/tables, RLS policies if Supabase).

Ensure failures don’t break initial render (defer long sync to background but show “sync in progress” state).

Regression Matrix:

Browsers (Chrome/Firefox/Safari), embedded vs standalone.

Test stores with/without data.

Preview vs Production deployments on Vercel.

Acceptance Criteria:

From a fresh Shopify test store, clicking Install leads to a stable embedded landing page with App Bridge loaded, no loops, no CSP errors, and tenant data begins syncing successfully.

Owner, ETA, Risks (fill with placeholders if unknown).

Audit Checklist (what to inspect and report on)

A. Partner Dashboard & Redirects

App URL vs code’s base URL mismatch.

Missing/incorrect Allowed redirection URL(s)—must exactly match the OAuth callback route(s).

Using outdated ngrok URLs anywhere in config or docs.

B. CSP / Headers

Content-Security-Policy must allow:

frame-ancestors https://admin.shopify.com https://*.myshopify.com

No X-Frame-Options: DENY/SAMEORIGIN.

Over‑strict script-src blocking Shopify/Admin/App Bridge/Shopify CDN scripts.

Vercel headers/middleware conflicting with CSP.

C. Embedded App Bridge & Host Param

Loss of host during redirects (e.g., Next.js routing drops query params).

App Bridge initialized before host is available, or not rehydrated on route changes.

Mixed usage of legacy EASDK vs App Bridge v3.

D. OAuth, Sessions, Cookies

Callback path mismatch (/auth/callback vs /api/auth/callback).

HMAC/nonce validation failures causing silent redirects.

Cookie strategy incompatible with embedded iframes (need SameSite=None; Secure).

Not using Session Tokens (JWT) for API calls inside embedded context.

E. WebSockets / Subscriptions

CSP blocks to wss:// origins (argus.shopifycloud.com).

Missing auth headers/query params required by Admin GraphQL subscriptions.

F. Env Vars & Build Config

Missing or misnamed vars (e.g., SHOPIFY_CLIENT_SECRET, SHOPIFY_WEBHOOK_SECRET, SUPABASE_*).

Build‑time vs runtime env exposure (Vercel NEXT_PUBLIC_* vs server‑only).

Mismatched keys between .env.example, docs, and actual code reads.

G. First‑Run Data Sync & Tenancy

Background jobs failing due to missing creds or wrong base URL.

Supabase RLS not set or filters missing shop/merchant_id.

UI doesn’t handle “empty state” gracefully during initial sync.

H. Billing / Gates

If billing is enforced, ensure it does not block test stores or initial OAuth.

I. Docs / .md Files

Conflicting instructions across phases.

Any reference to obsolete domains (ngrok) or stale setup steps.

Missing step to update Partner Dashboard after moving to Vercel.

Method (how you should work)

Inventory repo: list packages, app entry points, auth middleware, App Bridge setup, API routes, OAuth handlers, Vercel config, headers/middleware, Supabase client/server setup, and all .md docs.

Trace the install flow end‑to‑end (URL by URL), noting where the loop starts, which param/headers are missing, and what CSP/cookies are set.

Extract logs: surface all install‑time errors/warnings (browser console, server logs, build logs).

Correlate errors to code/config lines and Partner Dashboard settings.

Prioritize root causes (P0 blockers first).

Produce the two Markdown files exactly as specified. Do not write code.

Helpful Placeholders (fill where unknown)

{{APP_URL}} – Canonical deployed URL (Vercel prod).

{{PREVIEW_URLS}} – Vercel preview patterns to whitelist.

{{OAUTH_CALLBACK_PATH}} – Actual callback route the code uses.

{{REPO_PATHS}} – File paths for each finding.

{{MISSING_ENVS}} – Exact env var names missing in deployment.

{{TEST_STORE_DOMAIN}} – The myshopify.com domain used in tests.



You are a senior full-stack architect auditing a Shopify embedded app for Returns Automation SaaS that must install and run seamlessly across multiple Shopify test stores (RAS-3S, TEST-43, TEST-3SDF, TEST-6666). Previously, the app was installed successfully on RAS-3S and TEST-42434, but now even those installed instances show severe errors: repeated installation prompts, Supabase “no authenticated user or merchant found” console logs, functional errors, and 404 responses from Supabase edge functions (e.g., “idbo ml…” not found). When merchants click Install Returns Automation, the app fails with redirect loops and unresolved Supabase function calls. Your task is to deeply analyze the entire codebase end-to-end (backend, frontend, Supabase schema, OAuth/session flow, Partner Dashboard config, API Gateway, all .md docs) to identify the exact root causes of these installation and runtime failures across test stores. Do not change any code—only produce a detailed Markdown report with (1) the technical investigation and root-cause analysis, and (2) a prioritized, step-by-step fix plan covering Shopify OAuth/callback setup, Supabase Auth + RLS alignment, environment variable correctness, API Gateway and routing, App Bridge host handling, and first-run merchant data sync.