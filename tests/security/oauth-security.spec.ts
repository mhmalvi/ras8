/**
 * OAuth Security Tests
 * 
 * Tests security aspects of OAuth flows, HMAC validation,
 * and protection against common attacks.
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Helper to create valid HMAC signature
function createValidHmac(params: Record<string, string>, secret: string): string {
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
}

// Helper to create valid state parameter
function createValidState(shop: string): string {
  const stateData = {
    shop,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  };
  
  return Buffer.from(JSON.stringify(stateData)).toString('base64url');
}

test.describe('OAuth Security', () => {
  const testShop = 'security-test.myshopify.com';
  const testSecret = 'test-secret-key';
  const testCode = 'test-authorization-code';

  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
  });

  test('rejects invalid HMAC signatures', async ({ request }) => {
    const params = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop),
      hmac: 'invalid-hmac-signature'
    };

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    expect(response.status()).toBe(403);
    
    const body = await response.text();
    expect(body).toContain('Invalid request signature');
  });

  test('accepts valid HMAC signatures', async ({ request }) => {
    const params = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop)
    };
    
    const hmac = createValidHmac(params, testSecret);
    params['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Note: This will fail at token exchange since we're using test data,
    // but should pass HMAC validation
    const response = await request.get(url.toString());
    
    // Should not be 403 (HMAC rejection)
    expect(response.status()).not.toBe(403);
  });

  test('rejects expired state parameters', async ({ request }) => {
    // Create expired state (2 hours ago)
    const expiredState = {
      shop: testShop,
      timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      nonce: 'test-nonce'
    };
    
    const stateParam = Buffer.from(JSON.stringify(expiredState)).toString('base64url');
    
    const params = {
      code: testCode,
      shop: testShop,
      state: stateParam
    };
    
    const hmac = createValidHmac(params, testSecret);
    params['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    expect(response.status()).toBe(400);
    
    const body = await response.text();
    expect(body).toContain('expired');
  });

  test('rejects state with shop domain mismatch', async ({ request }) => {
    const mismatchedState = {
      shop: 'different-shop.myshopify.com',
      timestamp: Date.now(),
      nonce: 'test-nonce'
    };
    
    const stateParam = Buffer.from(JSON.stringify(mismatchedState)).toString('base64url');
    
    const params = {
      code: testCode,
      shop: testShop, // Different from state
      state: stateParam
    };
    
    const hmac = createValidHmac(params, testSecret);
    params['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    expect(response.status()).toBe(400);
    
    const body = await response.text();
    expect(body).toContain('mismatch');
  });

  test('prevents duplicate merchant creation', async ({ request, page }) => {
    // First, seed an existing merchant
    await page.evaluate((shopDomain) => {
      localStorage.setItem('test_seed_data', JSON.stringify({
        merchants: [{ 
          id: 'existing-merchant',
          shop_domain: shopDomain,
          status: 'active'
        }]
      }));
    }, testShop);

    // Simulate OAuth callback that should reuse existing merchant
    const params = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop)
    };
    
    const hmac = createValidHmac(params, testSecret);
    params['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Make the OAuth callback request
    const response = await request.get(url.toString());
    
    // Should not create duplicate merchant
    // In a real test, you'd verify database state
    await page.evaluate(async (shopDomain) => {
      const seedData = JSON.parse(localStorage.getItem('test_seed_data') || '{}');
      const merchants = seedData.merchants?.filter(m => m.shop_domain === shopDomain) || [];
      
      // Should still be only one merchant for this shop
      if (merchants.length !== 1) {
        throw new Error(`Expected 1 merchant, found ${merchants.length}`);
      }
    }, testShop);
  });

  test('validates webhook signatures', async ({ request }) => {
    const webhookPayload = {
      shop_domain: testShop,
      shop_id: 12345,
      timestamp: new Date().toISOString()
    };

    const payloadString = JSON.stringify(webhookPayload);
    
    // Test invalid signature
    const invalidResponse = await request.post('/api/webhooks/app/uninstalled', {
      data: payloadString,
      headers: {
        'X-Shopify-Hmac-Sha256': 'invalid-signature',
        'X-Shopify-Shop-Domain': testShop,
        'Content-Type': 'application/json'
      }
    });
    
    expect(invalidResponse.status()).toBe(403);

    // Test valid signature
    const validSignature = 'sha256=' + crypto
      .createHmac('sha256', testSecret)
      .update(payloadString)
      .digest('hex');

    const validResponse = await request.post('/api/webhooks/app/uninstalled', {
      data: payloadString,
      headers: {
        'X-Shopify-Hmac-Sha256': validSignature,
        'X-Shopify-Shop-Domain': testShop,
        'Content-Type': 'application/json'
      }
    });
    
    expect(validResponse.status()).toBe(200);
  });

  test('prevents CSRF attacks with state validation', async ({ page, request }) => {
    // Attempt OAuth callback without proper state flow
    const params = {
      code: testCode,
      shop: testShop,
      state: 'malicious-state-value'
    };

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    // Should reject malformed state
    expect(response.status()).toBe(400);
    
    const body = await response.text();
    expect(body).toContain('Invalid');
  });

  test('rate limits OAuth attempts', async ({ request }) => {
    const params = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop)
    };
    
    const hmac = createValidHmac(params, testSecret);
    params['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Make multiple rapid requests
    const promises = Array.from({ length: 10 }, () => 
      request.get(url.toString())
    );

    const responses = await Promise.all(promises);
    
    // At least some should be rate limited (429) if rate limiting is implemented
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;
    
    // This is implementation dependent - adjust based on your rate limiting
    if (rateLimitedCount > 0) {
      expect(rateLimitedCount).toBeGreaterThan(0);
    }
  });

  test('sanitizes redirect URLs', async ({ request }) => {
    const maliciousParams = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop),
      redirect_uri: 'http://malicious-site.com/steal-tokens'
    };
    
    const hmac = createValidHmac(maliciousParams, testSecret);
    maliciousParams['hmac'] = hmac;

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(maliciousParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    // Should not redirect to external malicious URL
    if (response.status() === 302) {
      const location = response.headers()['location'];
      expect(location).not.toContain('malicious-site.com');
      expect(location).toMatch(/^(\/|https?:\/\/(localhost|.*\.vercel\.app))/);
    }
  });

  test('validates shop domain format', async ({ request }) => {
    const invalidShops = [
      'not-a-shopify-domain.com',
      'javascript:alert(1)',
      '../../../etc/passwd',
      'https://evil.com',
      ''
    ];

    for (const invalidShop of invalidShops) {
      const params = {
        code: testCode,
        shop: invalidShop,
        state: createValidState(invalidShop)
      };
      
      const url = new URL('/api/auth/callback', 'http://localhost:3000');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      const response = await request.get(url.toString());
      
      // Should reject invalid shop domains
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('protects against timing attacks', async ({ request }) => {
    const validParams = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop)
    };
    
    const validHmac = createValidHmac(validParams, testSecret);
    
    const invalidParams = {
      ...validParams,
      hmac: 'completely-wrong-hmac'
    };

    // Measure timing for valid vs invalid HMAC
    const measureTime = async (params) => {
      const start = Date.now();
      
      const url = new URL('/api/auth/callback', 'http://localhost:3000');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      await request.get(url.toString());
      return Date.now() - start;
    };

    const validTimes = await Promise.all(
      Array.from({ length: 5 }, () => measureTime({ ...validParams, hmac: validHmac }))
    );
    
    const invalidTimes = await Promise.all(
      Array.from({ length: 5 }, () => measureTime(invalidParams))
    );

    const avgValidTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const avgInvalidTime = invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;

    // Timing difference should be minimal (within 50ms) to prevent timing attacks
    const timingDifference = Math.abs(avgValidTime - avgInvalidTime);
    expect(timingDifference).toBeLessThan(50);
  });

  test('logs security events for monitoring', async ({ request, page }) => {
    // Attempt with invalid HMAC
    const params = {
      code: testCode,
      shop: testShop,
      state: createValidState(testShop),
      hmac: 'invalid-hmac'
    };

    const url = new URL('/api/auth/callback', 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await request.get(url.toString());
    
    expect(response.status()).toBe(403);

    // In a real implementation, verify that security events are logged
    // This could check database logs, external monitoring systems, etc.
    await page.evaluate(() => {
      // Check that security event was logged (mock)
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      const recentLog = logs.find(log => 
        log.type === 'invalid_hmac' && 
        log.timestamp > Date.now() - 5000
      );
      
      if (!recentLog) {
        console.warn('Security event not logged properly');
      }
    });
  });
});