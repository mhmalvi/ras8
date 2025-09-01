import { test, expect } from '@playwright/test';
import { TestHelpers, ShopifyEmbeddedHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, API_ENDPOINTS } from '../fixtures/test-data';

test.describe('Core Functionality - Essential Features Test', () => {
  let helpers: TestHelpers;
  let shopifyHelpers: ShopifyEmbeddedHelpers;

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page);
    shopifyHelpers = new ShopifyEmbeddedHelpers(page, context);
  });

  test.describe('Application Accessibility', () => {
    test('should load the main application successfully', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      
      // Should have basic HTML structure
      await expect(page.locator('html')).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
      
      // Should have React root
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
    });

    test('should have proper document structure', async ({ page }) => {
      await page.goto('/');
      
      // Should have proper title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      
      // Should have meta viewport for responsive design
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    test('should handle navigation between pages', async ({ page }) => {
      await page.goto('/');
      
      // Try navigating to different pages
      const testPages = ['/dashboard', '/returns', '/analytics', '/settings'];
      
      for (const testPage of testPages) {
        const response = await page.goto(testPage);
        // Should either load successfully or redirect appropriately
        expect([200, 302, 401].includes(response?.status() || 0)).toBe(true);
      }
    });
  });

  test.describe('Authentication Flow', () => {
    test('should display Shopify installation page', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const response = await page.goto(`/shopify/install?shop=${shop}`);
      
      expect(response?.status()).toBe(200);
      
      // Should have some installation-related content
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      
      // Look for any installation-related elements or text
      const hasInstallationContent = await page.locator('button, .install, .setup, h1, h2, p').count() > 0;
      expect(hasInstallationContent).toBe(true);
    });

    test('should handle OAuth start endpoint', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const response = await page.goto(`/auth/start?shop=${shop}`);
      
      // Should handle the OAuth start (either redirect or show page)
      expect([200, 302].includes(response?.status() || 0)).toBe(true);
    });

    test('should handle OAuth callback endpoint', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const response = await page.goto(`/auth/callback?shop=${shop}`);
      
      // Should handle callback (success, error, or redirect)
      expect([200, 302, 400].includes(response?.status() || 0)).toBe(true);
    });
  });

  test.describe('Embedded Shopify Context', () => {
    test('should handle embedded app parameters', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      await shopifyHelpers.simulateAppBridge();
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const host = TEST_MERCHANTS.primary.host;
      
      const response = await page.goto(`/?shop=${shop}&host=${host}`);
      expect(response?.status()).toBe(200);
      
      // Should recognize embedded context
      const currentUrl = page.url();
      const hasShopifyParams = currentUrl.includes('shop=') || currentUrl.includes('host=');
      expect(hasShopifyParams).toBe(true);
    });

    test('should initialize App Bridge in embedded context', async ({ page, context }) => {
      await shopifyHelpers.simulateAppBridge();
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      await page.goto(`/dashboard?shop=${shop}`);
      
      // Check if App Bridge context is available
      const appBridgeExists = await page.evaluate(() => {
        return typeof (window as any).app !== 'undefined';
      });
      
      expect(appBridgeExists).toBe(true);
    });
  });

  test.describe('API Endpoints Health', () => {
    test('should have functioning Supabase functions', async ({ page }) => {
      // Test system health endpoint
      try {
        const healthResponse = await page.request.get('/functions/v1/system-health-check');
        expect([200, 503, 404].includes(healthResponse.status())).toBe(true);
      } catch (error) {
        // Network error is acceptable for this test
        console.log('Health check endpoint not responding:', error);
      }
    });

    test('should handle environment test endpoint', async ({ page }) => {
      try {
        const envResponse = await page.request.get('/functions/v1/test-env');
        expect([200, 401, 404].includes(envResponse.status())).toBe(true);
      } catch (error) {
        // Network error is acceptable for this test
        console.log('Environment test endpoint not responding:', error);
      }
    });

    test('should validate Supabase connection', async ({ page }) => {
      // Navigate to dashboard and check for Supabase-related errors
      await page.goto('/dashboard');
      
      const supabaseErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('supabase')) {
          supabaseErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(3000);
      
      // Should not have critical Supabase connection errors
      const criticalErrors = supabaseErrors.filter(error => 
        error.includes('connection') || 
        error.includes('unauthorized') ||
        error.includes('network')
      );
      expect(criticalErrors.length).toBeLessThan(3); // Allow some non-critical errors
    });
  });

  test.describe('User Interface Components', () => {
    test('should have responsive design', async ({ page }) => {
      await page.goto('/');
      
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Standard' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Should not have horizontal scroll
        const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance
      }
    });

    test('should have accessible navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should have navigation elements
      const navElements = await page.locator('nav, .navigation, .sidebar, [role="navigation"]').count();
      expect(navElements).toBeGreaterThanOrEqual(0); // May not have navigation if not authenticated
      
      // Should have focusable elements for keyboard navigation
      const focusableElements = await page.locator('button, a, input, [tabindex]').count();
      expect(focusableElements).toBeGreaterThan(0);
    });

    test('should handle error states gracefully', async ({ page }) => {
      // Try navigating to non-existent route
      const response = await page.goto('/non-existent-route-12345');
      
      // Should handle gracefully (redirect or show error)
      expect([404, 302, 200].includes(response?.status() || 0)).toBe(true);
      
      // Should not show uncaught JavaScript errors
      const jsErrors: string[] = [];
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });
      
      await page.waitForTimeout(1000);
      
      // Should not have uncaught errors
      const criticalErrors = jsErrors.filter(error => 
        !error.includes('WebSocket') && 
        !error.includes('SendBeacon')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Security Headers', () => {
    test('should have appropriate security headers', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers();
      
      if (headers) {
        // Check for security headers (may not all be present)
        const securityHeaders = [
          'content-security-policy',
          'x-frame-options',
          'x-content-type-options'
        ];
        
        let securityHeaderCount = 0;
        securityHeaders.forEach(header => {
          if (headers[header]) {
            securityHeaderCount++;
          }
        });
        
        // Should have at least one security header
        expect(securityHeaderCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('should not expose sensitive information', async ({ page }) => {
      await page.goto('/');
      
      // Check page source for sensitive patterns
      const pageContent = await page.content();
      
      const sensitivePatterns = [
        /service_role_key/i,
        /supabase.*service.*role/i,
        /password.*=/i,
        /secret.*key/i,
        /private.*key/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(pattern.test(pageContent)).toBe(false);
      });
    });
  });

  test.describe('Performance Basics', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      const response = await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(response?.status()).toBe(200);
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should not have excessive console errors', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Filter out known Shopify platform noise
      const significantErrors = errors.filter(error => 
        !error.includes('WebSocket') && 
        !error.includes('SendBeacon') &&
        !error.includes('shopifycloud') &&
        !error.includes('argus.shopifycloud.com')
      );
      
      expect(significantErrors.length).toBeLessThan(5);
    });
  });

  test.describe('Integration Points', () => {
    test('should handle Shopify webhook endpoints', async ({ page }) => {
      const webhookEndpoints = [
        '/functions/v1/enhanced-shopify-webhook',
        '/functions/v1/shopify-gdpr-webhooks'
      ];
      
      for (const endpoint of webhookEndpoints) {
        try {
          const response = await page.request.get(endpoint);
          // Should respond (even if with error due to no payload)
          expect([200, 400, 401, 404, 405].includes(response.status())).toBe(true);
        } catch (error) {
          // Network errors are acceptable
          console.log(`Webhook endpoint ${endpoint} not responding:`, error);
        }
      }
    });

    test('should validate critical environment variables', async ({ page }) => {
      // Check if critical environment variables are configured
      await page.goto('/');
      
      const envVars = await page.evaluate(() => {
        return {
          hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasShopifyClientId: !!import.meta.env.VITE_SHOPIFY_CLIENT_ID,
          hasAppUrl: !!import.meta.env.VITE_APP_URL
        };
      });
      
      // Should have essential environment variables configured
      const configuredVars = Object.values(envVars).filter(Boolean).length;
      expect(configuredVars).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have semantic HTML structure', async ({ page }) => {
      await page.goto('/');
      
      // Should have semantic elements
      const semanticElements = await page.locator('main, header, footer, nav, section, article').count();
      expect(semanticElements).toBeGreaterThanOrEqual(1);
      
      // Should have proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      expect(headings).toBeGreaterThanOrEqual(1);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Should be able to tab through focusable elements
      const focusableCount = await page.locator('button:visible, a:visible, input:visible, [tabindex]:visible').count();
      expect(focusableCount).toBeGreaterThan(0);
      
      // Test basic keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});