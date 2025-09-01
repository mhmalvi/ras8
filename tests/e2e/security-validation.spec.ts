import { test, expect } from '@playwright/test';
import { TestHelpers, ShopifyEmbeddedHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, WEBHOOK_SIGNATURES } from '../fixtures/test-data';

test.describe('Security Validation - Comprehensive Tests', () => {
  let helpers: TestHelpers;
  let shopifyHelpers: ShopifyEmbeddedHelpers;

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page);
    shopifyHelpers = new ShopifyEmbeddedHelpers(page, context);
  });

  test.describe('Content Security Policy (CSP)', () => {
    test('should enforce proper CSP headers for embedded context', async ({ page }) => {
      const response = await page.goto('/');
      
      await helpers.validateSecurityHeaders(response);
      
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toBeTruthy();
      
      // Critical CSP directives for Shopify embedded apps
      expect(cspHeader).toContain('frame-ancestors');
      expect(cspHeader).toContain('admin.shopify.com');
      expect(cspHeader).toContain('*.myshopify.com');
      
      // Security best practices
      expect(cspHeader).toContain("default-src 'self'");
      
      // Should not use unsafe-inline without nonce/hash
      if (cspHeader.includes('script-src')) {
        const scriptSrcMatch = cspHeader.match(/script-src[^;]*/);
        if (scriptSrcMatch && scriptSrcMatch[0].includes("'unsafe-inline'")) {
          // If using unsafe-inline, should have nonce or hash
          expect(scriptSrcMatch[0]).toMatch(/'nonce-[^']*'|'sha\d+-[^']*'/);
        }
      }
    });

    test('should block XSS attempts via CSP', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '"><script>alert("xss")</script>',
        "';alert('xss');//",
        '<img src=x onerror=alert("xss")>'
      ];
      
      for (const payload of xssPayloads) {
        console.log('Testing XSS payload:', payload.substring(0, 30));
        
        // Try to inject XSS via URL parameters
        await page.goto(`/returns?search=${encodeURIComponent(payload)}`);
        
        // Check if XSS payload appears in DOM (should be sanitized)
        const pageContent = await page.content();
        expect(pageContent).not.toContain(payload);
        expect(pageContent).not.toContain('alert("xss")');
        
        // Monitor console for CSP violations
        let cspViolation = false;
        page.on('console', msg => {
          if (msg.text().includes('Content Security Policy') || msg.text().includes('unsafe-inline')) {
            cspViolation = true;
          }
        });
        
        await page.waitForTimeout(1000);
        
        // CSP should block dangerous inline scripts
        if (payload.includes('<script>')) {
          expect(cspViolation).toBe(true);
        }
      }
    });

    test('should validate frame-ancestors for iframe embedding', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      
      const response = await page.goto('/dashboard');
      const cspHeader = response?.headers()['content-security-policy'];
      
      expect(cspHeader).toContain('frame-ancestors');
      
      // Should allow Shopify domains
      expect(cspHeader).toMatch(/frame-ancestors[^;]*admin\.shopify\.com/);
      expect(cspHeader).toMatch(/frame-ancestors[^;]*\*\.myshopify\.com/);
      
      // Should not allow all origins
      expect(cspHeader).not.toContain("frame-ancestors *");
      expect(cspHeader).not.toContain("frame-ancestors 'none'");
    });
  });

  test.describe('Webhook Security', () => {
    test('should validate HMAC signatures for Shopify webhooks', async ({ page }) => {
      const webhookPayload = {
        id: 123456789,
        email: 'customer@example.com',
        total_price: '99.99',
        line_items: []
      };
      
      // Test with valid HMAC signature
      const validResponse = await helpers.simulateWebhook(
        '/functions/v1/enhanced-shopify-webhook',
        webhookPayload,
        WEBHOOK_SIGNATURES.valid
      );
      
      // Should accept valid signature (200 or 201)
      expect([200, 201, 202].includes(validResponse.status())).toBe(true);
      
      // Test with invalid HMAC signature
      const invalidResponse = await helpers.simulateWebhook(
        '/functions/v1/enhanced-shopify-webhook',
        webhookPayload,
        WEBHOOK_SIGNATURES.invalid
      );
      
      // Should reject invalid signature
      expect(invalidResponse.status()).toBe(401);
    });

    test('should reject webhooks without HMAC signature', async ({ page }) => {
      const webhookPayload = {
        id: 123456789,
        email: 'customer@example.com'
      };
      
      // Test without HMAC header
      const response = await page.request.post('/functions/v1/enhanced-shopify-webhook', {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Topic': 'orders/updated',
          'X-Shopify-Shop-Domain': TEST_MERCHANTS.primary.shopDomain
          // Missing X-Shopify-Hmac-Sha256 header
        },
        data: webhookPayload
      });
      
      expect(response.status()).toBe(401);
      
      const errorData = await response.json();
      expect(errorData.error).toContain('HMAC');
    });

    test('should prevent webhook replay attacks', async ({ page }) => {
      const webhookPayload = {
        id: 123456789,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
      
      // Send same webhook multiple times
      const responses = await Promise.all([
        helpers.simulateWebhook('/functions/v1/enhanced-shopify-webhook', webhookPayload, WEBHOOK_SIGNATURES.valid),
        helpers.simulateWebhook('/functions/v1/enhanced-shopify-webhook', webhookPayload, WEBHOOK_SIGNATURES.valid),
        helpers.simulateWebhook('/functions/v1/enhanced-shopify-webhook', webhookPayload, WEBHOOK_SIGNATURES.valid)
      ]);
      
      // First request might succeed, but subsequent should be rejected or idempotent
      const successCount = responses.filter(r => [200, 201, 202].includes(r.status())).length;
      const duplicateRejectionCount = responses.filter(r => r.status() === 409).length;
      
      // Either all succeed (idempotent) or duplicates are rejected
      expect(successCount === 3 || duplicateRejectionCount > 0).toBe(true);
    });

    test('should validate webhook timestamp freshness', async ({ page }) => {
      // Test with very old timestamp (should be rejected)
      const oldWebhookPayload = {
        id: 123456789,
        created_at: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
      };
      
      const oldResponse = await helpers.simulateWebhook(
        '/functions/v1/enhanced-shopify-webhook',
        oldWebhookPayload,
        WEBHOOK_SIGNATURES.valid
      );
      
      // Should reject old webhooks
      expect([400, 401, 408].includes(oldResponse.status())).toBe(true);
      
      // Test with fresh timestamp (should be accepted)
      const freshWebhookPayload = {
        id: 123456790,
        created_at: new Date().toISOString()
      };
      
      const freshResponse = await helpers.simulateWebhook(
        '/functions/v1/enhanced-shopify-webhook',
        freshWebhookPayload,
        WEBHOOK_SIGNATURES.valid
      );
      
      expect([200, 201, 202].includes(freshResponse.status())).toBe(true);
    });
  });

  test.describe('Input Validation and Sanitization', () => {
    test('should sanitize SQL injection attempts', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns.*/, {
        returns: [],
        totalCount: 0
      });
      
      const sqlInjectionPayloads = [
        "'; DROP TABLE merchants; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM merchants",
        "'; UPDATE merchants SET plan_type='pro'; --",
        "1'; EXEC xp_cmdshell('dir'); --"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        console.log('Testing SQL injection:', payload.substring(0, 20));
        
        // Test in search parameter
        const response = await page.request.get(`/api/v1/returns?search=${encodeURIComponent(payload)}`);
        
        // Should not cause server error
        expect([200, 400, 422].includes(response.status())).toBe(true);
        
        if (response.status() === 200) {
          const data = await response.json();
          
          // Response should not contain SQL keywords or error messages
          const responseText = JSON.stringify(data).toLowerCase();
          expect(responseText).not.toContain('drop table');
          expect(responseText).not.toContain('union select');
          expect(responseText).not.toContain('syntax error');
        }
      }
    });

    test('should validate and sanitize user inputs in forms', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      
      // Mock return creation API
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        success: true,
        returnId: 'ret_sanitized'
      }, 201);
      
      await page.goto('/returns/new');
      
      const maliciousInputs = {
        customerEmail: '<script>alert("xss")</script>@example.com',
        reason: '"><img src=x onerror=alert("xss")>',
        description: 'Normal text with <script>malicious()</script> content',
        orderNumber: '#12345\'; DROP TABLE orders; --'
      };
      
      // Fill form with malicious inputs
      for (const [field, value] of Object.entries(maliciousInputs)) {
        const input = page.locator(`[name="${field}"], [data-testid="${field}"]`).first();
        if (await input.count() > 0) {
          await input.fill(value);
        }
      }
      
      // Submit form
      await page.click('button:has-text("Submit"), button[type="submit"]');
      
      // Check that malicious content is not reflected in response
      await page.waitForTimeout(2000);
      const pageContent = await page.content();
      
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('alert("xss")');
      expect(pageContent).not.toContain('DROP TABLE');
    });

    test('should validate file upload security', async ({ page }) => {
      // Test malicious file upload attempts
      const maliciousFiles = [
        { name: 'script.js', content: 'alert("xss")' },
        { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' },
        { name: 'normal.txt', content: '<script>alert("xss")</script>' }
      ];
      
      for (const file of maliciousFiles) {
        console.log('Testing file upload:', file.name);
        
        // Create a test file
        const buffer = Buffer.from(file.content, 'utf-8');
        
        const response = await page.request.post('/api/v1/uploads', {
          multipart: {
            file: {
              name: file.name,
              mimeType: file.name.endsWith('.php') ? 'application/x-php' : 'text/plain',
              buffer
            }
          }
        });
        
        if (file.name.includes('..') || file.name.endsWith('.php') || file.name.endsWith('.js')) {
          // Should reject malicious files
          expect([400, 403, 415].includes(response.status())).toBe(true);
        } else {
          // Should sanitize content
          if (response.status() === 200) {
            const result = await response.json();
            expect(result.content || result.url).not.toContain('<script>');
          }
        }
      }
    });
  });

  test.describe('Authentication and Authorization Security', () => {
    test('should prevent session fixation attacks', async ({ page, context }) => {
      // Get initial session state
      await page.goto('/auth');
      const initialCookies = await context.cookies();
      
      // Simulate session fixation attempt
      await context.addCookies([{
        name: 'merchant_session',
        value: 'fixed_malicious_session_id',
        domain: 'localhost',
        path: '/',
        httpOnly: true
      }]);
      
      // Attempt authentication
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      
      // After authentication, session ID should be different
      const postAuthCookies = await context.cookies();
      const sessionCookie = postAuthCookies.find(c => c.name === 'merchant_session');
      
      if (sessionCookie) {
        expect(sessionCookie.value).not.toBe('fixed_malicious_session_id');
      }
    });

    test('should enforce secure cookie attributes', async ({ page, context }) => {
      await page.goto('/auth');
      
      // Simulate successful authentication
      await helpers.mockAPIResponse(/\/api\/auth\/login/, {
        success: true,
        sessionToken: 'mock_session_token'
      });
      
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      
      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true);
        expect(sessionCookie.secure).toBe(true); // In production with HTTPS
        expect(sessionCookie.sameSite).toBe('None'); // Required for Shopify embedding
      }
    });

    test('should prevent privilege escalation', async ({ page }) => {
      // Mock user with basic permissions
      await helpers.mockAPIResponse(/\/api\/session\/me/, {
        authenticated: true,
        user: {
          id: 'user-123',
          role: 'basic',
          permissions: ['read_returns']
        }
      });
      
      // Attempt to access admin-only endpoint
      const adminResponse = await page.request.get('/api/v1/admin/settings');
      expect([401, 403].includes(adminResponse.status())).toBe(true);
      
      // Attempt to modify permissions via API
      const escalationResponse = await page.request.post('/api/v1/users/123/permissions', {
        data: { permissions: ['admin', 'delete_all'] }
      });
      
      expect([401, 403].includes(escalationResponse.status())).toBe(true);
    });
  });

  test.describe('Data Privacy and Protection', () => {
    test('should not expose sensitive data in client responses', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [{
          id: 'ret_001',
          customerEmail: 'customer@example.com',
          // Should not include sensitive fields
          internalNotes: 'CONFIDENTIAL: Customer complained about quality',
          merchantApiKey: 'secret_key_12345'
        }]
      });
      
      await page.goto('/dashboard/returns');
      
      const pageContent = await page.content();
      const networkResponses = [];
      
      page.on('response', response => {
        networkResponses.push(response);
      });
      
      await page.waitForTimeout(2000);
      
      // Check page content
      expect(pageContent).not.toContain('CONFIDENTIAL');
      expect(pageContent).not.toContain('secret_key_');
      expect(pageContent).not.toContain('merchantApiKey');
      
      // Check network responses
      for (const response of networkResponses) {
        if (response.url().includes('/api/')) {
          const responseText = await response.text().catch(() => '');
          expect(responseText).not.toContain('secret_key_');
          expect(responseText).not.toContain('CONFIDENTIAL');
        }
      }
    });

    test('should handle PII data correctly', async ({ page }) => {
      const piiData = {
        email: 'customer@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State'
      };
      
      // Mock API that returns PII
      await helpers.mockAPIResponse(/\/api\/v1\/customers\/\w+/, piiData);
      
      await page.goto('/dashboard/customers/cust_123');
      
      // PII should be displayed for legitimate use
      await expect(page.locator(`text=${piiData.email}`)).toBeVisible();
      
      // But should not be logged to console
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        consoleLogs.push(msg.text());
      });
      
      await page.waitForTimeout(1000);
      
      const logsContainPII = consoleLogs.some(log => 
        log.includes(piiData.email) || 
        log.includes(piiData.phone) ||
        log.includes(piiData.address)
      );
      
      expect(logsContainPII).toBe(false);
    });

    test('should implement proper data masking', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [{
          id: 'ret_001',
          customerEmail: 'c****r@example.com', // Masked
          customerPhone: '***-***-7890', // Partially masked
          orderNumber: '#12345',
          amount: 99.99
        }]
      });
      
      await page.goto('/dashboard/returns');
      
      // Should display masked data
      await expect(page.locator('text=c****r@example.com')).toBeVisible();
      await expect(page.locator('text=***-***-7890')).toBeVisible();
      
      // Full data should not be visible
      expect(await page.locator('text=customer@example.com').count()).toBe(0);
    });
  });

  test.describe('Third-party Integration Security', () => {
    test('should validate external API connections', async ({ page }) => {
      // Mock external service responses
      await page.route('**/*external-api*/**', route => {
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-External-Service': 'MockService'
          },
          body: JSON.stringify({ success: true })
        });
      });
      
      // Test external API integration
      const response = await page.request.post('/api/v1/integrations/external-sync');
      
      // Should handle external service responses securely
      if (response.status() === 200) {
        const data = await response.json();
        
        // Should not echo back potentially malicious headers
        expect(data.headers).toBeUndefined();
        expect(data.rawResponse).toBeUndefined();
      }
    });

    test('should prevent SSRF attacks', async ({ page }) => {
      const ssrfPayloads = [
        'http://localhost:80',
        'http://127.0.0.1:22',
        'http://169.254.169.254/metadata', // AWS metadata
        'file:///etc/passwd',
        'gopher://localhost:11211/stats' // Memcached
      ];
      
      for (const payload of ssrfPayloads) {
        console.log('Testing SSRF payload:', payload);
        
        const response = await page.request.post('/api/v1/webhooks/test', {
          data: { url: payload }
        });
        
        // Should reject internal/malicious URLs
        expect([400, 403, 422].includes(response.status())).toBe(true);
        
        if (response.status() !== 403) {
          const errorData = await response.json();
          expect(errorData.error).toContain('Invalid URL');
        }
      }
    });

    test('should validate webhook URLs', async ({ page }) => {
      const validUrls = [
        'https://external-service.com/webhook',
        'https://api.legitimate-service.com/callback'
      ];
      
      const invalidUrls = [
        'http://localhost/webhook', // HTTP to localhost
        'javascript:alert("xss")', // JavaScript URL
        '../../etc/passwd', // Path traversal
        'ftp://internal-server/file' // Non-HTTP protocol
      ];
      
      // Test valid URLs
      for (const url of validUrls) {
        const response = await page.request.post('/api/v1/webhooks/register', {
          data: { webhookUrl: url }
        });
        
        expect([200, 201].includes(response.status())).toBe(true);
      }
      
      // Test invalid URLs
      for (const url of invalidUrls) {
        const response = await page.request.post('/api/v1/webhooks/register', {
          data: { webhookUrl: url }
        });
        
        expect([400, 422].includes(response.status())).toBe(true);
      }
    });
  });

  test.describe('Security Headers and Policies', () => {
    test('should enforce security headers on all pages', async ({ page }) => {
      const testPages = [
        '/',
        '/auth',
        '/dashboard',
        '/returns',
        '/api/session/me'
      ];
      
      for (const pagePath of testPages) {
        console.log('Testing security headers for:', pagePath);
        
        const response = await page.goto(pagePath);
        const headers = response?.headers() || {};
        
        // Content Security Policy
        expect(headers['content-security-policy']).toBeTruthy();
        
        // X-Content-Type-Options
        expect(headers['x-content-type-options']).toBe('nosniff');
        
        // X-Frame-Options (should be ALLOWALL for Shopify embedding)
        if (pagePath === '/dashboard' || pagePath === '/returns') {
          expect(headers['x-frame-options']).toBe('ALLOWALL');
        }
        
        // Referrer Policy
        expect(headers['referrer-policy']).toBeTruthy();
        
        // HSTS (in production with HTTPS)
        if (page.url().startsWith('https://')) {
          expect(headers['strict-transport-security']).toBeTruthy();
        }
      }
    });

    test('should prevent clickjacking attacks', async ({ page, context }) => {
      // Test that app cannot be embedded in malicious iframe
      await context.addInitScript(() => {
        // Simulate being embedded in malicious site
        Object.defineProperty(window, 'top', {
          value: {
            location: { hostname: 'malicious-site.com' }
          }
        });
      });
      
      const response = await page.goto('/dashboard');
      const headers = response?.headers();
      
      // Should have frame-ancestors CSP directive
      expect(headers?.['content-security-policy']).toContain('frame-ancestors');
      
      // Should only allow Shopify domains
      const csp = headers?.['content-security-policy'] || '';
      const frameAncestorsMatch = csp.match(/frame-ancestors[^;]*/);
      
      if (frameAncestorsMatch) {
        expect(frameAncestorsMatch[0]).toContain('shopify.com');
        expect(frameAncestorsMatch[0]).not.toContain('malicious-site.com');
      }
    });
  });
});