import { Page, expect, BrowserContext } from '@playwright/test';
import { TEST_MERCHANTS } from '../fixtures/test-data';

/**
 * Utility functions for H5 Returns Automation e2e tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to app with Shopify shop parameters
   */
  async navigateToEmbeddedApp(shop?: string) {
    const testShop = shop || TEST_MERCHANTS.primary.shopDomain;
    const host = Buffer.from(testShop + '/admin').toString('base64');
    
    const url = `/?shop=${testShop}&host=${host}`;
    await this.page.goto(url);
  }

  /**
   * Wait for App Bridge to initialize
   */
  async waitForAppBridge(timeout = 10000) {
    await this.page.waitForFunction(() => {
      return window.app !== undefined;
    }, { timeout });
  }

  /**
   * Simulate OAuth callback with valid parameters
   */
  async simulateOAuthCallback(shop?: string, state?: string) {
    const testShop = shop || TEST_MERCHANTS.primary.shopDomain;
    const testState = state || 'valid_test_state_12345';
    
    const callbackUrl = `/auth/callback?code=test_auth_code&shop=${testShop}&state=${testState}&hmac=test_hmac`;
    await this.page.goto(callbackUrl);
  }

  /**
   * Check for security headers
   */
  async validateSecurityHeaders(response: any) {
    const headers = response.headers();
    
    // Check CSP headers
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toContain('frame-ancestors');
    
    // Check other security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('ALLOWALL'); // For Shopify embedding
  }

  /**
   * Wait for and validate API response
   */
  async waitForAPICall(urlPattern: string | RegExp, method = 'GET') {
    return await this.page.waitForResponse(response => {
      const url = response.url();
      const matchesPattern = typeof urlPattern === 'string' ? 
        url.includes(urlPattern) : urlPattern.test(url);
      return matchesPattern && response.request().method() === method;
    });
  }

  /**
   * Fill form and submit with validation
   */
  async fillFormAndSubmit(formSelector: string, data: Record<string, string>) {
    for (const [field, value] of Object.entries(data)) {
      await this.page.fill(`${formSelector} [name="${field}"]`, value);
    }
    
    await this.page.click(`${formSelector} button[type="submit"]`);
  }

  /**
   * Check console for specific messages
   */
  async expectConsoleMessage(messagePattern: string | RegExp, timeout = 5000) {
    const messages: string[] = [];
    
    const listener = (msg: any) => {
      messages.push(msg.text());
    };
    
    this.page.on('console', listener);
    
    await expect.poll(() => {
      return messages.some(msg => 
        typeof messagePattern === 'string' ? 
          msg.includes(messagePattern) : 
          messagePattern.test(msg)
      );
    }, { timeout }).toBe(true);
    
    this.page.off('console', listener);
  }

  /**
   * Mock API responses for testing
   */
  async mockAPIResponse(pattern: string | RegExp, responseData: any, status = 200) {
    await this.page.route(pattern, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  /**
   * Simulate Shopify webhook
   */
  async simulateWebhook(endpoint: string, payload: any, hmacSignature?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': 'orders/updated',
      'X-Shopify-Shop-Domain': TEST_MERCHANTS.primary.shopDomain,
    };
    
    if (hmacSignature) {
      headers['X-Shopify-Hmac-Sha256'] = hmacSignature;
    }

    return await this.page.request.post(endpoint, {
      headers,
      data: payload
    });
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete(timeout = 10000) {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('.loading', { state: 'hidden', timeout }).catch(() => {
      // Ignore if no loading element exists
    });
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Validate accessibility basics
   */
  async validateAccessibility() {
    // Check for alt texts on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for proper heading structure
    const h1Count = await this.page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1

    // Check for form labels
    const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const labelExists = await this.page.locator(`label[for="${id}"]`).count() > 0;
        expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  }
}

/**
 * Context-specific helpers for embedded Shopify apps
 */
export class ShopifyEmbeddedHelpers {
  constructor(private page: Page, private context: BrowserContext) {}

  /**
   * Simulate iframe embedding context
   */
  async simulateEmbeddedContext() {
    // Add Shopify-specific headers and context
    await this.context.addInitScript(() => {
      // Simulate being in an iframe
      Object.defineProperty(window, 'top', {
        value: {},
        writable: false
      });
      
      // Add Shopify global objects that might be expected
      (window as any).__SHOPIFY_ANALYTICS__ = {
        lib: {
          track: () => {},
          page: () => {}
        }
      };
    });
  }

  /**
   * Simulate App Bridge environment
   */
  async simulateAppBridge() {
    await this.context.addInitScript(() => {
      // Mock App Bridge if not loaded from Shopify CDN
      if (!(window as any).app) {
        (window as any).app = {
          getState: () => ({}),
          dispatch: () => {},
          idToken: () => Promise.resolve('mock.jwt.token'),
          localOrigin: 'https://test-store.myshopify.com',
        };
      }
    });
  }

  /**
   * Test CSP compliance for embedded context
   */
  async validateEmbeddingCSP(response: any) {
    const cspHeader = response.headers()['content-security-policy'];
    
    expect(cspHeader).toContain('frame-ancestors');
    expect(cspHeader).toContain('*.shopify.com');
    expect(cspHeader).toContain('*.myshopify.com');
    
    // Should not contain unsafe-inline in script-src for security
    if (cspHeader.includes('script-src')) {
      expect(cspHeader).not.toContain('unsafe-inline');
    }
  }
}

/**
 * Performance testing helpers
 */
export class PerformanceHelpers {
  constructor(private page: Page) {}

  /**
   * Measure page load performance
   */
  async measurePageLoad() {
    const startTime = Date.now();
    
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Performance assertions
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    
    return {
      loadTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check Core Web Vitals
   */
  async measureWebVitals() {
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          resolve(entries);
        }).observe({ type: 'navigation', buffered: true });
      });
    });

    return metrics;
  }
}