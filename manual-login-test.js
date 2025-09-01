import { chromium } from 'playwright';

async function testLogin() {
  console.log('🚀 Starting manual login test...');
  
  const browser = await chromium.launch({
    headless: false, // Show browser for manual verification
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigate to login page');
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Fill in credentials
    console.log('📍 Step 2: Fill in login credentials');
    console.log('   Email: yuanhuafung2021@gmail.com');
    console.log('   Password: 90989098');
    
    // Fill email
    await page.fill('#signin-email', 'yuanhuafung2021@gmail.com');
    
    // Fill password
    await page.fill('#signin-password', '90989098');
    
    // Step 3: Submit the form
    console.log('📍 Step 3: Submit login form');
    await page.click('button[type="submit"]');
    
    // Step 4: Wait for response and check for success/error
    console.log('📍 Step 4: Checking login result...');
    
    // Wait for either success redirect or error message
    try {
      // Wait for potential redirect or success message
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Check for error messages
      const errorAlert = await page.locator('[role="alert"]').count();
      if (errorAlert > 0) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log('❌ Error message found:', errorText);
      }
      
      // Check for success indicators
      const successToast = await page.locator('text=Welcome back').count();
      if (successToast > 0) {
        console.log('✅ Success toast found!');
      }
      
      // Check if redirected away from auth page
      if (!currentUrl.includes('/auth')) {
        console.log('✅ Successfully redirected away from auth page');
        console.log('📍 Step 5: Testing navigation...');
        
        // Test navigation to different pages
        const navigationTests = [
          { path: '/dashboard', name: 'Dashboard' },
          { path: '/logs', name: 'Logs' },
          { path: '/master-admin', name: 'Master Admin' }
        ];
        
        for (const test of navigationTests) {
          try {
            console.log(`   Testing navigation to ${test.name}...`);
            await page.goto(`http://localhost:8082${test.path}`);
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            
            const finalUrl = page.url();
            if (finalUrl.includes(test.path)) {
              console.log(`   ✅ ${test.name} navigation successful`);
            } else if (finalUrl.includes('/auth')) {
              console.log(`   ⚠️  ${test.name} redirected back to auth (may require additional permissions)`);
            } else {
              console.log(`   ℹ️  ${test.name} redirected to: ${finalUrl}`);
            }
          } catch (navError) {
            console.log(`   ❌ ${test.name} navigation error:`, navError.message);
          }
        }
      } else {
        console.log('❌ Still on auth page - login may have failed');
      }
      
    } catch (waitError) {
      console.log('⚠️  Timeout waiting for response:', waitError.message);
    }
    
    // Step 6: Check page content for additional context
    console.log('📍 Step 6: Checking page content...');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('sign in') || bodyText.includes('Sign In')) {
      console.log('Page still shows sign in form');
    }
    if (bodyText.includes('Dashboard') || bodyText.includes('Welcome')) {
      console.log('Page shows dashboard/welcome content');
    }
    
    console.log('🎯 Login test completed! Browser will stay open for manual verification.');
    console.log('   Press Ctrl+C when you\'re done inspecting the results.');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(60000); // Wait 60 seconds
    
  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testLogin().catch(console.error);