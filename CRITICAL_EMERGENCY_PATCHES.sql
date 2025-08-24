-- ================================================================
-- 🚨 CRITICAL EMERGENCY PATCHES - MINIMAL VERSION (30 SECONDS)
-- ================================================================
--
-- APPLY THESE IMMEDIATELY IF YOU HAVE LIMITED TIME:
-- 1. Copy this entire content
-- 2. Go to: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql  
-- 3. Paste and click "Run"
--
-- ================================================================

-- EMERGENCY: Remove the most dangerous policies that bypass ALL security
DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
DROP POLICY IF EXISTS "Public access for demo" ON public.billing_records;
DROP POLICY IF EXISTS "Public read access for orders" ON orders;
DROP POLICY IF EXISTS "Public read access for order_items" ON order_items;

-- Create minimal helper function
CREATE OR REPLACE FUNCTION get_current_user_merchant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT merchant_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create basic secure policies
CREATE POLICY "Secure merchant access" ON public.merchants
FOR ALL USING (id = get_current_user_merchant_id());

CREATE POLICY "Secure returns access" ON public.returns  
FOR ALL USING (merchant_id = get_current_user_merchant_id());

-- Enable RLS on critical tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Quick verification
SELECT 'EMERGENCY PATCHES APPLIED - CHECK RESULTS BELOW' as status;

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ SECURED' ELSE '❌ VULNERABLE' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'returns', 'profiles');

-- ================================================================
-- RESULT: Your most critical vulnerabilities are now patched!
-- Next: Apply the full EMERGENCY_SQL_PATCHES.sql when you have time
-- ================================================================