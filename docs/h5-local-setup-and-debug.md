# H5 Local Setup and Debug Playbook

## Quick Start Guide

### Prerequisites
- Node.js 18+ with npm/yarn/pnpm
- Git
- ngrok (for Shopify integration)
- Shopify Partner account
- Development Shopify store

### 1. Environment Setup

#### Clone and Install:
```bash
git clone <repository-url>
cd RAS-5
npm install  # or yarn/pnpm install
```

#### Environment Configuration:
Create `.env.local` file:
```bash
# Shopify App Configuration (from Partners Dashboard)
VITE_SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_CLIENT_SECRET=your_client_secret_here
VITE_APP_URL=https://your-ngrok-url.ngrok-free.app

# Webhook Security (generate secure random string)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here

# Development Configuration
VITE_DEV_MODE=true
VITE_SHOPIFY_CLIENT_SECRET=your_client_secret_here

# Supabase Configuration (if using local instance)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Start ngrok:
```bash
ngrok http 5173
# Copy the HTTPS URL to VITE_APP_URL
```

#### Update Shopify App Configuration:
In Shopify Partners Dashboard:
- **App Name**: H5
- **App URL**: https://your-ngrok-url.ngrok-free.app
- **Allowed redirection URLs**:
  - https://your-ngrok-url.ngrok-free.app/functions/v1/shopify-oauth-callback
  - https://your-ngrok-url.ngrok-free.app/auth/inline
  - https://your-ngrok-url.ngrok-free.app/dashboard
  - https://your-ngrok-url.ngrok-free.app/

### 2. Start Development

```bash
# Start the development server
npm run dev

# In another terminal, start Supabase (if local)
supabase start

# Verify environment
npm run test:unit  # Run unit tests
```

### 3. Install in Development Store

1. Go to Shopify Partners Dashboard
2. Find your H5 app
3. Click "Select store" → Choose your development store
4. Complete OAuth flow
5. App should install and show as "H5"

## Development Workflow

### Local Development URLs:
- **Local App**: http://localhost:5173
- **Public URL**: https://your-ngrok-url.ngrok-free.app
- **Embedded URL**: https://your-ngrok-url.ngrok-free.app/?shop=yourstore.myshopify.com&host=encoded_host

### Common Development Tasks:

#### Test Embedded App:
```bash
# Simulate embedded context
http://localhost:5173/?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29tL2FkbWlu
```

#### Test OAuth Flow:
```bash
# Go to installation URL
https://your-ngrok-url.ngrok-free.app/install
```

#### Test Webhooks:
```bash
# Use ngrok inspector
http://127.0.0.1:4040
# Monitor webhook requests
```

## Debugging Guide

### 1. Common Issues and Solutions

#### ❌ Issue: "Environment validation failed"
**Symptoms:** App won't start, shows configuration error
**Solution:**
```bash
# Check .env.local file exists and has required variables
cat .env.local

# Verify environment variables are loaded
npm run dev
# Look for "Environment validation passed" in console
```

#### ❌ Issue: "App Bridge initialization failed"
**Symptoms:** App loads but doesn't embed properly
**Solution:**
```bash
# Check client ID in .env.local matches Partners dashboard
echo $VITE_SHOPIFY_CLIENT_ID

# Verify shop and host parameters in URL
# URL should look like: /?shop=store.myshopify.com&host=encoded_host

# Check browser console for App Bridge errors
```

#### ❌ Issue: "HMAC signature verification failed"
**Symptoms:** OAuth callback fails, webhook processing errors
**Solution:**
```bash
# Verify webhook secret matches Partners dashboard
echo $SHOPIFY_WEBHOOK_SECRET

# For OAuth: Check client secret in .env.local
echo $SHOPIFY_CLIENT_SECRET

# Use ngrok inspector to see actual webhook payloads
```

#### ❌ Issue: "Merchant not found for domain"
**Symptoms:** Webhooks rejected, data not loading
**Solution:**
```sql
-- Check merchant exists in database
SELECT * FROM merchants WHERE shop_domain = 'your-store.myshopify.com';

-- If missing, complete OAuth flow again
-- Or manually insert test merchant
```

#### ❌ Issue: Navigation loops or redirects
**Symptoms:** App keeps redirecting, can't reach dashboard
**Solution:**
```bash
# Check route configuration in AtomicAppRouter.tsx
# Verify AppBridgeAwareRoute logic

# Clear browser cache and cookies
# Check for console errors in Network tab
```

### 2. Debug Tools and Techniques

#### Browser Developer Tools:
```bash
# Console commands for debugging
window.location.href  # Check current URL
new URLSearchParams(window.location.search)  # Check parameters

# Check App Bridge status
window.__SHOPIFY_APP_BRIDGE_INITIALIZED__

# Check environment
console.log(import.meta.env)
```

#### Health Check Debug:
```bash
# Run health check manually
# In browser console:
import('/src/utils/healthCheck.ts').then(async (module) => {
  const health = await module.performHealthCheck();
  console.log(module.formatHealthReport(health));
});
```

#### Database Debug:
```sql
-- Check merchant data
SELECT id, shop_domain, created_at FROM merchants;

-- Check order processing
SELECT merchant_id, shopify_order_id, created_at FROM orders LIMIT 10;

-- Check webhook activity
SELECT merchant_id, webhook_type, status, created_at FROM webhook_activity ORDER BY created_at DESC LIMIT 10;
```

### 3. Testing and Validation

#### Unit Tests:
```bash
npm run test:unit                 # Run all unit tests
npm run test:unit -- --watch      # Watch mode
npm run test:unit -- --coverage   # Coverage report
```

#### E2E Tests:
```bash
npm run test:e2e                 # Run E2E tests
npm run test:e2e -- --headed     # See browser
npm run test:e2e -- --debug      # Debug mode
```

#### Manual Testing Checklist:
- [ ] App installs with "H5" name
- [ ] OAuth flow completes
- [ ] App embeds in Shopify Admin
- [ ] Dashboard loads without errors
- [ ] Settings → Billing navigation works
- [ ] Integrations page displays correctly
- [ ] Sidebar shows "H5" branding
- [ ] Empty states render gracefully
- [ ] Error boundaries catch errors

## Performance Debugging

### 1. Load Time Analysis

#### Check Bundle Size:
```bash
npm run build
npm run preview

# Analyze bundle
npx vite-bundle-analyzer dist
```

#### Monitor Performance:
```bash
# Browser Performance tab
# Look for:
# - Time to First Contentful Paint (< 2s)
# - Largest Contentful Paint (< 3s)
# - First Input Delay (< 100ms)
```

### 2. Network Issues

#### Check API Calls:
```bash
# Browser Network tab
# Filter: XHR/Fetch
# Look for:
# - Failed requests (red)
# - Slow requests (> 1s)
# - CORS errors
```

#### Webhook Debugging:
```bash
# Use ngrok inspector: http://127.0.0.1:4040
# Check webhook payloads and responses
# Verify HMAC signatures
```

## Production Debugging

### 1. Error Monitoring

#### Sentry Integration:
```bash
# Check Sentry dashboard for errors
# Look for error patterns and frequency
# Check error context and user actions
```

#### Application Logs:
```bash
# Supabase Edge Function logs
supabase functions logs shopify-oauth-callback
supabase functions logs enhanced-shopify-webhook

# Check for processing errors and performance issues
```

### 2. Health Monitoring

#### System Health:
```bash
# Access health check endpoint
curl https://your-app-url.com/health

# Check service status in browser console:
# healthCheck.performHealthCheck()
```

#### Database Performance:
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

## Troubleshooting Flowchart

### App Won't Start:
1. Check `.env.local` exists → Create from template
2. Check Node.js version → Update to 18+
3. Check dependencies → Run `npm install`
4. Check environment validation → Fix missing variables

### App Won't Install:
1. Check ngrok URL accessible → Restart ngrok
2. Check Shopify Partners config → Update URLs
3. Check OAuth parameters → Verify client ID/secret
4. Check HMAC verification → Update webhook secret

### App Won't Embed:
1. Check shop/host parameters → Verify URL format
2. Check App Bridge initialization → Console errors
3. Check iframe permissions → CSP headers
4. Check redirect loops → Route configuration

### Data Not Loading:
1. Check merchant exists → Database query
2. Check tenant scoping → Query includes merchant_id
3. Check API permissions → Network tab errors
4. Check empty states → UI handling

### Webhooks Not Working:
1. Check webhook URL accessible → ngrok inspector
2. Check HMAC signature → Webhook secret match
3. Check merchant resolution → Shop domain lookup
4. Check processing errors → Function logs

## Support Resources

### Documentation:
- [Shopify App Development](https://shopify.dev/docs/apps)
- [App Bridge Documentation](https://shopify.dev/docs/api/app-bridge)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Community:
- [Shopify Partners Slack](https://partners.shopify.com/slack)
- [Shopify Community Forums](https://community.shopify.com/c/shopify-apis-sdks)

### Emergency Contacts:
- Technical Issues: Create GitHub issue
- Shopify Review Issues: partners@shopify.com
- Critical Bugs: Use Sentry alerts

## Development Best Practices

### Code Changes:
1. Always run tests before committing
2. Update documentation for API changes
3. Test in embedded context
4. Verify multi-tenant isolation
5. Check error handling scenarios

### Deployment:
1. Verify environment variables
2. Run health checks
3. Test OAuth flow
4. Monitor error rates
5. Check performance metrics

### Maintenance:
1. Monitor Sentry for errors
2. Check webhook activity logs
3. Review performance metrics
4. Update dependencies regularly
5. Test new Shopify API versions