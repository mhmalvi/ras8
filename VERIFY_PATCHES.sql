-- ================================================================
-- 🔍 SECURITY PATCH VERIFICATION SCRIPT
-- ================================================================
-- Run this after applying security patches to verify success
-- Copy into Supabase SQL Editor and click Run
-- ================================================================

-- Check 1: Verify dangerous policies are removed
SELECT '1. DANGEROUS POLICIES CHECK' as test_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    CASE 
        WHEN qual = 'true' THEN '🚨 STILL DANGEROUS'
        ELSE '✅ SECURE'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND qual = 'true';

-- Check 2: Verify RLS is enabled
SELECT '2. RLS STATUS CHECK' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '🚨 RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'profiles', 'returns', 'orders', 'analytics_events')
ORDER BY tablename;

-- Check 3: Verify helper functions exist
SELECT '3. HELPER FUNCTIONS CHECK' as test_name;
SELECT 
    routine_name,
    routine_type,
    '✅ FUNCTION EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('get_current_user_merchant_id', 'is_system_admin')
AND routine_schema = 'public';

-- Check 4: Verify secure policies exist
SELECT '4. SECURE POLICIES CHECK' as test_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ SECURE POLICY' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%Secure%'
ORDER BY tablename;

-- Overall Status
SELECT '5. OVERALL SECURITY STATUS' as test_name;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '🎉 ALL DANGEROUS POLICIES REMOVED'
        ELSE '⚠️ SOME DANGEROUS POLICIES STILL EXIST'
    END as dangerous_policies_status
FROM pg_policies 
WHERE schemaname = 'public' AND qual = 'true';

SELECT 
    CASE 
        WHEN COUNT(*) >= 3 THEN '🎉 CORE TABLES SECURED WITH RLS'
        ELSE '⚠️ SOME TABLES MISSING RLS'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'profiles', 'returns')
AND rowsecurity = true;

SELECT 'SECURITY PATCH VERIFICATION COMPLETE' as final_result;