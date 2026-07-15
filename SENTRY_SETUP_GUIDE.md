# Sentry Setup Guide
**Step-by-step guide to configure Sentry error tracking**

---

## Step 1: Create Sentry Account & Project

### 1.1 Sign Up for Sentry
1. Go to https://sentry.io
2. Click "Sign Up" (or "Get Started")
3. Create account with:
   - Email/password, OR
   - GitHub, OR
   - Google

### 1.2 Create New Project
1. After logging in, click "Create Project"
2. Select platform: **Node.js** (for backend)
3. Set alert frequency: **Alert me on every new issue**
4. Name your project: `ras8-backend` (or your app name)
5. Click "Create Project"

### 1.3 Get Backend DSN
1. After project creation, you'll see the DSN on the setup page
2. Copy the DSN - it looks like:
   ```
   https://xxxxxxxxxxxxx@oxxxxx.ingest.sentry.io/xxxxxx
   ```
3. **Save this as SENTRY_DSN** (backend DSN)

### 1.4 Create Frontend Project (Recommended)
1. Click "Projects" in sidebar
2. Click "Create Project" again
3. Select platform: **React**
4. Name your project: `ras8-frontend`
5. Click "Create Project"
6. Copy the DSN for frontend
7. **Save this as VITE_SENTRY_DSN** (frontend DSN)

**Note:** You can use the same DSN for both, but separate projects help organize errors.

---

## Step 2: Configure Environment Variables

### 2.1 Local Development

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Add Sentry DSNs to `.env.local`:

```bash
# Sentry Error Tracking
SENTRY_DSN=https://xxxxxxxxxxxxx@oxxxxx.ingest.sentry.io/xxxxxx
VITE_SENTRY_DSN=https://xxxxxxxxxxxxx@oxxxxx.ingest.sentry.io/xxxxxx

# Optional: Enable Sentry in development
VITE_SENTRY_ENABLED=true
```

**⚠️ IMPORTANT:** Never commit `.env.local` to version control!

### 2.2 Vercel Production Deployment

#### Add Environment Variables in Vercel Dashboard:

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SENTRY_DSN` | `https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx` | Production, Preview, Development |
| `VITE_SENTRY_DSN` | `https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

#### Using Vercel CLI:

```bash
# Add backend DSN
vercel env add SENTRY_DSN

# Add frontend DSN
vercel env add VITE_SENTRY_DSN

# When prompted, select all environments (Production, Preview, Development)
```

### 2.3 Verify Configuration

#### Check Backend:
```bash
# Start dev server
npm run dev

# Check console for:
# ✅ Sentry initialized for development
# OR
# ⚠️  SENTRY_DSN not configured - Sentry error tracking disabled
```

#### Check Frontend:
```bash
# Build frontend
npm run build

# Check build output for Sentry initialization
# Open browser console, should see:
# ✅ Sentry initialized for frontend: production
```

---

## Step 3: Test Sentry Integration

### 3.1 Test Backend Error Capture

Create a test endpoint or add to existing:

```javascript
// api/test-sentry.js
import { captureMessage, captureException } from './_middleware/sentry';

export default async function handler(req, res) {
  // Test message
  captureMessage('Sentry test message from backend', 'info', {
    test: true,
    timestamp: new Date().toISOString()
  });

  // Test error
  captureException(new Error('Sentry test error from backend'), {
    test: true,
    endpoint: '/api/test-sentry'
  });

  return res.status(200).json({ message: 'Sentry test completed' });
}
```

**Test:**
```bash
curl http://localhost:8082/api/test-sentry
```

### 3.2 Test Frontend Error Capture

Add a test button in any component:

```tsx
import { captureException } from '../utils/sentry';

function TestSentryButton() {
  const handleTest = () => {
    captureException(new Error('Sentry test error from frontend'), {
      test: true,
      component: 'TestButton'
    });
  };

  return <button onClick={handleTest}>Test Sentry</button>;
}
```

### 3.3 Verify in Sentry Dashboard

1. Go to https://sentry.io
2. Select your project
3. Click "Issues" in sidebar
4. You should see your test errors appear within 30 seconds
5. Click on an error to see:
   - Stack trace
   - Request context
   - User information
   - Breadcrumbs

---

## Step 4: Configure Sentry Project Settings

### 4.1 Alert Rules

1. Go to project settings
2. Click "Alerts" → "Alert Rules"
3. Click "Create Alert Rule"

**Recommended rules:**

#### Critical Errors Alert:
- **Condition:** Error frequency is more than 10 events in 1 minute
- **Action:** Send notification to Slack/Email
- **Environment:** Production only

#### New Error Alert:
- **Condition:** A new issue is created
- **Action:** Send notification to Slack/Email
- **Environment:** Production only

#### Performance Degradation:
- **Condition:** Transaction duration is above 1000ms for 5 minutes
- **Action:** Send notification to Slack/Email
- **Environment:** Production only

### 4.2 Issue Grouping

1. Go to "Settings" → "Processing"
2. Configure "Grouping"
3. Enable "Enhanced Grouping" for better error aggregation

### 4.3 Data Scrubbing

1. Go to "Settings" → "Security & Privacy"
2. Enable "Data Scrubbing"
3. Add patterns to scrub:
   - `password`
   - `token`
   - `secret`
   - `api_key`
   - `credit_card`

**Note:** Our implementation already filters sensitive data, but this adds an extra layer.

### 4.4 Integrations

#### Slack Integration:
1. Go to "Settings" → "Integrations"
2. Find "Slack"
3. Click "Add Integration"
4. Authorize with your Slack workspace
5. Select channel for notifications (e.g., `#alerts` or `#errors`)

#### GitHub Integration:
1. Go to "Settings" → "Integrations"
2. Find "GitHub"
3. Click "Add Integration"
4. Authorize with your GitHub account
5. Link repository for commit tracking

---

## Step 5: Production Checklist

Before deploying to production:

- [ ] **Sentry project created** for backend and frontend
- [ ] **DSNs copied** and saved securely
- [ ] **Environment variables added** to Vercel
- [ ] **Test errors captured** and visible in dashboard
- [ ] **Alert rules configured** for critical errors
- [ ] **Slack/Email notifications** set up
- [ ] **Data scrubbing** enabled and tested
- [ ] **Team members invited** to Sentry project
- [ ] **Issue assignment rules** configured
- [ ] **Release tracking** enabled (optional)

---

## Step 6: Monitor & Maintain

### Daily/Weekly Tasks:

#### Review New Issues:
1. Check Sentry dashboard daily
2. Triage new errors (assign, resolve, ignore)
3. Create GitHub issues for critical bugs

#### Performance Monitoring:
1. Check "Performance" tab weekly
2. Review slow transactions
3. Optimize endpoints >500ms response time

#### Release Tracking:
1. Tag releases in Sentry
2. Compare error rates between releases
3. Roll back if error rate spikes

### Monthly Tasks:

#### Optimize Sample Rates:
```typescript
// Adjust in api/_middleware/sentry.ts
tracesSampleRate: 0.1  // Lower for high-traffic apps
```

#### Review Alert Rules:
- Adjust thresholds based on actual traffic
- Disable noisy alerts
- Add new alerts for critical paths

#### Clean Up Old Issues:
- Bulk resolve issues older than 90 days
- Archive stale issues
- Update issue grouping rules

---

## Troubleshooting

### Backend: "SENTRY_DSN not configured"

**Problem:** Console shows warning about missing DSN

**Solutions:**
1. Verify `.env.local` contains `SENTRY_DSN`
2. Restart dev server
3. Check DSN format (should start with `https://`)
4. Verify Vercel environment variables (production)

### Frontend: "VITE_SENTRY_DSN not configured"

**Problem:** Console shows warning about missing frontend DSN

**Solutions:**
1. Verify `.env.local` contains `VITE_SENTRY_DSN`
2. Restart Vite dev server (`npm run dev`)
3. Clear browser cache
4. Check DSN format
5. Ensure variable starts with `VITE_` prefix

### Errors Not Appearing in Sentry

**Problem:** Test errors not showing in dashboard

**Solutions:**
1. Wait 30-60 seconds (errors are batched)
2. Check Sentry project DSN matches environment variable
3. Verify environment (development vs production)
4. Check browser console for Sentry initialization message
5. Enable Sentry in development: `VITE_SENTRY_ENABLED=true`
6. Check network tab for outgoing Sentry requests

### Too Many Events (Quota Warning)

**Problem:** Sentry quota almost exceeded

**Solutions:**
1. Lower sample rates in production:
   ```typescript
   tracesSampleRate: 0.05  // 5% instead of 10%
   replaysSessionSampleRate: 0.05
   ```
2. Filter out noisy errors:
   ```typescript
   beforeSend(event) {
     if (event.message?.includes('ResizeObserver')) {
       return null; // Don't send
     }
     return event;
   }
   ```
3. Upgrade Sentry plan if needed
4. Disable session replay in production

### Source Maps Not Working

**Problem:** Stack traces show minified code

**Solutions:**
1. Install Sentry Vite plugin:
   ```bash
   npm install @sentry/vite-plugin --save-dev
   ```
2. Configure in `vite.config.ts`:
   ```typescript
   import { sentryVitePlugin } from '@sentry/vite-plugin';

   export default defineConfig({
     build: {
       sourcemap: true,
     },
     plugins: [
       sentryVitePlugin({
         authToken: process.env.SENTRY_AUTH_TOKEN,
         org: 'your-org',
         project: 'ras8-frontend',
       }),
     ],
   });
   ```
3. Create auth token in Sentry settings
4. Add `SENTRY_AUTH_TOKEN` to environment variables

---

## Cost Optimization

### Free Tier Limits:
- **Errors:** 5,000 events/month
- **Performance:** 10,000 transactions/month
- **Replays:** 50 replays/month

### Optimization Strategies:

#### 1. Lower Sample Rates (Production):
```typescript
// Backend
tracesSampleRate: 0.05  // 5% of requests

// Frontend
tracesSampleRate: 0.05
replaysSessionSampleRate: 0.05
```

#### 2. Filter Noisy Errors:
```typescript
beforeSend(event) {
  // Ignore specific errors
  const ignoredErrors = [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Network request failed',
  ];

  if (ignoredErrors.some(msg => event.message?.includes(msg))) {
    return null;
  }

  return event;
}
```

#### 3. Disable Features:
```typescript
// Disable session replay if not critical
replaysSessionSampleRate: 0,
```

#### 4. Environment-Specific:
- Production: Low sample rates (5-10%)
- Staging: Medium sample rates (50%)
- Development: High sample rates (100%) OR disabled

---

## Advanced Configuration

### Release Tracking:

```typescript
// Backend sentry.ts
Sentry.init({
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  // ...
});

// Tag releases
Sentry.setTag('release', process.env.VERCEL_GIT_COMMIT_SHA);
```

### User Context:

```typescript
// After user authentication
import { setUser } from '../utils/sentry';

setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear on logout
setUser(null);
```

### Custom Tags:

```typescript
import { setTag, setContext } from '../utils/sentry';

// Add custom tags
setTag('shop', 'example.myshopify.com');
setTag('plan', 'premium');

// Add custom context
setContext('merchant', {
  id: merchant.id,
  planType: merchant.planType,
  revenue: merchant.totalRevenue,
});
```

---

## Summary

**Setup Time:** ~15 minutes
**Configuration:** 2 environment variables
**Cost:** Free tier sufficient for most apps
**Benefits:** Real-time error tracking, performance monitoring, session replay

**Quick Start:**
1. Create Sentry account → Get DSN
2. Add `SENTRY_DSN` and `VITE_SENTRY_DSN` to Vercel
3. Deploy → Errors automatically tracked
4. Configure alerts → Stay informed

**Support:**
- Sentry Docs: https://docs.sentry.io
- Status: https://status.sentry.io
- Support: support@sentry.io
