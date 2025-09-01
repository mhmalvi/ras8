# H5 Returns Automation SaaS - E2E Test Suite

A comprehensive end-to-end test suite for the H5 Returns Automation SaaS platform using Playwright. This test suite validates Shopify OAuth flows, returns management workflows, security measures, and performance requirements.

## 🏗️ Test Architecture

The test suite is organized into focused test modules covering all critical aspects of the application:

### Test Modules

1. **OAuth Flow Tests** (`oauth-flow.spec.ts`) - **[CRITICAL]**
   - Shopify OAuth initiation and completion
   - CSRF state validation 
   - Re-embedding after authentication
   - Error handling and security validation

2. **API Authentication Tests** (`api-authentication.spec.ts`) - **[CRITICAL]**
   - Session token validation
   - App Bridge token handling
   - Multi-tenant isolation
   - Rate limiting and security measures

3. **Returns Workflow Tests** (`returns-workflow.spec.ts`) - **[CRITICAL]**
   - Customer returns portal functionality
   - Merchant dashboard operations
   - Exchange processing workflows
   - Analytics and reporting

4. **Security Validation Tests** (`security-validation.spec.ts`) - **[CRITICAL]**
   - Content Security Policy enforcement
   - XSS and injection prevention
   - Webhook security and HMAC validation
   - Data privacy and protection

5. **Performance & Accessibility Tests** (`performance-accessibility.spec.ts`)
   - Page load performance metrics
   - Core Web Vitals monitoring
   - WCAG 2.1 AA compliance
   - Mobile responsiveness

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **App server running**: `npm run dev`
3. **Playwright browsers**: `npm run test:install:browsers`

### Environment Setup

Create a `.env.local` file with required variables:

```env
VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
VITE_APP_URL=http://localhost:8082
VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run only critical tests (recommended for CI/CD)
npm run test:e2e:critical

# Run specific test suite
npm run test:e2e:oauth
npm run test:e2e:returns
npm run test:e2e:security

# Run with visual debugging
npm run test:e2e:headed

# Run tests in parallel (faster)
npm run test:e2e:parallel

# Generate HTML reports
npm run test:e2e:report
```

## 📊 Test Coverage

### Critical Test Coverage (Must Pass for Production)

- ✅ **OAuth Authentication Flow** - Complete Shopify installation process
- ✅ **Session Management** - Token validation and multi-tenant isolation  
- ✅ **Returns Processing** - End-to-end customer and merchant workflows
- ✅ **Security Validation** - CSP, XSS prevention, and webhook security

### Additional Test Coverage

- ✅ **Performance Metrics** - Page load times and Core Web Vitals
- ✅ **Accessibility** - WCAG 2.1 AA compliance and keyboard navigation
- ✅ **Mobile Support** - Responsive design and touch accessibility
- ✅ **Error Handling** - Graceful degradation and error recovery

## 🔧 Test Configuration

### Playwright Configuration

The test suite runs across multiple browser environments:

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Mobile Chrome, Mobile Safari  
- **Embedded**: Simulated Shopify Admin iframe context

### Test Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APP_URL` | Application base URL | Yes |
| `VITE_SHOPIFY_CLIENT_ID` | Shopify app client ID | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `CLEANUP_TEST_DATA` | Clean test data after run | No |

## 📋 Test Data and Fixtures

### Mock Data Structure

```typescript
// Test merchants
TEST_MERCHANTS = {
  primary: { shopDomain: 'test-store-primary.myshopify.com' },
  secondary: { shopDomain: 'test-store-secondary.myshopify.com' }
}

// Mock orders and returns
MOCK_ORDERS = { standard: {...}, withMultipleItems: {...} }
MOCK_RETURNS = { pending: {...}, approved: {...} }
```

### Test Helpers

- `TestHelpers` - Common page interactions and validations
- `ShopifyEmbeddedHelpers` - Shopify-specific embedded context simulation
- `PerformanceHelpers` - Performance measurement utilities

## 🏃‍♂️ Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:install:browsers
      - run: npm start &
      - run: npm run test:e2e:critical
        env:
          VITE_SHOPIFY_CLIENT_ID: ${{ secrets.SHOPIFY_CLIENT_ID }}
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Test Results

The test runner provides detailed reporting:

- **Exit Codes**: 0 = all pass, 1 = failures detected
- **HTML Reports**: Generated in `playwright-report/`
- **Screenshots**: Captured on failure in `test-results/`
- **Videos**: Recorded for failed tests

## 🔍 Debugging Tests

### Local Debugging

```bash
# Run single test in headed mode
npx playwright test tests/e2e/oauth-flow.spec.ts --headed

# Debug with browser developer tools
npx playwright test tests/e2e/oauth-flow.spec.ts --debug

# Run specific test by name
npx playwright test tests/e2e/oauth-flow.spec.ts -g "should initiate OAuth flow"
```

### Test Artifacts

Failed tests automatically generate:
- Screenshots of the failure state
- Video recordings of the test execution
- Network request/response logs
- Browser console output

## 📈 Performance Benchmarks

### Load Time Targets

| Page | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Homepage | < 3s | < 4s | Initial load |
| Dashboard | < 4s | < 5s | Embedded context |
| Returns Portal | < 3.5s | < 4s | Customer-facing |

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

## ♿ Accessibility Standards

Tests validate compliance with:

- **WCAG 2.1 AA** guidelines
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** requirements (4.5:1 ratio)
- **Touch target** sizes (44px minimum)

## 🔐 Security Testing

### Security Validations

- **Content Security Policy** header enforcement
- **XSS prevention** through input sanitization
- **SQL injection** protection
- **CSRF protection** with state validation
- **HMAC verification** for webhooks
- **Session security** and timeout handling

### Security Test Categories

- **Authentication**: OAuth flow security
- **Authorization**: Multi-tenant isolation  
- **Input Validation**: XSS and injection prevention
- **Data Protection**: PII handling and masking
- **Network Security**: HTTPS enforcement and CORS

## 📞 Support and Troubleshooting

### Common Issues

1. **App Server Not Running**
   ```bash
   # Start the development server
   npm run dev
   ```

2. **Missing Playwright Browsers**
   ```bash
   # Install browser dependencies
   npm run test:install:browsers
   ```

3. **Environment Variable Issues**
   - Verify `.env.local` contains all required variables
   - Check variable values are not wrapped in quotes

4. **Test Timeouts**
   - Increase timeout in `playwright.config.ts`
   - Check network connectivity and app performance

### Getting Help

- **Issues**: Report bugs in GitHub Issues
- **Documentation**: Review test code comments
- **Logs**: Check `test-results/` directory for debugging info

---

## 📝 Test Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Use provided test helpers and fixtures
4. Update this README with new test descriptions

### Updating Test Data

Test data is centralized in `tests/fixtures/test-data.ts`:
- Modify existing fixtures carefully
- Add new fixtures for new features
- Ensure backwards compatibility

### Performance Monitoring

Regularly review performance benchmarks:
- Update targets as app evolves
- Monitor Core Web Vitals trends
- Optimize slow-performing areas

---

**Last Updated**: September 2024  
**Test Suite Version**: 1.0.0  
**Playwright Version**: 1.55.0