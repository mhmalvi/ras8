// APPLY SECURITY PATCHES PROGRAMMATICALLY
// This script attempts to apply critical security patches using the Supabase client

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "REPLACE_WITH_YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "REPLACE_WITH_YOUR_SUPABASE_ANON_KEY";

// Note: This will likely fail as we need service role key for DDL operations
// But we'll try anyway and provide guidance

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚨 ATTEMPTING TO APPLY CRITICAL SECURITY PATCHES');
console.log('================================================');

async function applyCriticalPatches() {
  try {
    console.log('⚡ Attempting to apply emergency security patches...');
    
    // This will likely fail due to permissions, but let's try
    const { error } = await supabase.rpc('sql', {
      query: `
        -- Emergency: Remove most dangerous policy
        DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
        
        -- Quick verification
        SELECT 'Emergency patch attempted' as result;
      `
    });

    if (error) {
      console.log('❌ EXPECTED FAILURE: Cannot apply DDL operations with anon key');
      console.log('Error:', error.message);
      console.log('');
      console.log('🔧 MANUAL APPLICATION REQUIRED:');
      console.log('');
      console.log('1. 🌐 Go to Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql');
      console.log('');
      console.log('2. 📋 Copy and paste content from one of these files:');
      console.log('   - CRITICAL_EMERGENCY_PATCHES.sql (30 seconds, minimal)');
      console.log('   - EMERGENCY_SQL_PATCHES.sql (2 minutes, comprehensive)');
      console.log('   - security-patches.sql (5 minutes, complete)');
      console.log('');
      console.log('3. ▶️  Click "Run" in the SQL Editor');
      console.log('');
      console.log('4. ✅ Verify all checks pass in the results');
      
    } else {
      console.log('✅ Patches applied successfully!');
    }

  } catch (err) {
    console.log('❌ Connection or other error:', err.message);
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Try a simple query that should work with anon key
    const { data, error } = await supabase
      .from('merchants')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('RLS')) {
        console.log('✅ Connection works - RLS is active (good sign!)');
      } else {
        console.log('⚠️  Connection issue:', error.message);
      }
    } else {
      console.log('✅ Connection successful');
      console.log('⚠️  WARNING: If you can read merchant data, RLS may not be properly configured!');
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

// Check current security status
async function checkSecurityStatus() {
  console.log('');
  console.log('🔍 CHECKING CURRENT SECURITY STATUS');
  console.log('===================================');
  
  try {
    // Try to access data that should be blocked
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .limit(5);
    
    if (merchantError) {
      if (merchantError.message.includes('RLS') || merchantError.message.includes('policy')) {
        console.log('✅ Merchants table: SECURED (RLS blocking access)');
      } else {
        console.log('⚠️  Merchants table: Unknown error -', merchantError.message);
      }
    } else {
      console.log('🚨 Merchants table: VULNERABLE (can read data without auth)');
      console.log(`   Found ${merchants?.length || 0} merchant records`);
    }
    
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select('*')  
      .limit(5);
    
    if (returnsError) {
      if (returnsError.message.includes('RLS') || returnsError.message.includes('policy')) {
        console.log('✅ Returns table: SECURED (RLS blocking access)');
      } else {
        console.log('⚠️  Returns table: Unknown error -', returnsError.message);
      }
    } else {
      console.log('🚨 Returns table: VULNERABLE (can read data without auth)');
      console.log(`   Found ${returns?.length || 0} return records`);
    }
    
  } catch (err) {
    console.log('❌ Security check failed:', err.message);
  }
}

// Run all checks
async function runSecurityDiagnostics() {
  await testConnection();
  await checkSecurityStatus();
  await applyCriticalPatches();
  
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('=============');
  console.log('1. Apply database patches manually via Supabase Dashboard');
  console.log('2. Re-run this script to verify patches worked');
  console.log('3. Test application with multiple merchant accounts');
  console.log('4. Run full security verification: node security-verification-test.js');
}

runSecurityDiagnostics();