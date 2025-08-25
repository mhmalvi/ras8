import { test, expect } from '@playwright/test';

// Test configuration
const APP_URL = process.env.VITE_APP_URL || 'https://ras-8.vercel.app';
const TEST_SHOP = 'test-store.myshopify.com';

test.describe('Shopify Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should handle OAuth start flow correctly', async ({ page }) => {
    // Test OAuth initiation
    const oauthStartUrl = `${APP_URL}/auth/start?shop=${TEST_SHOP}`;
    
    console.log('Testing OAuth start URL:', oauthStartUrl);
    
    // Navigate to OAuth start
    const response = await page.goto(oauthStartUrl);
    expect(response?.status()).toBe(200);
    
    // Should show OAuth start page
    await expect(page.locator('h1')).toContainText('Starting H5 Installation');
    
    // Should contain shop domain
    await expect(page.locator('body')).toContainText(TEST_SHOP);
    
    // Wait for automatic redirect (handled by JavaScript)
    await page.waitForURL(/.*shopify\.com\/admin\/oauth\/authorize.*/, { timeout: 5000 });
    
    // Verify we're redirected to Shopify OAuth
    expect(page.url()).toContain('shopify.com/admin/oauth/authorize');
    expect(page.url()).toContain('client_id=');
    expect(page.url()).toContain('scope=');
    expect(page.url()).toContain('redirect_uri=');
    expect(page.url()).toContain('state=');
  });

  test('should handle embedded app routing correctly', async ({ page }) => {
    const embeddedUrl = `${APP_URL}/dashboard?shop=${TEST_SHOP}&host=${Buffer.from(TEST_SHOP + '/admin').toString('base64')}`;
    
    console.log('Testing embedded URL:', embeddedUrl);
    
    // Navigate to embedded dashboard (without session)
    await page.goto(embeddedUrl);
    
    // Should detect missing authentication and redirect to install
    await page.waitForURL(/.*\/shopify\/install.*/, { timeout: 5000 });
    expect(page.url()).toContain('/shopify/install');
    expect(page.url()).toContain(`shop=${encodeURIComponent(TEST_SHOP)}`);
  });

  test('should validate CSP headers for embedded context', async ({ page }) => {
    // Test main app URL
    const response = await page.goto(APP_URL);
    expect(response?.status()).toBe(200);
    
    // Check CSP headers
    const cspHeader = response?.headers()['content-security-policy'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).toContain('frame-ancestors');
    expect(cspHeader).toContain('admin.shopify.com');
    expect(cspHeader).toContain('*.myshopify.com');
    
    // Check X-Frame-Options
    const xFrameOptions = response?.headers()['x-frame-options'];
    expect(xFrameOptions).toBe('ALLOWALL');
  });

  test('should handle session validation endpoint', async ({ page }) => {
    // Test session validation without credentials
    const response = await page.goto(`${APP_URL}/api/session/me`);
    expect(response?.status()).toBe(401);
    
    const data = await response?.json();
    expect(data.authenticated).toBe(false);
    expect(data.error).toContain('No valid session');
  });

  test('should handle OAuth callback validation', async ({ page }) => {
    // Test OAuth callback without parameters (should fail)
    const response = await page.goto(`${APP_URL}/auth/callback`);
    expect(response?.status()).toBe(400);
    
    // Should show error page
    await expect(page.locator('h1')).toContainText('Installation Failed');
    await expect(page.locator('body')).toContainText('Missing required parameters');
  });

  test('should handle invalid shop domains', async ({ page }) => {
    const invalidShop = 'invalid-shop.com';
    const oauthStartUrl = `${APP_URL}/auth/start?shop=${invalidShop}`;
    
    const response = await page.goto(oauthStartUrl);
    expect(response?.status()).toBe(400);
    
    // Should show error for invalid domain
    await expect(page.locator('h1')).toContainText('Installation Error');
    await expect(page.locator('body')).toContainText('Invalid shop domain');
  });

  test('should handle standalone auth flow', async ({ page }) => {
    // Test standalone auth page
    const response = await page.goto(`${APP_URL}/auth`);
    expect(response?.status()).toBe(200);
    
    // Should show sign in form
    await expect(page.locator('h1')).toContainText('Returns Automation');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Should have sign in and sign up tabs
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('should handle App Bridge initialization in embedded context', async ({ page }) => {
    const shop = TEST_SHOP;
    const host = Buffer.from(shop + '/admin').toString('base64').replace(/=/g, '');
    const embeddedUrl = `${APP_URL}/?shop=${shop}&host=${host}`;
    
    console.log('Testing App Bridge with URL:', embeddedUrl);
    
    // Navigate to app with shop/host params
    await page.goto(embeddedUrl);
    
    // Wait for App Bridge initialization logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(msg.text());
    });
    
    // Wait for page load and App Bridge setup
    await page.waitForTimeout(2000);
    
    // Check console logs for App Bridge initialization
    const bridgeLogs = logs.filter(log => log.includes('App Bridge') || log.includes('🚀 Initializing'));
    expect(bridgeLogs.length).toBeGreaterThan(0);
    
    // Should redirect to dashboard with proper params
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).toContain(`shop=${shop}`);
    expect(page.url()).toContain(`host=${host}`);
  });
});

test.describe('Security Tests', () => {
  test('should not expose service role key in client', async ({ page }) => {
    // Navigate to app
    await page.goto(APP_URL);
    
    // Check for exposed secrets in client-side JavaScript
    const scripts = await page.locator('script[src]').all();
    
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && src.startsWith('/')) {
        const scriptResponse = await page.goto(APP_URL + src);
        const scriptContent = await scriptResponse?.text();
        
        // Check for service role key patterns
        expect(scriptContent).not.toContain('eyJhbGciOiJIUzI1NiIs'); // JWT header pattern
        expect(scriptContent).not.toContain('service_role');
        expect(scriptContent).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      }
    }
  });

  test('should handle CSRF protection in OAuth flow', async ({ page }) => {
    // Test OAuth callback with missing state parameter
    const callbackUrl = `${APP_URL}/auth/callback?code=test&shop=${TEST_SHOP}`;
    const response = await page.goto(callbackUrl);
    
    expect(response?.status()).toBe(400);
    await expect(page.locator('body')).toContainText('Missing required parameters');
  });
});

test.describe('Webhook Endpoints', () => {
  test('should handle GDPR webhooks', async ({ page }) => {
    // Test GDPR webhook endpoint (should require POST with HMAC)
    const response = await page.goto(`${APP_URL}/functions/v1/shopify-gdpr-webhooks`);
    
    // Should not be accessible via GET
    expect(response?.status()).toBe(405);
  });
});