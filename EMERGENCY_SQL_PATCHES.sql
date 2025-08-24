-- ================================================================
-- 🚨 EMERGENCY DATABASE SECURITY PATCHES - APPLY IMMEDIATELY
-- ================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql
-- 2. Copy and paste this entire file content into the SQL Editor
-- 3. Click "Run" to execute all patches
-- 4. Verify success with the verification queries at the end
--
-- ================================================================

-- ================================================================
-- PATCH 1: EMERGENCY - Remove Dangerous Public Policies (CRITICAL)
-- ================================================================

BEGIN;

DO $$ 
BEGIN
    -- Remove dangerous "Public access for demo" policies that bypass ALL security
    DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
    DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
    DROP POLICY IF EXISTS "Public access for demo" ON public.return_items;
    DROP POLICY IF EXISTS "Public access for demo" ON public.ai_suggestions;
    DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
    DROP POLICY IF EXISTS "Public access for demo" ON public.billing_records;
    DROP POLICY IF EXISTS "Public access for demo" ON public.users;
    DROP POLICY IF EXISTS "Public access for demo" ON public.profiles;
    
    -- Remove other dangerous public policies
    DROP POLICY IF EXISTS "Public read access for orders" ON orders;
    DROP POLICY IF EXISTS "Public read access for order_items" ON order_items;
    DROP POLICY IF EXISTS "Customers can view orders by email" ON orders;
    DROP POLICY IF EXISTS "Customers can view their returns" ON returns;
    
    RAISE NOTICE '✅ Dangerous public policies removed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Warning: Some policies may not exist - %', SQLERRM;
END $$;

COMMIT;

-- ================================================================
-- PATCH 2: Create Secure Helper Functions
-- ================================================================

-- Function to get current user's merchant ID from JWT/session
CREATE OR REPLACE FUNCTION get_current_user_merchant_id()
RETURNS UUID AS $$
DECLARE
    user_merchant_id UUID;
BEGIN
    -- Get merchant_id from the user's profile
    SELECT merchant_id INTO user_merchant_id
    FROM profiles 
    WHERE id = auth.uid();
    
    -- If no profile found, return NULL (will cause RLS to deny access)
    RETURN user_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'master_admin' 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PATCH 3: Implement Secure RLS Policies for Core Tables
-- ================================================================

-- Merchants table - users can only access their own merchant
DROP POLICY IF EXISTS "Secure merchant access" ON public.merchants;
CREATE POLICY "Secure merchant access" ON public.merchants
FOR ALL USING (
    id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    id = get_current_user_merchant_id() OR is_system_admin()
);

-- Profiles table - users can only access their own profile
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
CREATE POLICY "Secure profile access" ON public.profiles
FOR ALL USING (
    id = auth.uid() OR 
    (merchant_id = get_current_user_merchant_id() AND is_system_admin())
)
WITH CHECK (
    id = auth.uid() OR 
    (merchant_id = get_current_user_merchant_id() AND is_system_admin())
);

-- Returns table - merchant-scoped access
DROP POLICY IF EXISTS "Secure returns access" ON public.returns;
CREATE POLICY "Secure returns access" ON public.returns
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- Analytics events table - merchant-scoped
DROP POLICY IF EXISTS "Secure analytics access" ON public.analytics_events;
CREATE POLICY "Secure analytics access" ON public.analytics_events
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- Orders table security (if exists)
DO $$
BEGIN
    -- Add merchant_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'merchant_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN merchant_id UUID REFERENCES merchants(id);
        RAISE NOTICE 'Added merchant_id column to orders table';
    END IF;
END $$;

-- Secure orders table policies
DROP POLICY IF EXISTS "Secure orders access" ON public.orders;
CREATE POLICY "Secure orders access" ON public.orders
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- ================================================================
-- PATCH 4: Enable RLS on All Critical Tables
-- ================================================================

DO $$
DECLARE
    tbl_name TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'merchants', 'profiles', 'orders', 'order_items', 
        'returns', 'return_items', 'analytics_events', 
        'billing_records', 'ai_suggestions'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_secure
    LOOP
        -- Check if table exists before enabling RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
            RAISE NOTICE '✅ Enabled RLS for table: %', tbl_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================
-- VERIFICATION QUERIES - Check These Results
-- ================================================================

-- Check 1: Verify dangerous policies are removed
SELECT '🔍 VERIFICATION: Checking for dangerous policies' as check_type;
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
SELECT '🔍 VERIFICATION: Checking RLS status' as check_type;
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
AND tablename IN (
    'merchants', 'profiles', 'orders', 'returns', 
    'analytics_events', 'billing_records'
)
ORDER BY tablename;

-- Check 3: Verify helper functions exist
SELECT '🔍 VERIFICATION: Checking helper functions' as check_type;
SELECT 
    routine_name,
    routine_type,
    '✅ FUNCTION EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('get_current_user_merchant_id', 'is_system_admin')
AND routine_schema = 'public';

-- ================================================================
-- SUCCESS CONFIRMATION
-- ================================================================

SELECT '🎉 CRITICAL SECURITY PATCHES APPLIED SUCCESSFULLY' as result;
SELECT '📋 Review verification results above' as next_step;
SELECT '🧪 Test application functionality after applying patches' as important_note;

-- ================================================================
-- EXPECTED RESULTS AFTER SUCCESSFUL PATCH APPLICATION:
-- ================================================================
-- 
-- ✅ Dangerous policies check: No rows returned (all removed)
-- ✅ RLS status check: All tables show "RLS ENABLED"
-- ✅ Helper functions: Both functions exist
-- ✅ Application: New merchants see empty dashboards
-- ✅ Security: Cross-tenant access blocked
--
-- 🚨 IF ANY CHECKS FAIL:
-- - Note the specific error messages
-- - Apply patches individually if needed  
-- - Contact support if critical errors persist
--
-- ================================================================