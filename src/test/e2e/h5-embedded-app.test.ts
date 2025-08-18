/**
 * H5 Embedded App E2E Tests
 * Tests the complete Shopify embedded app flow
 */

import { test, expect } from '@playwright/test';

const SHOPIFY_SHOP = 'test-shop.myshopify.com';
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const HOST_PARAM = Buffer.from(`${SHOPIFY_SHOP}/admin`).toString('base64').replace(/=/g, '');

test.describe('H5 Embedded App Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser error: ${msg.text()}`);
      }
    });

    // Set up error logging
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('App shows H5 name during installation', async ({ page }) => {
    // Navigate to OAuth callback simulation
    await page.goto(`${APP_URL}/functions/v1/shopify-oauth-callback?code=test&shop=${SHOPIFY_SHOP}&hmac=test`);
    
    // Should show H5 in the installation success page
    await expect(page.locator('title')).toContainText('H5');
    await expect(page.locator('h1, h2, .success')).toContainText('H5');
  });

  test('App embeds correctly with shop and host parameters', async ({ page }) => {
    // Navigate to app with embedded parameters
    const embeddedUrl = `${APP_URL}/?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(embeddedUrl);

    // Wait for App Bridge initialization
    await page.waitForLoadState('networkidle');

    // Should detect embedded context and redirect to dashboard
    await expect(page).toHaveURL(new RegExp('/dashboard'));
    
    // Should show H5 branding in sidebar
    await expect(page.locator('[data-testid="sidebar-title"]')).toContainText('H5');
  });

  test('AuthInline page shows H5 branding', async ({ page }) => {
    // Navigate to re-embed page
    const authInlineUrl = `${APP_URL}/auth/inline?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(authInlineUrl);

    // Should show H5 loading text
    await expect(page.locator('h2')).toContainText('Launching H5');
    await expect(page.locator('p')).toContainText('embed your app into Shopify');
  });

  test('Dashboard loads without errors in embedded context', async ({ page }) => {
    // Navigate directly to dashboard with embedded parameters
    const dashboardUrl = `${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(dashboardUrl);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for H5 branding
    await expect(page.locator('h1, [data-testid="app-title"]')).toContainText('H5');

    // Should show embedded app layout (narrower sidebar)
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Check for empty states (should not crash with no data)
    const loadingIndicators = page.locator('[data-testid="loading"]');
    if (await loadingIndicators.count() > 0) {
      await loadingIndicators.first().waitFor({ state: 'hidden', timeout: 10000 });
    }

    // Should not show error boundaries
    await expect(page.locator('[data-testid="error-boundary"]')).toHaveCount(0);
  });

  test('Settings billing navigation works correctly', async ({ page }) => {
    // Navigate to dashboard first
    const dashboardUrl = `${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(dashboardUrl);

    // Click on plan/usage box in sidebar
    await page.locator('[data-testid="subscription-info"]').click();

    // Should navigate to settings/billing
    await expect(page).toHaveURL(new RegExp('/settings/billing'));

    // Go back to dashboard and try Settings navigation
    await page.goto(dashboardUrl);
    
    // Navigate to Settings
    await page.locator('a[href="/settings"]').click();
    await expect(page).toHaveURL(new RegExp('/settings'));

    // Click on billing card
    await page.locator('a[href="/settings/billing"]').click();
    await expect(page).toHaveURL(new RegExp('/settings/billing'));
  });

  test('Integrations page displays correctly', async ({ page }) => {
    // Navigate to integrations
    const integrationsUrl = `${APP_URL}/integrations?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(integrationsUrl);

    // Should show integrations header
    await expect(page.locator('h1')).toContainText('Integrations');

    // Should show integration cards
    await expect(page.locator('[data-testid="integration-card"]')).toHaveCount.greaterThan(0);

    // Shopify should be marked as connected
    const shopifyCard = page.locator('[data-testid="integration-shopify"]');
    await expect(shopifyCard.locator('.badge')).toContainText('Connected');

    // Click manage button should not crash
    await shopifyCard.locator('button:has-text("Manage")').click();
    // Should show toast notification
    await expect(page.locator('[data-testid="toast"]')).toBeVisible();
  });

  test('Error boundaries handle errors gracefully', async ({ page }) => {
    // Navigate to dashboard
    const dashboardUrl = `${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(dashboardUrl);

    // Inject an error to test error boundary
    await page.evaluate(() => {
      // Simulate a component error
      window.dispatchEvent(new Error('Test error boundary'));
    });

    // If error boundary triggers, should show error UI
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    if (await errorBoundary.isVisible()) {
      // Should show retry button
      await expect(errorBoundary.locator('button:has-text("Try Again")')).toBeVisible();
      
      // Should show error ID
      await expect(errorBoundary.locator('[data-testid="error-id"]')).toBeVisible();
    }
  });

  test('Empty states render without crashing', async ({ page }) => {
    // Navigate to various pages that might show empty states
    const pages = [
      '/returns',
      '/analytics', 
      '/customers',
      '/products'
    ];

    for (const pagePath of pages) {
      const url = `${APP_URL}${pagePath}?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
      await page.goto(url);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Should not crash (no error boundary)
      await expect(page.locator('[data-testid="error-boundary"]')).toHaveCount(0);
      
      // Should show some content (even if empty state)
      await expect(page.locator('main, [data-testid="main-content"]')).toBeVisible();
    }
  });

  test('App maintains shop context across navigation', async ({ page }) => {
    // Start at dashboard
    const dashboardUrl = `${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`;
    await page.goto(dashboardUrl);

    // Navigate to different pages
    const navigationTests = [
      { link: 'a[href="/returns"]', expectedUrl: '/returns' },
      { link: 'a[href="/analytics"]', expectedUrl: '/analytics' },
      { link: 'a[href="/settings"]', expectedUrl: '/settings' }
    ];

    for (const nav of navigationTests) {
      await page.locator(nav.link).click();
      await expect(page).toHaveURL(new RegExp(nav.expectedUrl));
      
      // Should maintain shop and host parameters
      const url = new URL(page.url());
      expect(url.searchParams.get('shop')).toBe(SHOPIFY_SHOP);
      expect(url.searchParams.get('host')).toBe(HOST_PARAM);
      
      // Go back to dashboard for next test
      await page.locator('a[href="/dashboard"]').click();
      await expect(page).toHaveURL(new RegExp('/dashboard'));
    }
  });

  test('Health check endpoint responds correctly', async ({ page, request }) => {
    // Test health check functionality
    await page.goto(`${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`);
    
    // Run health check via JavaScript
    const healthResult = await page.evaluate(async () => {
      // Import health check function
      const { performHealthCheck } = await import('/src/utils/healthCheck.ts');
      return await performHealthCheck();
    });

    expect(healthResult.overall).toMatch(/healthy|degraded|unhealthy/);
    expect(healthResult.checks).toHaveLength.greaterThan(0);
    expect(healthResult.timestamp).toBeTruthy();
  });

  test('Environment validation works correctly', async ({ page }) => {
    // Test that environment validation runs at startup
    await page.goto(APP_URL);
    
    // Check console for environment validation messages
    const logs = await page.evaluate(() => {
      return window.console.history?.filter(log => 
        log.includes('Environment validation') || 
        log.includes('H5 App')
      ) || [];
    });

    // Should have validation success message
    expect(logs.some(log => log.includes('Environment validation passed'))).toBe(true);
  });
});

test.describe('H5 Webhook Simulation', () => {
  test('Webhook endpoint handles valid requests', async ({ request }) => {
    // This would require a test webhook endpoint
    // Skip if webhook secret is not configured
    if (!process.env.SHOPIFY_WEBHOOK_SECRET || 
        process.env.SHOPIFY_WEBHOOK_SECRET === 'your_webhook_secret_here') {
      test.skip('Webhook secret not configured');
    }

    // Test webhook endpoint (would need proper HMAC signing)
    const webhookUrl = `${APP_URL}/functions/v1/shopify-webhook`;
    
    // Note: This would require proper HMAC signature generation
    // For now, just test that endpoint exists
    const response = await request.post(webhookUrl, {
      data: { test: 'data' },
      headers: {
        'x-shopify-topic': 'orders/create',
        'x-shopify-shop-domain': SHOPIFY_SHOP,
        'x-shopify-hmac-sha256': 'test-signature',
        'x-shopify-timestamp': Math.floor(Date.now() / 1000).toString()
      }
    });

    // Should return error for invalid signature (expected)
    expect(response.status()).toBe(401);
  });
});

test.describe('H5 Performance Tests', () => {
  test('App loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`App loaded in ${loadTime}ms`);
  });

  test('Navigation between pages is fast', async ({ page }) => {
    // Start at dashboard
    await page.goto(`${APP_URL}/dashboard?shop=${SHOPIFY_SHOP}&host=${HOST_PARAM}`);
    await page.waitForLoadState('networkidle');

    // Test navigation speed
    const navigationTests = ['/returns', '/analytics', '/settings'];
    
    for (const path of navigationTests) {
      const startTime = Date.now();
      
      await page.locator(`a[href="${path}"]`).click();
      await page.waitForLoadState('networkidle');
      
      const navTime = Date.now() - startTime;
      
      // Navigation should be under 2 seconds
      expect(navTime).toBeLessThan(2000);
      
      console.log(`Navigation to ${path} took ${navTime}ms`);
    }
  });
});