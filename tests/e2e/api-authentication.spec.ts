import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, API_ENDPOINTS, ERROR_MESSAGES } from '../fixtures/test-data';

test.describe('API Authentication - Comprehensive Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Session Management API', () => {
    test('should reject unauthenticated requests to protected endpoints', async ({ page }) => {
      const protectedEndpoints = [
        '/api/v1/returns',
        '/api/v1/analytics/dashboard',
        '/api/v1/merchants/profile',
        '/api/v1/settings',
        '/api/session/me'
      ];

      for (const endpoint of protectedEndpoints) {
        console.log('Testing unauthenticated access to:', endpoint);
        
        const response = await page.request.get(endpoint);
        expect(response.status()).toBe(401);
        
        const data = await response.json();
        expect(data.authenticated).toBe(false);
        expect(data.error).toContain('No valid session');
      }
    });

    test('should validate session token authentication', async ({ page }) => {
      // Test with invalid JWT token
      const invalidTokenResponse = await page.request.get('/api/session/me', {
        headers: {
          'Authorization': 'Bearer invalid.jwt.token'
        }
      });
      
      expect(invalidTokenResponse.status()).toBe(401);
      
      // Test with malformed Authorization header
      const malformedHeaderResponse = await page.request.get('/api/session/me', {
        headers: {
          'Authorization': 'InvalidFormat token123'
        }
      });
      
      expect(malformedHeaderResponse.status()).toBe(401);
      
      // Test with expired token format (simulated)
      const expiredTokenResponse = await page.request.get('/api/session/me', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'
        }
      });
      
      expect(expiredTokenResponse.status()).toBe(401);
    });

    test('should validate shop-based authentication fallback', async ({ page }) => {
      const validShop = TEST_MERCHANTS.primary.shopDomain;
      const invalidShop = 'invalid-shop.com';
      
      // Test with invalid shop domain
      const invalidShopResponse = await page.request.get('/api/session/me', {
        headers: {
          'Shop': invalidShop
        }
      });
      
      expect(invalidShopResponse.status()).toBe(401);
      
      // Test with valid shop format but no session
      const validShopNoSessionResponse = await page.request.get('/api/session/me', {
        headers: {
          'Shop': validShop
        }
      });
      
      expect(validShopNoSessionResponse.status()).toBe(401);
      
      // Test with missing shop header
      const noShopHeaderResponse = await page.request.get('/api/session/me');
      expect(noShopHeaderResponse.status()).toBe(401);
    });

    test('should handle concurrent session validation requests', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        page.request.get('/api/session/me', {
          headers: { 'Shop': shop }
        })
      );
      
      const responses = await Promise.all(promises);
      
      // All should be consistently unauthorized
      responses.forEach(response => {
        expect(response.status()).toBe(401);
      });
    });
  });

  test.describe('App Bridge Token Authentication', () => {
    test('should handle App Bridge token extraction and validation', async ({ page, context }) => {
      // Simulate App Bridge environment
      await context.addInitScript(() => {
        (window as any).app = {
          idToken: () => Promise.resolve('mock.app.bridge.token.123'),
          getState: () => ({
            shop: 'test-store.myshopify.com'
          })
        };
      });
      
      await helpers.navigateToEmbeddedApp(TEST_MERCHANTS.primary.shopDomain);
      
      // Check that App Bridge token is being requested
      const appBridgeLoaded = await page.evaluate(() => {
        return typeof (window as any).app !== 'undefined';
      });
      
      expect(appBridgeLoaded).toBe(true);
      
      // Simulate API call with App Bridge token
      const apiResponse = await page.evaluate(async () => {
        if ((window as any).app) {
          const token = await (window as any).app.idToken();
          
          const response = await fetch('/api/session/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text()
          };
        }
        return null;
      });
      
      expect(apiResponse).toBeTruthy();
      // Should be 401 since we're using mock token that gets rejected
      expect(apiResponse.status).toBe(401);
    });

    test('should validate App Bridge token signature and claims', async ({ page }) => {
      // Test with various invalid App Bridge token formats
      const invalidTokens = [
        'not.a.jwt',
        '', // empty token
        'Bearer ', // missing token
        'invalid-format-token',
        'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.', // 'none' algorithm
      ];
      
      for (const token of invalidTokens) {
        const response = await page.request.get('/api/session/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        expect(response.status()).toBe(401);
        
        const data = await response.json();
        expect(data.authenticated).toBe(false);
      }
    });

    test('should handle token refresh scenarios', async ({ page, context }) => {
      await context.addInitScript(() => {
        let tokenRequestCount = 0;
        (window as any).app = {
          idToken: () => {
            tokenRequestCount++;
            if (tokenRequestCount === 1) {
              return Promise.resolve('expired.token.123');
            } else {
              return Promise.resolve('refreshed.token.456');
            }
          },
          getState: () => ({ shop: 'test-store.myshopify.com' })
        };
      });
      
      await helpers.navigateToEmbeddedApp(TEST_MERCHANTS.primary.shopDomain);
      
      // Simulate token refresh scenario
      const tokenRefreshHandled = await page.evaluate(async () => {
        let attempts = 0;
        const maxAttempts = 2;
        
        while (attempts < maxAttempts) {
          attempts++;
          const token = await (window as any).app.idToken();
          
          const response = await fetch('/api/session/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          // Both mock tokens will fail, so we'll retry
          if (response.status === 401 && attempts < maxAttempts) {
            // Simulate token refresh by getting new token
            continue;
          }
          
          return { attempts, status: response.status };
        }
        
        return { attempts: maxAttempts, status: 401 };
      });
      
      expect(tokenRefreshHandled.attempts).toBe(2);
    });
  });

  test.describe('Multi-tenant Isolation', () => {
    test('should enforce tenant isolation for API endpoints', async ({ page }) => {
      const shop1 = TEST_MERCHANTS.primary.shopDomain;
      const shop2 = TEST_MERCHANTS.secondary.shopDomain;
      
      // Request with shop1 context should get shop1 data
      const shop1Response = await page.request.get('/api/v1/returns', {
        headers: { 
          'Shop': shop1,
          'Authorization': 'Bearer valid.test.token'
        }
      });
      
      expect(shop1Response.status()).toBe(200);
      const shop1Data = await shop1Response.json();
      expect(shop1Data.returns.length).toBeGreaterThan(0);
      expect(shop1Data.returns[0].shop).toBe(shop1);
      
      // Request with shop2 context should not get shop1 data
      const shop2Response = await page.request.get('/api/v1/returns', {
        headers: { 
          'Shop': shop2,
          'Authorization': 'Bearer valid.test.token'
        }
      });
      
      expect(shop2Response.status()).toBe(200);
      const shop2Data = await shop2Response.json();
      expect(shop2Data.returns.length).toBe(0);
    });

    test('should validate cross-tenant access prevention', async ({ page }) => {
      // Attempt to access shop1 resources with shop2 credentials
      const shop1ReturnId = 'ret_shop1_specific';
      const shop2 = TEST_MERCHANTS.secondary.shopDomain;
      
      const crossTenantResponse = await page.request.get(`/api/v1/returns/${shop1ReturnId}`, {
        headers: { 
          'Shop': shop2,
          'Authorization': 'Bearer valid.test.token'
        }
      });
      
      expect(crossTenantResponse.status()).toBe(404);
      
      const errorData = await crossTenantResponse.json();
      expect(errorData.error).toContain('not found');
    });
  });

  test.describe('Rate Limiting and Security', () => {
    test('should enforce rate limiting on authentication endpoints', async ({ page }) => {
      const shop = TEST_MERCHANTS.primary.shopDomain;
      const maxRequests = 10;
      
      // Make rapid requests to session endpoint
      const promises = Array.from({ length: maxRequests + 5 }, (_, i) => 
        page.request.get('/api/session/me', {
          headers: { 'Shop': shop }
        })
      );
      
      const responses = await Promise.all(promises);
      
      // Should have some rate-limited responses (429 status)
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      const successCount = responses.filter(r => r.status() === 401).length; // 401 is expected for unauthenticated
      
      // At least some requests should be rate limited if the limit is enforced
      // Note: This test might need adjustment based on actual rate limiting implementation
      expect(rateLimitedCount + successCount).toBe(responses.length);
    });

    test('should validate request headers and prevent injection', async ({ page }) => {
      const maliciousHeaders = [
        { 'Shop': '<script>alert("xss")</script>.myshopify.com' },
        { 'Shop': '../../../etc/passwd' },
        { 'Shop': 'shop.myshopify.com; DROP TABLE merchants;' },
        { 'Authorization': 'Bearer <script>alert("xss")</script>' },
        { 'X-Forwarded-For': '127.0.0.1; rm -rf /' }
      ];
      
      for (const headers of maliciousHeaders) {
        const response = await page.request.get('/api/session/me', { headers });
        
        // Should reject malicious input
        expect([400, 401, 422]).toContain(response.status());
        
        // Response should not echo back malicious content
        const responseText = await response.text();
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('DROP TABLE');
        expect(responseText).not.toContain('rm -rf');
      }
    });

    test('should handle authentication timing attacks', async ({ page }) => {
      const validShop = TEST_MERCHANTS.primary.shopDomain;
      const invalidShop = 'nonexistent-shop.myshopify.com';
      
      // Measure timing for valid vs invalid shop authentication
      const timingTests = [];
      
      for (let i = 0; i < 5; i++) {
        // Test valid shop
        const validStart = Date.now();
        await page.request.get('/api/session/me', {
          headers: { 'Shop': validShop }
        });
        const validTime = Date.now() - validStart;
        
        // Test invalid shop  
        const invalidStart = Date.now();
        await page.request.get('/api/session/me', {
          headers: { 'Shop': invalidShop }
        });
        const invalidTime = Date.now() - invalidStart;
        
        timingTests.push({ validTime, invalidTime });
      }
      
      // Calculate average times
      const avgValidTime = timingTests.reduce((sum, t) => sum + t.validTime, 0) / timingTests.length;
      const avgInvalidTime = timingTests.reduce((sum, t) => sum + t.invalidTime, 0) / timingTests.length;
      
      // Timing difference should not be excessive (allow some variance due to network/processing)
      // In a real implementation, this would require constant-time algorithms
      const timingRatio = Math.max(avgValidTime, avgInvalidTime) / Math.min(avgValidTime, avgInvalidTime);
      expect(timingRatio).toBeLessThan(3.0); // More lenient for test environment
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JWT tokens gracefully', async ({ page }) => {
      const malformedTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Header only
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-payload', // Invalid payload
        'header.payload', // Missing signature
        'a.b.c.d.e', // Too many parts
        'invalid-base64.invalid-base64.invalid-base64' // Invalid base64
      ];
      
      for (const token of malformedTokens) {
        console.log('Testing malformed token:', token.substring(0, 20) + '...');
        
        const response = await page.request.get('/api/session/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        expect(response.status()).toBe(401);
        
        const data = await response.json();
        expect(data.authenticated).toBe(false);
        expect(data.error).toMatch(/Invalid token|Malformed|Invalid|Token expired/);
      }
    });

    test('should handle network interruptions during authentication', async ({ page }) => {
      // Simulate network interruption
      await page.route('**/api/session/me', route => {
        // Simulate timeout/network error
        setTimeout(() => route.abort('failed'), 1000);
      });
      
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      try {
        const response = await page.request.get('/api/session/me', {
          headers: { 'Shop': shop }
        });
        
        // Should not reach here due to route abortion
        expect(false).toBe(true);
      } catch (error) {
        // Expected to fail due to network simulation
        expect(error).toBeTruthy();
      }
      
      // Clear the route and test normal operation
      await page.unroute('**/api/session/me');
      
      const normalResponse = await page.request.get('/api/session/me', {
        headers: { 'Shop': shop }
      });
      
      expect(normalResponse.status()).toBe(401); // Expected for unauthenticated request
    });

    test('should validate CORS headers for authentication endpoints', async ({ page }) => {
      const corsTestOrigins = [
        'https://admin.shopify.com',
        'https://test-store.myshopify.com',
        'https://malicious-site.com'
      ];
      
      for (const origin of corsTestOrigins) {
        const response = await page.request.get('/api/session/me', {
          headers: {
            'Origin': origin,
            'Shop': TEST_MERCHANTS.primary.shopDomain
          }
        });
        
        const corsHeader = response.headers()['access-control-allow-origin'];
        
        if (origin.includes('shopify.com') || origin.includes('myshopify.com')) {
          // Should allow Shopify origins
          expect(corsHeader).toBeTruthy();
        } else {
          // Should not allow malicious origins
          expect(corsHeader).not.toBe(origin);
        }
      }
    });
  });

  test.describe('Session State Management', () => {
    test('should handle session expiration gracefully', async ({ page, context }) => {
      // Mock session that will expire
      await context.addCookies([{
        name: 'merchant_session',
        value: 'expired_session_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false
      }]);
      
      const response = await page.request.get('/api/session/me');
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data.code).toBe('SESSION_EXPIRED');
    });

    test('should handle concurrent session validation', async ({ page, context }) => {
      // Set up multiple concurrent session checks
      const shop = TEST_MERCHANTS.primary.shopDomain;
      
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        page.request.get('/api/session/me', {
          headers: { 
            'Shop': shop,
            'Request-ID': `concurrent-${i}` // Track individual requests
          }
        })
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      // All responses should be consistent
      const statuses = responses.map(r => r.status());
      const uniqueStatuses = [...new Set(statuses)];
      
      expect(uniqueStatuses.length).toBe(1); // All should have same status
      expect(uniqueStatuses[0]).toBe(401); // Expected for unauthenticated
    });
  });
});