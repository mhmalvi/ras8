import { chromium } from 'playwright';

async function detailedLoginTest() {
  console.log('🚀 Starting detailed login test...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen to network failures
  page.on('requestfailed', request => {
    console.log(`NETWORK FAIL: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('📍 Navigate to login page');
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    
    console.log('📍 Check if page loaded correctly');
    const emailInput = await page.locator('#signin-email').count();
    const passwordInput = await page.locator('#signin-password').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`   Email input found: ${emailInput > 0}`);
    console.log(`   Password input found: ${passwordInput > 0}`);
    console.log(`   Submit button found: ${submitButton > 0}`);
    
    if (emailInput === 0 || passwordInput === 0 || submitButton === 0) {
      console.log('❌ Login form elements not found - page may not have loaded correctly');
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText.substring(0, 500));
      return;
    }
    
    console.log('📍 Fill credentials');
    await page.fill('#signin-email', 'yuanhuafung2021@gmail.com');
    await page.fill('#signin-password', '90989098');
    
    // Wait for any potential network activity after form filling
    await page.waitForTimeout(1000);
    
    console.log('📍 Submit form and monitor network');
    
    // Listen for the form submission response
    const responsePromise = page.waitForResponse(response => {
      console.log(`RESPONSE: ${response.status()} ${response.url()}`);
      return response.url().includes('/auth') || response.status() >= 400;
    }, { timeout: 10000 }).catch(() => null);
    
    await page.click('button[type="submit"]');
    
    // Wait for response or timeout
    const response = await responsePromise;
    if (response) {
      console.log(`Login response: ${response.status()} ${response.statusText()}`);
      if (response.status() >= 400) {
        try {
          const responseText = await response.text();
          console.log('Response body:', responseText.substring(0, 500));
        } catch (e) {
          console.log('Could not read response body');
        }
      }
    }
    
    // Wait for any UI changes
    await page.waitForTimeout(3000);
    
    console.log('📍 Check for error messages');
    
    // Check for various error indicators
    const alerts = await page.locator('[role="alert"], .alert, [data-testid*="error"], [class*="error"]').all();
    for (const alert of alerts) {
      try {
        const alertText = await alert.textContent();
        if (alertText.trim()) {
          console.log(`❌ Error message: ${alertText}`);
        }
      } catch (e) {
        console.log('Could not read alert text');
      }
    }
    
    // Check for toast notifications
    const toasts = await page.locator('[class*="toast"], [data-testid*="toast"], [role="status"]').all();
    for (const toast of toasts) {
      try {
        const toastText = await toast.textContent();
        if (toastText.trim()) {
          console.log(`📢 Toast message: ${toastText}`);
        }
      } catch (e) {
        console.log('Could not read toast text');
      }
    }
    
    // Check current URL and page state
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if still on auth page
    if (currentUrl.includes('/auth')) {
      console.log('❌ Still on auth page - login failed');
      
      // Look for specific error indicators in the form
      const formErrors = await page.locator('input:invalid, [aria-invalid="true"]').all();
      if (formErrors.length > 0) {
        console.log(`Found ${formErrors.length} invalid form fields`);
      }
      
      // Check if the form is still visible
      const formVisible = await page.locator('form').isVisible();
      console.log(`Login form still visible: ${formVisible}`);
      
    } else {
      console.log('✅ Redirected away from auth page - login may have succeeded');
      
      // Test navigation
      console.log('📍 Testing navigation...');
      try {
        await page.goto('http://localhost:8082/dashboard');
        await page.waitForLoadState('networkidle');
        const dashboardUrl = page.url();
        console.log(`Dashboard navigation: ${dashboardUrl}`);
        
        if (dashboardUrl.includes('/dashboard')) {
          console.log('✅ Dashboard accessible');
        } else if (dashboardUrl.includes('/auth')) {
          console.log('❌ Dashboard redirected back to auth');
        }
      } catch (navError) {
        console.log(`❌ Dashboard navigation error: ${navError.message}`);
      }
    }
    
    console.log('🎯 Test completed. Browser will stay open for 30 seconds for manual inspection.');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

detailedLoginTest().catch(console.error);