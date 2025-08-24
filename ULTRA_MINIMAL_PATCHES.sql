-- ================================================================
-- 🚨 ULTRA MINIMAL SECURITY PATCHES - ZERO COMPLEX SYNTAX
-- ================================================================
-- Copy this into Supabase SQL Editor and click Run
-- https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql
-- ================================================================

-- Remove the most dangerous policies
DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
DROP POLICY IF EXISTS "Public read access for orders" ON orders;

-- Create simple helper function
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

-- Verify success
SELECT 'VERIFICATION RESULTS' as check_type;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'returns', 'profiles');

SELECT 'PATCHES APPLIED SUCCESSFULLY' as result;