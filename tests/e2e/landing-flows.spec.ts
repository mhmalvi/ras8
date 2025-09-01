/**
 * End-to-End Landing Flow Tests
 * 
 * Tests complete user flows from login through landing decisions
 * as specified in the audit report.
 */

import { test, expect } from '@playwright/test';

// Test data seeding utilities
async function seedDatabase(page: any, data: any) {
  // In a real implementation, this would use a seeding API or direct DB connection
  await page.evaluate((seedData) => {
    // Mock seeding via localStorage for testing
    localStorage.setItem('test_seed_data', JSON.stringify(seedData));
  }, data);
}

async function loginAs(page: any, userId: string, email: string = 'test@example.com') {
  await page.goto('/auth');
  
  // Mock login (replace with actual auth flow)
  await page.evaluate((loginData) => {
    localStorage.setItem('sb-auth-token', JSON.stringify({
      user: { id: loginData.userId, email: loginData.email },
      access_token: 'mock-token'
    }));
  }, { userId, email });
  
  await page.reload();
}

test.describe('Landing Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous test data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('New user standalone flow', async ({ page }) => {
    // Seed: No profile.merchant_id
    await seedDatabase(page, {
      users: [{ id: 'user1', email: 'newuser@example.com' }],
      profiles: [{ 
        id: 'user1', 
        merchant_id: null, 
        email: 'newuser@example.com',
        role: 'admin'
      }]
    });

    await loginAs(page, 'user1', 'newuser@example.com');
    
    // Should redirect to connect-shopify page
    await expect(page).toHaveURL('/connect-shopify');
    
    // Check page content
    await expect(page.locator('h2')).toContainText('Connect Your Store');
    await expect(page.locator('[data-testid="connect-form"]')).toBeVisible();
    
    // Test connection flow
    await page.fill('input[placeholder*="myshopify.com"]', 'test-store');
    await page.click('button:has-text("Connect Store")');
    
    // Should redirect to Shopify OAuth (or mock it)
    await page.waitForURL(/shopify\.com|oauth/);
  });

  test('Returning integrated user → dashboard', async ({ page }) => {
    // Seed: Active merchant with valid token
    await seedDatabase(page, {
      merchants: [{
        id: 'merchant1',
        shop_domain: 'test-store.myshopify.com',
        status: 'active',
        installed_at: new Date().toISOString()
      }],
      profiles: [{
        id: 'user1', 
        merchant_id: 'merchant1',
        email: 'returning@example.com',
        role: 'admin'
      }],
      shopify_tokens: [{
        id: 'token1',
        merchant_id: 'merchant1',
        access_token: 'encrypted_token_data',
        is_valid: true,
        last_verified_at: new Date().toISOString()
      }]
    });

    await loginAs(page, 'user1', 'returning@example.com');
    
    // Should redirect directly to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check dashboard content loads
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    await expect(page.locator('text=Returns Automation')).toBeVisible();
    
    // Should not see any OAuth or connection prompts
    await expect(page.locator('text=Connect')).not.toBeVisible();
    await expect(page.locator('text=Reconnect')).not.toBeVisible();
  });

  test('Master admin user → admin dashboard', async ({ page }) => {
    await seedDatabase(page, {
      profiles: [{
        id: 'admin1',
        merchant_id: null,
        email: 'admin@example.com',
        role: 'master_admin'
      }]
    });

    await loginAs(page, 'admin1', 'admin@example.com');
    
    // Should redirect to master admin dashboard
    await expect(page).toHaveURL('/master-admin');
    
    // Check admin content
    await expect(page.locator('text=Master Admin')).toBeVisible();
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('Uninstalled app → reconnect flow', async ({ page }) => {
    await seedDatabase(page, {
      merchants: [{ 
        id: 'merchant1',
        shop_domain: 'test-store.myshopify.com', 
        status: 'uninstalled',
        uninstalled_at: new Date().toISOString()
      }],
      profiles: [{ 
        id: 'user1',
        merchant_id: 'merchant1',
        email: 'uninstalled@example.com',
        role: 'admin'
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        access_token: 'old_token',
        is_valid: false,
        last_verified_at: new Date(Date.now() - 48*60*60*1000).toISOString() // 2 days ago
      }]
    });

    await loginAs(page, 'user1', 'uninstalled@example.com');
    
    // Should redirect to reconnect page
    await expect(page).toHaveURL('/reconnect');
    
    // Check reconnect content
    await expect(page.locator('h2')).toContainText('Reconnect Your Store');
    await expect(page.locator('button:has-text("Reconnect")')).toBeVisible();
    
    // Test reconnect button
    await page.click('button:has-text("Reconnect Store")');
    
    // Should trigger OAuth flow
    await page.waitForURL(/oauth|shopify/);
  });

  test('Embedded app flow parity', async ({ page, context }) => {
    // Simulate Shopify Admin iframe context
    await context.addInitScript(() => {
      // Mock embedded context
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29t'
        }
      });
      
      // Mock App Bridge
      (window as any).ShopifyAppBridge = {
        createApp: () => ({
          getState: () => ({ pos: { history: [] } }),
          subscribe: () => {}
        })
      };
    });

    // Seed same merchant as standalone test
    await seedDatabase(page, {
      merchants: [{ 
        id: 'merchant1', 
        shop_domain: 'test-store.myshopify.com',
        status: 'active'
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        access_token: 'valid_token',
        is_valid: true,
        last_verified_at: new Date().toISOString()
      }]
    });

    await page.goto('/?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29t');
    
    // Should land in embedded dashboard (same merchant record)
    await expect(page).toHaveURL('/dashboard?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29t');
    
    // Check embedded context indicators
    await expect(page.locator('[data-embedded="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Should show same data as standalone (merchant record shared)
    await expect(page.locator('text=test-store.myshopify.com')).toBeVisible();
  });

  test('Invalid token → reconnect with shop detection', async ({ page }) => {
    await seedDatabase(page, {
      merchants: [{ 
        id: 'merchant1',
        shop_domain: 'expired-store.myshopify.com',
        status: 'active'
      }],
      profiles: [{ 
        id: 'user1',
        merchant_id: 'merchant1',
        email: 'expired@example.com',
        role: 'admin'
      }],
      shopify_tokens: [{
        merchant_id: 'merchant1',
        access_token: 'expired_token',
        is_valid: false,
        last_verified_at: new Date(Date.now() - 48*60*60*1000).toISOString()
      }]
    });

    // Store shop domain for reconnect detection
    await page.evaluate(() => {
      localStorage.setItem('last_shop_domain', 'expired-store.myshopify.com');
    });

    await loginAs(page, 'user1', 'expired@example.com');
    
    await expect(page).toHaveURL('/reconnect');
    
    // Should show shop-specific messaging
    await expect(page.locator('text=expired-store.myshopify.com')).toBeVisible();
    
    // Reconnect should use detected shop
    await page.click('button:has-text("Reconnect Store")');
    await expect(page.url()).toContain('expired-store.myshopify.com');
  });

  test('Authentication required → auth page', async ({ page }) => {
    // No authentication data
    await page.goto('/dashboard');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Deep link preservation through auth', async ({ page }) => {
    // Try to access protected deep link
    await page.goto('/returns?filter=pending');
    
    // Should redirect to auth but preserve intended destination
    await expect(page).toHaveURL('/auth');
    
    // Complete login
    await seedDatabase(page, {
      merchants: [{ id: 'merchant1', status: 'active', shop_domain: 'test.myshopify.com' }],
      profiles: [{ id: 'user1', merchant_id: 'merchant1', email: 'test@example.com', role: 'admin' }],
      shopify_tokens: [{ merchant_id: 'merchant1', is_valid: true, last_verified_at: new Date().toISOString() }]
    });
    
    await loginAs(page, 'user1');
    
    // Should redirect to original destination
    await expect(page).toHaveURL('/returns?filter=pending');
  });

  test('Loading states during resolution', async ({ page }) => {
    // Simulate slow network for loading state testing
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    await seedDatabase(page, {
      merchants: [{ id: 'merchant1', status: 'active', shop_domain: 'test.myshopify.com' }],
      profiles: [{ id: 'user1', merchant_id: 'merchant1', email: 'test@example.com', role: 'admin' }],
      shopify_tokens: [{ merchant_id: 'merchant1', is_valid: true, last_verified_at: new Date().toISOString() }]
    });

    await loginAs(page, 'user1');
    await page.goto('/dashboard');
    
    // Should show loading state during landing resolution
    await expect(page.locator('text=Checking authentication')).toBeVisible();
    
    // Should eventually resolve to dashboard
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('Error handling for malformed data', async ({ page }) => {
    // Seed malformed data
    await seedDatabase(page, {
      profiles: [{ 
        id: 'user1',
        merchant_id: 'nonexistent-merchant',
        email: 'broken@example.com',
        role: 'admin'
      }]
      // No corresponding merchant record
    });

    await loginAs(page, 'user1', 'broken@example.com');
    
    // Should handle gracefully and show appropriate error or fallback
    await expect(page).toHaveURL(/error|connect-shopify/);
    
    if (await page.locator('text=error').isVisible()) {
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    }
  });
});