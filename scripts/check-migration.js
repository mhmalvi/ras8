/**
 * Migration Verification Script
 * 
 * Checks if the landing logic database migration has been applied successfully
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pvadajelvewdazwmvppk.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...\n');
  
  const checks = [];
  
  // 1. Check if shopify_tokens table exists
  try {
    const { data, error } = await supabase.from('shopify_tokens').select('count').limit(1);
    if (error && error.code === 'PGRST106') {
      checks.push({ name: 'shopify_tokens table', status: '❌ Missing', error: error.message });
    } else {
      checks.push({ name: 'shopify_tokens table', status: '✅ Exists' });
    }
  } catch (e) {
    checks.push({ name: 'shopify_tokens table', status: '❌ Error', error: e.message });
  }
  
  // 2. Check if validate_merchant_integration function exists
  try {
    const { data, error } = await supabase.rpc('validate_merchant_integration', {
      p_user_id: '00000000-0000-0000-0000-000000000000' // Test UUID
    });
    
    if (error && error.code === 'PGRST202') {
      checks.push({ name: 'validate_merchant_integration function', status: '❌ Missing', error: error.message });
    } else {
      checks.push({ name: 'validate_merchant_integration function', status: '✅ Exists' });
    }
  } catch (e) {
    checks.push({ name: 'validate_merchant_integration function', status: '❌ Error', error: e.message });
  }
  
  // 3. Check if get_merchant_with_token function exists
  try {
    const { data, error } = await supabase.rpc('get_merchant_with_token', {
      p_merchant_id: '00000000-0000-0000-0000-000000000000' // Test UUID
    });
    
    if (error && error.code === 'PGRST202') {
      checks.push({ name: 'get_merchant_with_token function', status: '❌ Missing', error: error.message });
    } else {
      checks.push({ name: 'get_merchant_with_token function', status: '✅ Exists' });
    }
  } catch (e) {
    checks.push({ name: 'get_merchant_with_token function', status: '❌ Error', error: e.message });
  }
  
  // 4. Check if mark_merchant_uninstalled function exists  
  try {
    const { data, error } = await supabase.rpc('mark_merchant_uninstalled', {
      p_shop_domain: 'test-check.myshopify.com'
    });
    
    if (error && error.code === 'PGRST202') {
      checks.push({ name: 'mark_merchant_uninstalled function', status: '❌ Missing', error: error.message });
    } else {
      checks.push({ name: 'mark_merchant_uninstalled function', status: '✅ Exists' });
    }
  } catch (e) {
    checks.push({ name: 'mark_merchant_uninstalled function', status: '❌ Error', error: e.message });
  }
  
  // Display results
  console.log('📊 Migration Status Report:');
  console.log('═'.repeat(50));
  
  let allPassed = true;
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
    if (check.error) {
      console.log(`   Error: ${check.error}`);
    }
    if (check.status.includes('❌')) {
      allPassed = false;
    }
  });
  
  console.log('═'.repeat(50));
  
  if (allPassed) {
    console.log('🎉 Migration Status: COMPLETE');
    console.log('✅ All database objects are properly configured');
    console.log('✅ Landing logic system is ready to use');
  } else {
    console.log('⚠️ Migration Status: INCOMPLETE');
    console.log('❌ Some database objects are missing');
    console.log('📋 Action Required: Apply the database migration');
    console.log('📖 See MIGRATION_INSTRUCTIONS.md for details');
  }
  
  return allPassed;
}

checkMigrationStatus()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });