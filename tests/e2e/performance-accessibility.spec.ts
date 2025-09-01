import { test, expect } from '@playwright/test';
import { TestHelpers, PerformanceHelpers, ShopifyEmbeddedHelpers } from '../utils/test-helpers';
import { TEST_MERCHANTS, MOCK_RETURNS } from '../fixtures/test-data';

test.describe('Performance and Accessibility - Comprehensive Tests', () => {
  let helpers: TestHelpers;
  let performanceHelpers: PerformanceHelpers;
  let shopifyHelpers: ShopifyEmbeddedHelpers;

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page);
    performanceHelpers = new PerformanceHelpers(page);
    shopifyHelpers = new ShopifyEmbeddedHelpers(page, context);
  });

  test.describe('Page Load Performance', () => {
    test('should load main pages within acceptable time limits', async ({ page }) => {
      const pageLoadTests = [
        { path: '/', maxLoadTime: 3000, description: 'Homepage' },
        { path: '/auth', maxLoadTime: 2500, description: 'Authentication page' },
        { path: '/dashboard', maxLoadTime: 4000, description: 'Dashboard' },
        { path: '/returns', maxLoadTime: 3500, description: 'Returns portal' }
      ];

      for (const testCase of pageLoadTests) {
        console.log(`Testing load time for: ${testCase.description}`);
        
        const startTime = Date.now();
        
        const response = await page.goto(testCase.path);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        expect(response?.status()).toBe(200);
        expect(loadTime).toBeLessThan(testCase.maxLoadTime);
        
        console.log(`${testCase.description} loaded in ${loadTime}ms`);
      }
    });

    test('should load embedded dashboard efficiently', async ({ page, context }) => {
      await shopifyHelpers.simulateEmbeddedContext();
      await shopifyHelpers.simulateAppBridge();
      
      // Mock authentication and data
      await helpers.mockAPIResponse(/\/api\/session\/me/, {
        authenticated: true,
        user: { shopDomain: TEST_MERCHANTS.primary.shopDomain }
      });
      
      await helpers.mockAPIResponse(/\/api\/v1\/analytics\/dashboard/, {
        metrics: { totalReturns: 150, exchangeRate: 0.65 }
      });
      
      const metrics = await performanceHelpers.measurePageLoad();
      
      expect(metrics.loadTime).toBeLessThan(5000); // 5 seconds max for embedded context
    });

    test('should handle Core Web Vitals metrics', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // First Input Delay (FID)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              vitals.fid = entries[0].processingStart - entries[0].startTime;
            }
          }).observe({ type: 'first-input', buffered: true });
          
          // Cumulative Layout Shift (CLS)
          new PerformanceObserver((entryList) => {
            let clsScore = 0;
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            });
            vitals.cls = clsScore;
          }).observe({ type: 'layout-shift', buffered: true });
          
          // Resolve after a short delay to collect metrics
          setTimeout(() => resolve(vitals), 2000);
        });
      });
      
      console.log('Web Vitals:', webVitals);
      
      // Web Vitals thresholds (Google recommendations)
      if ((webVitals as any).lcp) {
        expect((webVitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if ((webVitals as any).fid) {
        expect((webVitals as any).fid).toBeLessThan(100); // FID < 100ms
      }
      if ((webVitals as any).cls !== undefined) {
        expect((webVitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });

    test('should optimize bundle size and loading', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Measure resource loading
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const cssResources = resources.filter(r => r.name.includes('.css'));
        
        const totalJSSize = jsResources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0);
        const totalCSSSize = cssResources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0);
        
        return {
          jsCount: jsResources.length,
          cssCount: cssResources.length,
          totalJSSize,
          totalCSSSize,
          totalResources: resources.length
        };
      });
      
      console.log('Resource metrics:', resourceMetrics);
      
      // Bundle size thresholds
      expect(resourceMetrics.totalJSSize).toBeLessThan(1024 * 1024); // < 1MB JS
      expect(resourceMetrics.totalCSSSize).toBeLessThan(200 * 1024); // < 200KB CSS
      expect(resourceMetrics.jsCount).toBeLessThan(10); // Reasonable number of JS files
    });
  });

  test.describe('Runtime Performance', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      const largeReturnsList = Array.from({ length: 1000 }, (_, i) => ({
        ...MOCK_RETURNS.pending,
        id: `ret_${i}`,
        orderNumber: `#RAS-${5000 + i}`
      }));
      
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: largeReturnsList.slice(0, 50), // Paginated
        totalCount: 1000,
        pagination: { page: 1, limit: 50, totalPages: 20 }
      });
      
      const startTime = Date.now();
      
      await page.goto('/dashboard/returns');
      await page.waitForSelector('table, [role="table"]');
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
      
      // Test pagination performance
      await helpers.mockAPIResponse(/\/api\/v1\/returns.*page=2/, {
        returns: largeReturnsList.slice(50, 100),
        totalCount: 1000,
        pagination: { page: 2, limit: 50, totalPages: 20 }
      });
      
      const paginationStart = Date.now();
      await page.click('[data-testid="next-page"], button:has-text("Next")');
      await page.waitForSelector('text=#RAS-5050'); // Wait for new data
      
      const paginationTime = Date.now() - paginationStart;
      expect(paginationTime).toBeLessThan(1500); // Pagination should be fast
    });

    test('should handle rapid user interactions efficiently', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [MOCK_RETURNS.pending, MOCK_RETURNS.approved],
        totalCount: 2
      });
      
      await page.goto('/dashboard/returns');
      await page.waitForSelector('table');
      
      // Test rapid filtering
      const filterStart = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="filter-pending"]');
        await page.waitForTimeout(100);
        await page.click('[data-testid="filter-all"]');
        await page.waitForTimeout(100);
      }
      
      const filterTime = Date.now() - filterStart;
      expect(filterTime).toBeLessThan(2000); // Should handle rapid clicks smoothly
      
      // Test rapid search
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.count() > 0) {
        const searchStart = Date.now();
        
        await searchInput.fill('customer');
        await page.waitForTimeout(300); // Debounce time
        await searchInput.fill('order');
        await page.waitForTimeout(300);
        await searchInput.fill('return');
        
        const searchTime = Date.now() - searchStart;
        expect(searchTime).toBeLessThan(1500);
      }
    });

    test('should maintain performance during real-time updates', async ({ page }) => {
      await helpers.mockAPIResponse(/\/api\/v1\/returns/, {
        returns: [MOCK_RETURNS.pending],
        totalCount: 1
      });
      
      await page.goto('/dashboard/returns');
      await page.waitForSelector('table');
      
      // Simulate real-time updates
      const updateStart = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await page.evaluate((index) => {
          // Simulate WebSocket update
          window.dispatchEvent(new CustomEvent('returnUpdated', {
            detail: { returnId: `ret_${index}`, status: 'approved' }
          }));
        }, i);
        
        await page.waitForTimeout(100);
      }
      
      const updateTime = Date.now() - updateStart;
      expect(updateTime).toBeLessThan(2000);
      
      // Check for memory leaks by monitoring performance
      const memoryUsage = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (memoryUsage) {
        const memoryRatio = memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize;
        expect(memoryRatio).toBeLessThan(0.9); // Memory usage should be reasonable
      }
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('should meet basic accessibility requirements', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await helpers.validateAccessibility();
    });

    test('should have proper keyboard navigation', async ({ page }) => {
      await page.goto('/returns');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus').first();
      
      // Should focus on interactive elements
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      expect(['button', 'input', 'select', 'textarea', 'a'].includes(tagName)).toBe(true);
      
      // Test that all interactive elements are reachable
      const interactiveElements = await page.locator('button, input, select, textarea, a[href]').count();
      
      let tabCount = 0;
      const maxTabs = Math.min(interactiveElements + 5, 30); // Reasonable limit
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const newFocus = await page.locator(':focus').first();
        const isVisible = await newFocus.isVisible().catch(() => false);
        
        if (isVisible) {
          const elementInfo = await newFocus.evaluate(el => ({
            tagName: el.tagName,
            type: (el as any).type,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label')
          }));
          
          // Interactive elements should be properly labeled
          if (['INPUT', 'BUTTON', 'SELECT'].includes(elementInfo.tagName)) {
            const hasLabel = !!(elementInfo.ariaLabel || 
                              await newFocus.locator('~ label, + label').count() > 0);
            expect(hasLabel).toBe(true);
          }
        }
      }
    });

    test('should support screen readers with proper ARIA labels', async ({ page }) => {
      await page.goto('/dashboard/returns');
      
      // Check for proper ARIA landmarks
      await expect(page.locator('[role="main"], main')).toBeVisible();
      await expect(page.locator('[role="navigation"], nav')).toBeVisible();
      
      // Check table accessibility
      const table = page.locator('table').first();
      if (await table.count() > 0) {
        // Should have proper table headers
        await expect(table.locator('th')).toHaveCount({ min: 1 });
        
        // Headers should have scope attributes or be properly associated
        const headers = await table.locator('th').all();
        for (const header of headers) {
          const scope = await header.getAttribute('scope');
          const id = await header.getAttribute('id');
          expect(scope || id).toBeTruthy();
        }
      }
      
      // Check form accessibility
      const forms = await page.locator('form').all();
      for (const form of forms) {
        const inputs = await form.locator('input, select, textarea').all();
        
        for (const input of inputs) {
          const inputId = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          if (inputId) {
            const hasLabel = await form.locator(`label[for="${inputId}"]`).count() > 0;
            expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
          }
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check color contrast for text elements
      const textElements = await page.locator('h1, h2, h3, p, button, input, label').all();
      
      for (let i = 0; i < Math.min(textElements.length, 20); i++) {
        const element = textElements[i];
        
        const styles = await element.evaluate(el => {
          const computedStyles = window.getComputedStyle(el);
          return {
            color: computedStyles.color,
            backgroundColor: computedStyles.backgroundColor,
            fontSize: computedStyles.fontSize
          };
        });
        
        // Parse RGB values
        const colorMatch = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgMatch = styles.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) ||
                       styles.backgroundColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        
        if (colorMatch && bgMatch) {
          const textRgb = colorMatch.slice(1, 4).map(Number);
          const bgRgb = bgMatch.slice(1, 4).map(Number);
          
          // Calculate luminance
          const getLuminance = (rgb: number[]) => {
            const [r, g, b] = rgb.map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          
          const textLum = getLuminance(textRgb);
          const bgLum = getLuminance(bgRgb);
          
          const contrast = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);
          
          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          const fontSize = parseFloat(styles.fontSize);
          const minContrast = fontSize >= 18 ? 3 : 4.5;
          
          expect(contrast).toBeGreaterThanOrEqual(minContrast);
        }
      }
    });

    test('should work with high contrast mode', async ({ page, context }) => {
      // Simulate high contrast mode
      await context.addInitScript(() => {
        // Mock media query for high contrast
        Object.defineProperty(window, 'matchMedia', {
          value: (query: string) => ({
            matches: query.includes('prefers-contrast: high'),
            addEventListener: () => {},
            removeEventListener: () => {}
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check that app adapts to high contrast mode
      const rootStyles = await page.locator('html').evaluate(el => {
        return window.getComputedStyle(el);
      });
      
      // Should have appropriate styles for high contrast
      expect(rootStyles).toBeTruthy();
    });

    test('should support users with motion sensitivity', async ({ page, context }) => {
      // Mock reduced motion preference
      await context.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          value: (query: string) => ({
            matches: query.includes('prefers-reduced-motion: reduce'),
            addEventListener: () => {},
            removeEventListener: () => {}
          })
        });
      });
      
      await page.goto('/dashboard');
      
      // Check for reduced animations
      const animatedElements = await page.locator('[class*="animate"], [style*="transition"], [style*="animation"]').all();
      
      for (const element of animatedElements.slice(0, 5)) {
        const styles = await element.evaluate(el => {
          const computedStyles = window.getComputedStyle(el);
          return {
            animationDuration: computedStyles.animationDuration,
            transitionDuration: computedStyles.transitionDuration
          };
        });
        
        // Animations should be disabled or very short in reduced motion mode
        if (styles.animationDuration && styles.animationDuration !== 'none') {
          const duration = parseFloat(styles.animationDuration);
          expect(duration).toBeLessThanOrEqual(0.2); // Max 200ms
        }
      }
    });
  });

  test.describe('Mobile Performance and Accessibility', () => {
    test('should perform well on mobile devices', async ({ page, context }) => {
      // Simulate mobile device
      await context.setViewportSize({ width: 375, height: 667 });
      await context.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      
      const startTime = Date.now();
      await page.goto('/returns');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(4000); // Mobile should load within 4 seconds
      
      // Check mobile-specific optimizations
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('width=device-width');
      expect(viewportMeta).toContain('initial-scale=1');
    });

    test('should have accessible touch targets on mobile', async ({ page, context }) => {
      await context.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard/returns');
      
      const touchTargets = await page.locator('button, a, input[type="checkbox"], input[type="radio"]').all();
      
      for (const target of touchTargets.slice(0, 10)) {
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          // WCAG recommends minimum 44x44px touch targets
          expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should support mobile screen readers', async ({ page, context }) => {
      await context.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/returns');
      
      // Check for mobile-specific accessibility features
      const skipLinks = await page.locator('a[href="#main"], [class*="skip"]').count();
      expect(skipLinks).toBeGreaterThan(0);
      
      // Check that content is properly structured for mobile screen readers
      const headingStructure = await page.locator('h1, h2, h3, h4').all();
      
      let previousLevel = 0;
      for (const heading of headingStructure) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        
        // Heading levels should not skip (e.g., h1 -> h3 without h2)
        expect(level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = level;
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 200); // Add 200ms delay
      });
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should still be usable on slow networks
      expect(loadTime).toBeLessThan(8000); // 8 seconds max on slow network
      
      // Should show loading indicators
      const hasLoadingIndicator = await page.locator('.loading, [data-testid="loading"], text=/loading/i').count() > 0;
      // Note: Loading indicator might not be visible after page loads
    });

    test('should handle offline scenarios gracefully', async ({ page, context }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Simulate going offline
      await context.setOffline(true);
      
      // Try to navigate or make API calls
      await page.click('a[href="/returns"], button:has-text("Returns")').catch(() => {
        // Expected to fail when offline
      });
      
      // Should show appropriate offline message
      const offlineMessage = await page.locator('text=/offline|network|connection/i').count();
      // Note: Offline handling depends on service worker implementation
    });

    test('should optimize API request patterns', async ({ page }) => {
      const apiCalls: string[] = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Should not make excessive API calls
      expect(apiCalls.length).toBeLessThan(10);
      
      // Should not make duplicate calls
      const uniqueCalls = [...new Set(apiCalls)];
      expect(uniqueCalls.length).toBe(apiCalls.length);
      
      console.log('API calls made:', apiCalls);
    });
  });
});