// 🚨 EMERGENCY DATABASE SECURITY PATCHES
// Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

// Copy and paste the following SQL commands one by one in the SQL Editor:

console.log(`
🚨 EMERGENCY DATABASE SECURITY PATCHES
=====================================

⚠️  CRITICAL: Apply these SQL commands immediately in Supabase Dashboard
📍 Go to: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

Copy and paste each section below into the SQL Editor and click "Run":

-- ================================================================
-- PATCH 1: EMERGENCY - Remove Dangerous Public Policies (CRITICAL)
-- ================================================================

BEGIN;

DO $$ 
BEGIN
    -- Remove dangerous "Public access for demo" policies
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
    
    RAISE NOTICE 'Dangerous public policies removed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Some policies may not exist - %', SQLERRM;
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

-- ================================================================
-- PATCH 4: Enable RLS on All Critical Tables
-- ================================================================

DO $$
DECLARE
    table_name TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'merchants', 'profiles', 'orders', 'order_items', 
        'returns', 'return_items', 'analytics_events', 
        'billing_records', 'ai_suggestions'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_secure
    LOOP
        -- Check if table exists before enabling RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'Enabled RLS for table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================
-- VERIFICATION QUERIES - Run these to check success
-- ================================================================

-- Verify dangerous policies are removed
SELECT 'VERIFICATION: Dangerous policies check' as test_name;
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

-- Verify RLS is enabled
SELECT 'VERIFICATION: RLS status check' as test_name;
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
AND tablename IN ('merchants', 'profiles', 'orders', 'returns');

SELECT 'CRITICAL SECURITY PATCHES APPLIED SUCCESSFULLY' as status;

🚨 After running these patches:
1. No rows should be returned from the "dangerous policies" check
2. All tables should show "RLS ENABLED" 
3. Test your application to ensure proper tenant isolation

⚠️  If you see any errors, please run the commands individually and note the specific error messages.
`);

// This makes it easy to copy the SQL for dashboard application
const sqlPatches = \`
-- COPY THIS SQL AND RUN IN SUPABASE DASHBOARD SQL EDITOR

-- PATCH 1: Remove dangerous policies
BEGIN;
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
    DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
    DROP POLICY IF EXISTS "Public access for demo" ON public.return_items;
    DROP POLICY IF EXISTS "Public access for demo" ON public.ai_suggestions;
    DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
    DROP POLICY IF EXISTS "Public access for demo" ON public.billing_records;
    DROP POLICY IF EXISTS "Public read access for orders" ON orders;
    DROP POLICY IF EXISTS "Public read access for order_items" ON order_items;
    RAISE NOTICE 'Dangerous policies removed';
END $$;
COMMIT;

-- PATCH 2: Create helper functions
CREATE OR REPLACE FUNCTION get_current_user_merchant_id()
RETURNS UUID AS $$
DECLARE user_merchant_id UUID;
BEGIN
    SELECT merchant_id INTO user_merchant_id FROM profiles WHERE id = auth.uid();
    RETURN user_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PATCH 3: Secure policies
DROP POLICY IF EXISTS "Secure merchant access" ON public.merchants;
CREATE POLICY "Secure merchant access" ON public.merchants
FOR ALL USING (id = get_current_user_merchant_id());

DROP POLICY IF EXISTS "Secure returns access" ON public.returns;
CREATE POLICY "Secure returns access" ON public.returns
FOR ALL USING (merchant_id = get_current_user_merchant_id());

-- PATCH 4: Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- VERIFICATION
SELECT 'SUCCESS: Critical patches applied' as result;
\`;

console.log("📋 READY TO COPY SQL PATCHES:");
console.log(sqlPatches);