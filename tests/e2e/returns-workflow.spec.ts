import { test, expect } from '@playwright/test';
import { TestHelpers, ShopifyEmbeddedHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, MOCK_ORDERS, MOCK_RETURNS, TEST_ANALYTICS } from '../fixtures/test-data';

test.describe('Returns Management Workflow - E2E Tests', () => {
  let helpers: TestHelpers;
  let shopifyHelpers: ShopifyEmbeddedHelpers;

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page);
    shopifyHelpers = new ShopifyEmbeddedHelpers(page, context);
    
    // Setup embedded context for returns management
    await shopifyHelpers.simulateEmbeddedContext();
    await shopifyHelpers.simulateAppBridge();
    
    // Mock authentication for returns workflow tests
    await helpers.mockAPIResponse(/\/api\/session\/me/, {
      authenticated: true,
      user: {
        id: 'merchant-123',
        shopDomain: TEST_MERCHANTS.primary.shopDomain,
        planType: 'growth'
      }
    });
  });

  test.describe('Customer Returns Portal', () => {
    test('should display returns portal for valid order', async ({ page }) => {
      const orderId = MOCK_ORDERS.standard.id;
      const customerEmail = MOCK_ORDERS.standard.customerEmail;
      
      // Mock order lookup API using Supabase function
      await helpers.mockAPIResponse(/\/functions\/v1\/optimized-shopify-order-lookup/, {
        success: true,
        order: MOCK_ORDERS.standard
      });
      
      // Navigate to returns portal (matches the actual route)
      const portalUrl = `/return-portal?order=${orderId}&email=${encodeURIComponent(customerEmail)}`;
      await page.goto(portalUrl);
      
      // Should display order details
      await expect(page.locator('h1')).toContainText(/Return.*Request|Start.*Return/i);
      await expect(page.locator('text=' + MOCK_ORDERS.standard.orderNumber)).toBeVisible();
      await expect(page.locator('text=' + customerEmail)).toBeVisible();
      
      // Should display line items
      for (const item of MOCK_ORDERS.standard.lineItems) {
        await expect(page.locator(`text=${item.title}`)).toBeVisible();
        await expect(page.locator(`text=$${item.price}`)).toBeVisible();
      }
      
      // Should have return reason options
      const reasonSelect = page.locator('select[name="reason"], [role="combobox"]').first();
      await expect(reasonSelect).toBeVisible();
      
      // Should have quantity selectors
      const quantityInputs = page.locator('input[type="number"], [data-testid="quantity-selector"]');
      expect(await quantityInputs.count()).toBeGreaterThan(0);
    });

    test('should handle invalid order lookup gracefully', async ({ page }) => {
      const invalidOrderId = 'invalid-order-123';
      const customerEmail = 'invalid@example.com';
      
      // Mock order not found response
      await helpers.mockAPIResponse(/\/api\/v1\/orders\/lookup/, {
        success: false,
        error: 'Order not found'
      }, 404);
      
      const portalUrl = `/returns?order=${invalidOrderId}&email=${encodeURIComponent(customerEmail)}`;
      await page.goto(portalUrl);
      
      // Should display error message
      await expect(page.locator('text=/Order.*not.*found|Invalid.*order/i')).toBeVisible();
      
      // Should provide option to retry or contact support
      const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Retry")');
      const supportLink = page.locator('a:has-text("Contact"), a:has-text("Support")');
      
      expect(await retryButton.count() + await supportLink.count()).toBeGreaterThan(0);
    });

    test('should submit return request with AI suggestions', async ({ page }) => {
      const orderId = MOCK_ORDERS.standard.id;
      const customerEmail = MOCK_ORDERS.standard.customerEmail;
      
      // Mock order lookup and AI suggestions
      await helpers.mockAPIResponse(/\/api\/v1\/orders\/lookup/, {
        success: true,
        order: MOCK_ORDERS.standard
      });
      
      await helpers.mockAPIResponse(/\/api\/v1\/ai\/suggestions/, {
        suggestions: [
          {
            type: 'exchange',
            confidence: 0.85,
            reason: 'Similar size available',
            alternativeProducts: ['WIDGET-002']
          },
          {
            type: 'refund',
            confidence: 0.65,
            reason: 'Product discontinued'
          }
        ]
      });
      
      // Mock return submission
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        success: true,
        returnId: 'ret_new_123',
        status: 'pending'
      }, 201);
      
      const portalUrl = `/returns?order=${orderId}&email=${encodeURIComponent(customerEmail)}`;
      await page.goto(portalUrl);
      
      // Wait for order to load
      await page.waitForSelector(`text=${MOCK_ORDERS.standard.orderNumber}`);
      
      // Select item for return
      const firstItem = page.locator('[data-testid="return-item"]').first();
      await firstItem.locator('input[type="checkbox"], [role="checkbox"]').check();
      
      // Select return reason
      const reasonSelect = page.locator('select[name="reason"]').first();
      await reasonSelect.selectOption('defective');
      
      // Set quantity
      const quantityInput = firstItem.locator('input[type="number"]').first();
      await quantityInput.fill('1');
      
      // Should display AI suggestions
      await expect(page.locator('text=/AI.*Suggests|Recommendation/i')).toBeVisible();
      await expect(page.locator('text=exchange')).toBeVisible();
      
      // Submit return request
      await Promise.all([
        helpers.waitForAPICall('/api/v1/returns', 'POST'),
        page.click('button:has-text("Submit Return"), button:has-text("Create Return")')
      ]);
      
      // Should show success confirmation
      await expect(page.locator('text=/Return.*submitted|Request.*received/i')).toBeVisible();
      await expect(page.locator('text=ret_new_123')).toBeVisible();
    });

    test('should handle return submission errors', async ({ page }) => {
      const orderId = MOCK_ORDERS.standard.id;
      const customerEmail = MOCK_ORDERS.standard.customerEmail;
      
      await helpers.mockAPIResponse(/\/api\/v1\/orders\/lookup/, {
        success: true,
        order: MOCK_ORDERS.standard
      });
      
      // Mock return submission failure
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        success: false,
        error: 'Return window expired'
      }, 400);
      
      await page.goto(`/returns?order=${orderId}&email=${encodeURIComponent(customerEmail)}`);
      await page.waitForSelector(`text=${MOCK_ORDERS.standard.orderNumber}`);
      
      // Fill out return form
      await page.locator('[data-testid="return-item"] input[type="checkbox"]').first().check();
      await page.locator('select[name="reason"]').first().selectOption('defective');
      
      // Submit and expect error
      await page.click('button:has-text("Submit Return")');
      
      await expect(page.locator('text=/Return.*window.*expired|Error/i')).toBeVisible();
    });
  });

  test.describe('Merchant Dashboard - Returns Management', () => {
    test('should display returns dashboard with metrics', async ({ page }) => {
      // Mock returns data and analytics
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [MOCK_RETURNS.pending, MOCK_RETURNS.approved],
        totalCount: 150,
        pagination: { page: 1, limit: 20, totalPages: 8 }
      });
      
      await helpers.mockAPIResponse(/\/api\/v1\/analytics\/dashboard/, TEST_ANALYTICS);
      
      // Navigate to embedded dashboard
      await helpers.navigateToEmbeddedApp();
      await page.waitForURL(/.*\/dashboard.*/);
      
      // Should display key metrics
      await expect(page.locator('text=150')).toBeVisible(); // Total returns
      await expect(page.locator('text=65%')).toBeVisible(); // Exchange rate
      await expect(page.locator('text=4.2')).toBeVisible(); // Customer satisfaction
      
      // Should display returns table
      await expect(page.locator('table, [role="table"]')).toBeVisible();
      await expect(page.locator('text=' + MOCK_RETURNS.pending.orderNumber)).toBeVisible();
      await expect(page.locator('text=' + MOCK_RETURNS.approved.orderNumber)).toBeVisible();
      
      // Should have status filters
      await expect(page.locator('button:has-text("Pending"), [data-testid="status-filter"]')).toBeVisible();
    });

    test('should process return approval workflow', async ({ page }) => {
      const returnToProcess = { ...MOCK_RETURNS.pending, id: 'ret_to_process' };
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [returnToProcess],
        totalCount: 1
      });
      
      await helpers.mockAPIResponse(new RegExp(`/api/v1/returns/${returnToProcess.id}`), returnToProcess);
      
      // Mock approval API
      await helpers.mockAPIResponse(new RegExp(`/api/v1/returns/${returnToProcess.id}/approve`), {
        success: true,
        status: 'approved'
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/returns');
      
      // Click on return to view details
      await page.click(`text=${returnToProcess.orderNumber}`);
      
      // Should display return details
      await expect(page.locator('h1, h2')).toContainText(returnToProcess.orderNumber);
      await expect(page.locator(`text=${returnToProcess.customerEmail}`)).toBeVisible();
      await expect(page.locator(`text=${returnToProcess.reason}`)).toBeVisible();
      
      // Should display AI suggestion
      if (returnToProcess.returnItems[0].aiSuggestion) {
        await expect(page.locator(`text=${returnToProcess.returnItems[0].aiSuggestion}`)).toBeVisible();
      }
      
      // Process approval
      await Promise.all([
        helpers.waitForAPICall(`/api/v1/returns/${returnToProcess.id}/approve`, 'POST'),
        page.click('button:has-text("Approve"), button:has-text("Accept")')
      ]);
      
      // Should show success message
      await expect(page.locator('text=/approved|accepted/i')).toBeVisible();
    });

    test('should handle bulk return operations', async ({ page }) => {
      const returns = [
        { ...MOCK_RETURNS.pending, id: 'ret_bulk_1' },
        { ...MOCK_RETURNS.pending, id: 'ret_bulk_2' },
        { ...MOCK_RETURNS.pending, id: 'ret_bulk_3' }
      ];
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns,
        totalCount: 3
      });
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns\/bulk\/approve/, {
        success: true,
        processedCount: 2
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/returns');
      
      // Select multiple returns
      await page.check('[data-testid="select-all-returns"]');
      
      // Should show bulk action buttons
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeVisible();
      
      // Perform bulk approval
      await Promise.all([
        helpers.waitForAPICall('/api/v1/returns/bulk/approve', 'POST'),
        page.click('button:has-text("Bulk Approve")')
      ]);
      
      await expect(page.locator('text=/2.*approved|processed/i')).toBeVisible();
    });

    test('should filter and search returns effectively', async ({ page }) => {
      const allReturns = [MOCK_RETURNS.pending, MOCK_RETURNS.approved];
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns.*status=pending/, {
        returns: [MOCK_RETURNS.pending],
        totalCount: 1
      });
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns.*search=/, {
        returns: allReturns.filter(r => r.customerEmail.includes('customer@')),
        totalCount: 1
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/returns');
      
      // Test status filter
      await page.click('button:has-text("Pending"), [data-testid="filter-pending"]');
      await helpers.waitForAPICall('/api/v1/returns', 'GET');
      
      // Should only show pending returns
      await expect(page.locator('text=' + MOCK_RETURNS.pending.orderNumber)).toBeVisible();
      
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search"], [data-testid="search-input"]');
      await searchInput.fill('customer@');
      
      await Promise.all([
        helpers.waitForAPICall('/api/v1/returns', 'GET'),
        page.keyboard.press('Enter')
      ]);
      
      // Should show filtered results
      await expect(page.locator('text=customer@example.com')).toBeVisible();
    });
  });

  test.describe('Exchange Processing', () => {
    test('should handle exchange workflow', async ({ page }) => {
      const exchangeReturn = {
        ...MOCK_RETURNS.approved,
        id: 'ret_exchange_001',
        returnItems: [{
          ...MOCK_RETURNS.approved.returnItems[0],
          aiSuggestion: 'exchange',
          recommendedProducts: ['WIDGET-002', 'WIDGET-003']
        }]
      };
      
      await helpers.mockAPIResponse(new RegExp(`/api/v1/returns/${exchangeReturn.id}`), exchangeReturn);
      
      await helpers.mockAPIResponse(/\/api\/v1\/products\/recommendations/, {
        products: [
          { id: 'WIDGET-002', title: 'Premium Widget v2', price: '99.99', available: true },
          { id: 'WIDGET-003', title: 'Premium Widget v3', price: '109.99', available: true }
        ]
      });
      
      await helpers.mockAPIResponse(new RegExp(`/api/v1/returns/${exchangeReturn.id}/exchange`), {
        success: true,
        exchangeOrderId: 'exchange_order_123'
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto(`/dashboard/returns/${exchangeReturn.id}`);
      
      // Should display exchange options
      await expect(page.locator('text=/Exchange|Swap/i')).toBeVisible();
      await expect(page.locator('text=Premium Widget v2')).toBeVisible();
      
      // Select exchange product
      await page.click('[data-testid="product-WIDGET-002"] button:has-text("Select")');
      
      // Process exchange
      await Promise.all([
        helpers.waitForAPICall(`/api/v1/returns/${exchangeReturn.id}/exchange`, 'POST'),
        page.click('button:has-text("Process Exchange")')
      ]);
      
      // Should show exchange confirmation
      await expect(page.locator('text=exchange_order_123')).toBeVisible();
      await expect(page.locator('text=/Exchange.*processed|completed/i')).toBeVisible();
    });

    test('should handle out-of-stock exchange scenarios', async ({ page }) => {
      const exchangeReturn = {
        ...MOCK_RETURNS.approved,
        id: 'ret_oos_exchange',
        returnItems: [{
          ...MOCK_RETURNS.approved.returnItems[0],
          aiSuggestion: 'exchange'
        }]
      };
      
      await helpers.mockAPIResponse(new RegExp(`/api/v1/returns/${exchangeReturn.id}`), exchangeReturn);
      
      await helpers.mockAPIResponse(/\/api\/v1\/products\/recommendations/, {
        products: [
          { id: 'WIDGET-002', title: 'Premium Widget v2', price: '99.99', available: false },
          { id: 'WIDGET-003', title: 'Premium Widget v3', price: '109.99', available: true }
        ]
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto(`/dashboard/returns/${exchangeReturn.id}`);
      
      // Should show out-of-stock items differently
      await expect(page.locator('[data-testid="product-WIDGET-002"] text=/Out.*Stock|Unavailable/i')).toBeVisible();
      await expect(page.locator('[data-testid="product-WIDGET-002"] button:disabled')).toBeVisible();
      
      // Should still show available alternatives
      await expect(page.locator('[data-testid="product-WIDGET-003"] button:not(:disabled)')).toBeVisible();
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should display returns analytics dashboard', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/analytics\/returns/, {
        timeSeriesData: [
          { date: '2024-01-01', returns: 10, refunds: 5, exchanges: 5 },
          { date: '2024-01-02', returns: 15, refunds: 7, exchanges: 8 }
        ],
        reasonBreakdown: {
          defective: 45,
          wrong_size: 30,
          not_as_described: 20,
          other: 5
        },
        topProducts: [
          { title: 'Premium Widget', returnCount: 25 },
          { title: 'Deluxe Gadget', returnCount: 18 }
        ]
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/analytics');
      
      // Should display charts and metrics
      await expect(page.locator('canvas, [data-testid="chart"]')).toBeVisible();
      
      // Should show reason breakdown
      await expect(page.locator('text=defective')).toBeVisible();
      await expect(page.locator('text=45')).toBeVisible();
      
      // Should show top returned products
      await expect(page.locator('text=Premium Widget')).toBeVisible();
      await expect(page.locator('text=25')).toBeVisible();
    });

    test('should export returns data', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns\/export/, {
        downloadUrl: '/api/v1/exports/returns_2024_01_01.csv',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/returns');
      
      // Trigger export
      await page.click('button:has-text("Export"), [data-testid="export-button"]');
      
      // Should show export options
      await expect(page.locator('text=/CSV|Excel|Export/i')).toBeVisible();
      
      await Promise.all([
        helpers.waitForAPICall('/api/v1/returns/export', 'POST'),
        page.click('button:has-text("CSV")')
      ]);
      
      // Should show download link or success message
      await expect(page.locator('text=/Download|Export.*ready/i')).toBeVisible();
    });
  });

  test.describe('Integration Testing', () => {
    test('should handle webhook-triggered return updates', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [MOCK_RETURNS.pending],
        totalCount: 1
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/returns');
      
      // Simulate webhook update by mocking real-time update
      await page.evaluate(() => {
        // Simulate real-time update (e.g., via WebSocket or polling)
        window.dispatchEvent(new CustomEvent('returnUpdated', {
          detail: { returnId: 'ret_001', status: 'approved' }
        }));
      });
      
      // Should update UI without full page reload
      await expect(page.locator('text=approved')).toBeVisible();
    });

    test('should sync with Shopify orders correctly', async ({ page }) => {
      // Mock Shopify order sync
      await helpers.mockAPIResponse(/\/api\/v1\/sync\/shopify/, {
        success: true,
        ordersProcessed: 50,
        newReturns: 3
      });
      
      await helpers.navigateToEmbeddedApp();
      await page.goto('/dashboard/settings');
      
      // Trigger sync
      await Promise.all([
        helpers.waitForAPICall('/api/v1/sync/shopify', 'POST'),
        page.click('button:has-text("Sync Orders")')
      ]);
      
      // Should show sync results
      await expect(page.locator('text=/50.*orders|orders.*processed/i')).toBeVisible();
      await expect(page.locator('text=/3.*new.*returns/i')).toBeVisible();
    });
  });
});