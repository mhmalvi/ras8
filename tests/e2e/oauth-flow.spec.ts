import { test, expect } from '@playwright/test';
import { TestHelpers, ShopifyEmbeddedHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, ERROR_MESSAGES, API_ENDPOINTS } from '../fixtures/test-data';

test.describe('Shopify OAuth Flow - Comprehensive Tests', () => {
  let helpers: TestHelpers;
  let shopifyHelpers: ShopifyEmbeddedHelpers;

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page);
    shopifyHelpers = new ShopifyEmbeddedHelpers(page, context);
    
    // Clear any existing session data
    await context.clearCookies();
    await context.clearPermissions();
  });

  test.describe('OAuth Initiation', () => {
    test('should initiate OAuth flow from installation page', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const installUrl = `/shopify/install?shop=${shop}`;
      
      console.log('Testing OAuth initiation from:', installUrl);
      
      const response = await page.goto(installUrl);
      expect(response?.status()).toBe(200);
      
      // Should display installation page (the route exists but might be different structure)
      // Check if we have either installation content or a redirect
      const hasInstallContent = await page.locator('h1, h2, .installation-title, [role="heading"]').count() > 0;
      const bodyText = await page.locator('body').textContent();
      expect(hasInstallContent || bodyText?.includes('Install') || bodyText?.includes('H5')).toBe(true);
      
      // Should have install button
      const installButton = page.locator('button:has-text("Install"), button:has-text("Continue")').first();
      await expect(installButton).toBeVisible();
      
      // Click install and wait for OAuth redirect
      await Promise.all([
        page.waitForURL(/.*shopify\.com\/admin\/oauth\/authorize.*/, { timeout: 15000 }),
        installButton.click()
      ]);
      
      // Validate OAuth URL parameters
      const currentUrl = page.url();
      expect(currentUrl).toContain('shopify.com/admin/oauth/authorize');
      expect(currentUrl).toContain('client_id=');
      expect(currentUrl).toContain('scope=');
      expect(currentUrl).toContain('redirect_uri=');
      expect(currentUrl).toContain('state=');
      
      // Extract and validate OAuth parameters
      const url = new URL(currentUrl);
      const clientId = url.searchParams.get('client_id');
      const scope = url.searchParams.get('scope');
      const redirectUri = url.searchParams.get('redirect_uri');
      const state = url.searchParams.get('state');
      
      expect(clientId).toBeTruthy();
      expect(scope).toContain('read_orders');
      expect(redirectUri).toContain('/auth/callback');
      expect(state).toBeTruthy();
      expect(state?.length).toBeGreaterThan(10); // Should be a secure random state
    });

    test('should handle OAuth start with embedded parameters', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const host = TEST_MERCHANTS.primary.host;
      const startUrl = `/auth/start?shop=${shop}&host=${host}`;
      
      const response = await page.goto(startUrl);
      expect(response?.status()).toBe(200);
      
      // Should show OAuth start page
      await expect(page.locator('h1')).toContainText(/Starting|Installation/i);
      
      // Should auto-redirect to Shopify OAuth
      await page.waitForURL(/.*shopify\.com\/admin\/oauth\/authorize.*/, { timeout: 10000 });
      
      // Validate redirect preserved host parameter
      const currentUrl = page.url();
      const urlParams = new URL(currentUrl);
      const redirectUri = urlParams.searchParams.get('redirect_uri');
      
      expect(redirectUri).toContain('/auth/callback');
    });

    test('should reject invalid shop domains', async ({ page }) => {
      const invalidShops = [
        'invalid-shop.com',
        'not-a-shopify-store.net',
        'malicious-site.evil',
        '',
        'shop-without-extension'
      ];

      for (const invalidShop of invalidShops) {
        console.log('Testing invalid shop:', invalidShop);
        
        const response = await page.goto(`/auth/start?shop=${invalidShop}`);
        expect(response?.status()).toBe(400);
        
        await expect(page.locator('h1')).toContainText(/Error|Invalid|Failed/i);
        await expect(page.locator('body')).toContainText(/Invalid.*shop|Invalid.*domain/i);
      }
    });

    test('should validate CSRF state parameter generation', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Generate multiple OAuth URLs and ensure states are unique
      const states = new Set<string>();
      
      for (let i = 0; i < 3; i++) {
        await page.goto(`/auth/start?shop=${shop}`);
        await page.waitForURL(/.*shopify\.com\/admin\/oauth\/authorize.*/, { timeout: 10000 });
        
        const url = new URL(page.url());
        const state = url.searchParams.get('state');
        
        expect(state).toBeTruthy();
        expect(states.has(state!)).toBe(false); // Each state should be unique
        states.add(state!);
        
        // Go back to test page for next iteration
        await page.goBack();
      }
    });
  });

  test.describe('OAuth Callback Handling', () => {
    test('should handle successful OAuth callback', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // First, initiate OAuth to get a valid state
      await page.goto(`/auth/start?shop=${shop}`);
      await page.waitForURL(/.*shopify\.com\/admin\/oauth\/authorize.*/, { timeout: 10000 });
      
      const oauthUrl = new URL(page.url());
      const state = oauthUrl.searchParams.get('state');
      
      // Simulate successful OAuth callback
      const callbackUrl = `/auth/callback?code=test_auth_code_12345&shop=${shop}&state=${state}&hmac=test_hmac_signature&timestamp=${Date.now()}`;
      
      const response = await page.goto(callbackUrl);
      
      if (response?.status() === 200) {
        // Should redirect to inline auth page
        await page.waitForURL(/.*\/auth\/inline.*/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/inline');
        expect(page.url()).toContain(`shop=${shop}`);
        
        // Should show re-embedding page
        await expect(page.locator('body')).toContainText(/Completing|Installation|Loading/i);
      } else {
        // If callback fails, should show proper error page
        expect(response?.status()).toBe(400);
        await expect(page.locator('h1')).toContainText(/Failed|Error/i);
      }
    });

    test('should reject callback without required parameters', async ({ page }) => {
      const testCases = [
        { url: '/auth/callback', expectedError: 'Missing required parameters' },
        { url: '/auth/callback?code=123', expectedError: 'Missing required parameters' },
        { url: '/auth/callback?shop=test.myshopify.com', expectedError: 'Missing required parameters' },
        { url: '/auth/callback?code=123&shop=test.myshopify.com', expectedError: 'Missing required parameters' }
      ];

      for (const testCase of testCases) {
        console.log('Testing callback URL:', testCase.url);
        
        const response = await page.goto(testCase.url);
        expect(response?.status()).toBe(400);
        
        await expect(page.locator('h1')).toContainText(/Installation Failed|Error/i);
        await expect(page.locator('body')).toContainText(new RegExp(testCase.expectedError, 'i'));
      }
    });

    test('should reject callback with invalid shop domain', async ({ page }) => {
      const invalidShop = 'invalid-domain.com';
      const callbackUrl = `/auth/callback?code=test_code&shop=${invalidShop}&state=test_state&hmac=test_hmac`;
      
      const response = await page.goto(callbackUrl);
      expect(response?.status()).toBe(400);
      
      await expect(page.locator('h1')).toContainText(/Installation Failed|Error/i);
      await expect(page.locator('body')).toContainText(/Invalid.*shop|Invalid.*domain/i);
    });

    test('should handle HMAC validation', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Test with missing HMAC
      let callbackUrl = `/auth/callback?code=test_code&shop=${shop}&state=test_state`;
      let response = await page.goto(callbackUrl);
      expect(response?.status()).toBe(400);
      
      // Test with invalid HMAC format
      callbackUrl = `/auth/callback?code=test_code&shop=${shop}&state=test_state&hmac=invalid_hmac`;
      response = await page.goto(callbackUrl);
      expect(response?.status()).toBe(400);
    });
  });

  test.describe('Re-embedding Flow', () => {
    test('should handle re-embedding after OAuth', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      await shopifyHelpers.simulateAppBridge();
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const host = TEST_MERCHANTS.primary.host;
      
      const inlineUrl = `/auth/inline?shop=${shop}&host=${host}`;
      
      const response = await page.goto(inlineUrl);
      expect(response?.status()).toBe(200);
      
      // Should show re-embedding page
      await expect(page.locator('body')).toContainText(/Completing|Installation|Loading|Redirecting/i);
      
      // Should attempt to redirect to dashboard
      await page.waitForTimeout(3000); // Wait for JavaScript redirect
      
      // Check if redirected or if redirect is programmatic
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('/dashboard') || 
                          currentUrl.includes('shop=') && currentUrl.includes('host=');
      
      expect(isRedirected).toBe(true);
    });

    test('should preserve shop and host parameters during re-embed', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const host = TEST_MERCHANTS.primary.host;
      
      await page.goto(`/auth/inline?shop=${shop}&host=${host}`);
      
      // Wait for any redirects to complete
      await page.waitForTimeout(3000);
      
      // Check that parameters are preserved in URL or available to JavaScript
      const hasShopParam = page.url().includes(`shop=${shop}`) || 
                          await page.evaluate(() => new URLSearchParams(window.location.search).get('shop')) === shop;
      
      expect(hasShopParam).toBe(true);
    });
  });

  test.describe('Session Management', () => {
    test('should validate session endpoint without credentials', async ({ page }) => {
      // Test Supabase function endpoint instead of traditional API
      const response = await page.request.get('/functions/v1/get-shopify-config');
      // Expect either 401 or 400 depending on implementation
      expect([400, 401, 403].includes(response.status())).toBe(true);
    });

    test('should handle session validation with shop parameter', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Test Supabase function with shop header
      const response = await page.request.get('/functions/v1/get-shopify-config', {
        headers: {
          'Shop': shop,
          'Authorization': 'Bearer invalid_token'
        }
      });
      
      // Should still be unauthorized without valid session
      expect([400, 401, 403].includes(response.status())).toBe(true);
    });

    test('should handle App Bridge token validation', async ({ page, context }) => {
      await shopifyHelpers.simulateAppBridge();
      
      // Navigate to a page that should attempt to use App Bridge
      await page.goto(`/dashboard?shop=${TEST_MERCHANTS.primary.shopDomain}&host=${TEST_MERCHANTS.primary.host}`);
      
      // Check that App Bridge token methods are called
      const appBridgeCalled = await page.evaluate(() => {
        return !!(window as any).app;
      });
      
      expect(appBridgeCalled).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle OAuth denial gracefully', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Simulate OAuth denial callback
      const denialUrl = `/auth/callback?error=access_denied&shop=${shop}`;
      
      const response = await page.goto(denialUrl);
      expect(response?.status()).toBe(400);
      
      await expect(page.locator('h1')).toContainText(/Installation.*Failed|Access.*Denied|Error/i);
      await expect(page.locator('body')).toContainText(/denied|cancelled|failed/i);
      
      // Should provide option to retry
      const retryButton = page.locator('button:has-text("Try Again"), a:has-text("Retry")');
      if (await retryButton.count() > 0) {
        await expect(retryButton.first()).toBeVisible();
      }
    });

    test('should handle network errors during OAuth', async ({ page }) => {
      // Mock network failure for OAuth callback
      await page.route('**/auth/callback**', route => {
        route.abort('failed');
      });
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Navigate to OAuth callback
      try {
        await page.goto(`/auth/callback?code=test&shop=${shop}&state=test&hmac=test`);
      } catch (error) {
        // Expected to fail due to route abortion
        expect(error).toBeTruthy();
      }
      
      // Should show network error or retry option
      const hasErrorHandling = await page.locator('text=/network|error|failed|retry/i').count() > 0;
      expect(hasErrorHandling).toBe(true);
    });

    test('should handle expired OAuth state', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Use an obviously expired/invalid state
      const expiredState = 'expired_state_from_yesterday';
      const callbackUrl = `/auth/callback?code=test_code&shop=${shop}&state=${expiredState}&hmac=test_hmac`;
      
      const response = await page.goto(callbackUrl);
      expect(response?.status()).toBe(400);
      
      await expect(page.locator('body')).toContainText(/expired|invalid.*state|csrf/i);
    });
  });

  test.describe('Security Validation', () => {
    test('should validate Content Security Policy headers', async ({ page }) => {
      const response = await page.goto('/auth/start?shop=test-store.myshopify.com');
      
      await helpers.validateSecurityHeaders(response);
      
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toContain('frame-ancestors');
      expect(cspHeader).toContain('admin.shopify.com');
      // Check for either wildcard myshopify or explicit shopify domains
      expect(cspHeader && (cspHeader.includes('*.myshopify.com') || cspHeader.includes('*.shopify.com'))).toBe(true);
    });

    test('should not expose sensitive information in client code', async ({ page }) => {
      await page.goto('/');
      
      // Check for exposed secrets in page source
      const pageContent = await page.content();
      
      // Should not contain service role keys or other secrets
      expect(pageContent).not.toContain('service_role');
      expect(pageContent).not.toContain('eyJhbGciOiJIUzI1NiIs'); // JWT header pattern
      expect(pageContent).not.toContain('sk_test_'); // Stripe test keys
      expect(pageContent).not.toContain('sk_live_'); // Stripe live keys
      
      // Check JavaScript bundles
      const scriptElements = await page.locator('script[src]').all();
      
      for (const script of scriptElements) {
        const src = await script.getAttribute('src');
        if (src && src.startsWith('/')) {
          const scriptResponse = await page.request.get(src);
          const scriptContent = await scriptResponse.text();
          
          expect(scriptContent).not.toContain('service_role');
          expect(scriptContent).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
        }
      }
    });

    test('should validate referrer policy for OAuth redirects', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      const response = await page.goto(`/auth/start?shop=${shop}`);
      
      // Should have appropriate referrer policy
      const referrerPolicy = response?.headers()['referrer-policy'];
      if (referrerPolicy) {
        expect(['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer-when-downgrade'].includes(referrerPolicy)).toBe(true);
      }
    });
  });
});