import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: process.env.VITE_APP_URL || 'http://localhost:8082',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Shopify specific headers for embedded context testing
    extraHTTPHeaders: {
      'User-Agent': 'PlaywrightTest/1.0',
    },
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Simulate Shopify Admin iframe context
        contextOptions: {
          userAgent: 'Mozilla/5.0 (compatible; ShopifyAdmin/1.0)',
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing (important for Shopify mobile admin)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Embedded context testing
    {
      name: 'embedded-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 },
        contextOptions: {
          // Simulate iframe environment
          bypassCSP: false,
          permissions: ['web-share'],
        }
      },
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_DEV_MODE: 'true',
    }
  },

  // Global setup for test data
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});