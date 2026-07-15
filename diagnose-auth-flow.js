/**
 * Authentication Flow Diagnostic Script
 *
 * Run this in the browser console after login to diagnose routing issues
 */

console.log('🔍 === AUTHENTICATION FLOW DIAGNOSTIC ===\n');

// 1. Check current URL and parameters
console.log('📍 Current Location:');
console.log('  Path:', window.location.pathname);
console.log('  Search:', window.location.search);
console.log('  Full URL:', window.location.href);
console.log('  Is in frame:', window.self !== window.top);
console.log('');

// 2. Check URL parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('🔗 URL Parameters:');
console.log('  shop:', urlParams.get('shop'));
console.log('  host:', urlParams.get('host'));
console.log('  embedded:', urlParams.get('embedded'));
console.log('');

// 3. Check localStorage
console.log('💾 LocalStorage:');
const storageKeys = [
  'last_landing_decision',
  'preserved_embedded_context',
  'pending_embedded_context',
  'redirect_history'
];

storageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      console.log(`  ${key}:`, JSON.parse(value));
    } catch (e) {
      console.log(`  ${key}:`, value);
    }
  } else {
    console.log(`  ${key}: null`);
  }
});
console.log('');

// 4. Check session storage
console.log('📦 SessionStorage:');
const sessionValue = sessionStorage.getItem('embedded_shop_context');
if (sessionValue) {
  try {
    console.log('  embedded_shop_context:', JSON.parse(sessionValue));
  } catch (e) {
    console.log('  embedded_shop_context:', sessionValue);
  }
} else {
  console.log('  embedded_shop_context: null');
}
console.log('');

// 5. Check Supabase auth state
console.log('🔐 Checking Supabase Auth...');
if (window.supabase) {
  window.supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.log('  ❌ Auth Error:', error.message);
    } else if (data.user) {
      console.log('  ✅ User authenticated:', data.user.email);
      console.log('  User ID:', data.user.id);
    } else {
      console.log('  ⚠️ No user found');
    }
  });
} else {
  console.log('  ⚠️ Supabase client not found in window');
}

// 6. Check React Router location
console.log('');
console.log('🗺️ Expected Redirect:');
console.log('  After login, should redirect to: /dashboard with shop parameters');
console.log('  Example: /dashboard?shop=SHOP_NAME.myshopify.com&host=HOST_PARAM&embedded=1');
console.log('');

// 7. Recommendations
console.log('💡 Diagnostic Recommendations:');
console.log('  1. If shop parameter is missing after login, check Auth.tsx redirect logic (lines 220-330)');
console.log('  2. If stuck on /auth page, check Auth.tsx useEffect redirect (lines 72-335)');
console.log('  3. If showing "Authentication Required", check Dashboard.tsx auth logic (lines 53-68)');
console.log('  4. If redirect_history shows high count, there might be an infinite loop');
console.log('');

console.log('🔍 === END DIAGNOSTIC ===');
console.log('Copy and share this output for debugging');
