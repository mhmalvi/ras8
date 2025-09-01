import { chromium } from 'playwright';

async function traceRedirectFlow() {
  console.log('🔄 Tracing login redirect flow...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Track URL changes
  let urlHistory = [];
  page.on('framenavigated', (frame) => {
    if (frame.url() !== 'about:blank') {
      urlHistory.push({
        url: frame.url(),
        timestamp: new Date().toISOString()
      });
      console.log(`📍 Navigation: ${frame.url()}`);
    }
  });
  
  // Listen to console messages for auth logic
  page.on('console', msg => {
    if (msg.text().includes('🔄') || msg.text().includes('redirect') || msg.text().includes('authenticate')) {
      console.log(`BROWSER: ${msg.text()}`);
    }
  });
  
  try {
    console.log('1️⃣ Navigate to auth page');
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');
    
    console.log('2️⃣ Fill login form');
    await page.fill('input[type="email"]', 'yuanhuafung2021@gmail.com');
    await page.fill('input[type="password"]', '90989098');
    
    console.log('3️⃣ Submit and trace redirects');
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait a bit more to see if there are additional redirects
    await page.waitForTimeout(3000);
    
    console.log('📋 Final URL:', page.url());
    console.log('📋 URL History:');
    urlHistory.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.url} (${entry.timestamp})`);
    });
    
    // Check what page we ended up on
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
    } else if (currentUrl.includes('/auth')) {
      console.log('❌ Still on auth page - login may have failed');
    } else if (currentUrl === 'http://localhost:8082/') {
      console.log('⚠️ Redirected to index page - may trigger Shopify detection');
    } else {
      console.log('ℹ️ Redirected to:', currentUrl);
    }
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

traceRedirectFlow().catch(console.error);