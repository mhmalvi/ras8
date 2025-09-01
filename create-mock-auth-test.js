import { chromium } from 'playwright';

async function testWithMockAuth() {
  console.log('🚀 Testing application with mock authentication...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('auth') || msg.text().includes('login')) {
      console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('📍 Step 1: Navigate to login page');
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Step 2: Inject mock authentication to bypass Supabase');
    
    // Inject mock authentication that bypasses the Supabase API call
    await page.evaluate(() => {
      // Mock the supabase auth response
      console.log('🔧 Injecting mock authentication...');
      
      // Store mock user data in localStorage to simulate successful auth
      const mockUser = {
        id: 'mock-user-id-123',
        email: 'yuanhuafung2021@gmail.com',
        user_metadata: {
          first_name: 'Yuanhua',
          last_name: 'Fung'
        },
        aud: 'authenticated',
        role: 'authenticated'
      };
      
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        user: mockUser
      };
      
      // Store in localStorage as if Supabase stored it
      localStorage.setItem('sb-pvadajelvewdazwmvppk-auth-token', JSON.stringify({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token,
        expires_at: Date.now() + (3600 * 1000),
        user: mockUser
      }));
      
      console.log('✅ Mock authentication data stored');
    });
    
    console.log('📍 Step 3: Navigate to dashboard to test authentication');
    await page.goto('http://localhost:8082/dashboard');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully accessed dashboard!');
      
      console.log('📍 Step 4: Test navigation between pages');
      const testPages = [
        { path: '/logs', name: 'Logs' },
        { path: '/master-admin', name: 'Master Admin' },
        { path: '/', name: 'Home' }
      ];
      
      for (const testPage of testPages) {
        try {
          console.log(`   Testing ${testPage.name}...`);
          await page.goto(`http://localhost:8082${testPage.path}`);
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          
          const pageUrl = page.url();
          if (pageUrl.includes(testPage.path) || (testPage.path === '/' && !pageUrl.includes('/auth'))) {
            console.log(`   ✅ ${testPage.name} accessible`);
          } else if (pageUrl.includes('/auth')) {
            console.log(`   ❌ ${testPage.name} redirected to auth`);
          } else {
            console.log(`   ℹ️  ${testPage.name} redirected to: ${pageUrl}`);
          }
          
          // Take a screenshot of each page
          await page.screenshot({ path: `${testPage.name.toLowerCase().replace(' ', '-')}-page.png` });
          
        } catch (err) {
          console.log(`   ❌ Error testing ${testPage.name}: ${err.message}`);
        }
      }
      
    } else if (currentUrl.includes('/auth')) {
      console.log('❌ Still redirected to auth - mock authentication may not have worked');
      
      console.log('📍 Step 5: Try direct approach - inject auth into current page');
      await page.evaluate(() => {
        // Try to trigger the auth context to recognize the user
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sb-pvadajelvewdazwmvppk-auth-token',
          newValue: localStorage.getItem('sb-pvadajelvewdazwmvppk-auth-token')
        }));
      });
      
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const reloadedUrl = page.url();
      console.log(`After reload: ${reloadedUrl}`);
      
    } else {
      console.log(`ℹ️  Unexpected redirect to: ${currentUrl}`);
    }
    
    console.log('📍 Step 6: Check authentication state in the app');
    const authState = await page.evaluate(() => {
      // Check if there are any auth-related variables in window
      const authInfo = {
        localStorage: {
          authToken: localStorage.getItem('sb-pvadajelvewdazwmvppk-auth-token') ? 'present' : 'missing'
        },
        cookies: document.cookie.includes('auth') ? 'auth cookies found' : 'no auth cookies',
        url: window.location.href
      };
      return authInfo;
    });
    
    console.log('Auth state:', authState);
    
    // Final screenshot
    await page.screenshot({ path: 'final-test-state.png' });
    
    console.log('🎯 Mock authentication test completed!');
    console.log('Screenshots saved: dashboard-page.png, logs-page.png, etc.');
    console.log('Browser will stay open for 30 seconds for inspection...');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'error-mock-auth.png' });
  } finally {
    await browser.close();
  }
}

testWithMockAuth().catch(console.error);