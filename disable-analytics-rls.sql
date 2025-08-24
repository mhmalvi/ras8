-- EMERGENCY: Disable RLS on analytics_events table
-- Use this only if the proper RLS policy doesn't work and you need immediate access

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'analytics_events';

-- Disable Row Level Security on analytics_events table
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- Grant full access to all roles (temporary solution)
GRANT ALL ON analytics_events TO service_role;
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON analytics_events TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN 'Row Level Security is ENABLED - PROBLEM!'
    ELSE 'Row Level Security is DISABLED - FIXED!'
  END as status
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'analytics_events';

-- Test insert (should work now)
-- INSERT INTO analytics_events (event_type, shop_domain, data) 
-- VALUES ('test', 'test.myshopify.com', '{"test": true}');

SELECT 'RLS has been DISABLED on analytics_events table. Edge Functions should now work.' as result;