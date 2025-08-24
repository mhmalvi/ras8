/**
 * OAuth Flow Test Script
 * Tests the complete Shopify OAuth integration flow
 */

const TEST_SHOP = 'test42434.myshopify.com';
const APP_URL = 'https://ca997aa8a2a1.ngrok-free.app';
const SUPABASE_URL = 'https://pvadajelvewdazwmvppk.supabase.co';

async function testOAuthFlow() {
  console.log('🧪 Testing Shopify OAuth Flow');
  console.log('============================');

  // Test 1: Environment Variables
  console.log('\n1. Testing Environment Variable Access...');
  try {
    const envResponse = await fetch(`${APP_URL}/environment-test`);
    if (envResponse.ok) {
      console.log('✅ Environment test page accessible');
    } else {
      console.log('❌ Environment test page failed:', envResponse.status);
    }
  } catch (error) {
    console.log('❌ Environment test failed:', error.message);
  }

  // Test 2: OAuth Start Function
  console.log('\n2. Testing OAuth Start Function...');
  try {
    const oauthStartUrl = `${SUPABASE_URL}/functions/v1/shopify-oauth-start?shop=${TEST_SHOP}`;
    const startResponse = await fetch(oauthStartUrl);
    
    if (startResponse.ok) {
      const text = await startResponse.text();
      if (text.includes('oauth/authorize')) {
        console.log('✅ OAuth start function working');
        console.log('   Generated OAuth redirect URL successfully');
      } else {
        console.log('❌ OAuth start function not generating correct redirect');
      }
    } else {
      console.log('❌ OAuth start function failed:', startResponse.status);
    }
  } catch (error) {
    console.log('❌ OAuth start test failed:', error.message);
  }

  // Test 3: Edge Function Environment Access
  console.log('\n3. Testing Edge Function Environment Variables...');
  try {
    // This would require a test function to be deployed
    console.log('ℹ️  Deploy test-env function to verify environment access');
    console.log('   Run: npx supabase functions deploy test-env');
    console.log('   Test: curl https://pvadajelvewdazwmvppk.supabase.co/functions/v1/test-env');
  } catch (error) {
    console.log('❌ Environment variable test failed:', error.message);
  }

  // Test 4: Analytics Table Access
  console.log('\n4. Testing Analytics Table RLS...');
  try {
    // This would require Supabase client setup
    console.log('ℹ️  Run the RLS fix SQL script in Supabase Dashboard');
    console.log('   Script: fix-analytics-rls.sql');
  } catch (error) {
    console.log('❌ Analytics table test failed:', error.message);
  }

  console.log('\n✅ OAuth Flow Testing Complete!');
  console.log('\nManual Tests Required:');
  console.log('1. Configure environment variables in Supabase Dashboard');
  console.log('2. Run RLS fix SQL script');
  console.log('3. Test OAuth flow with real Shopify store');
  console.log('4. Verify installation in Shopify Partner Platform');
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testOAuthFlow().catch(console.error);
} else {
  // Browser environment - expose function
  window.testOAuthFlow = testOAuthFlow;
}

module.exports = { testOAuthFlow };