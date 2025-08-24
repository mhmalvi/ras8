-- Fix Analytics Table RLS Permissions
-- This script resolves the analytics_events table RLS issues that are blocking Edge Function access

-- First, check if the table exists and has RLS enabled
SELECT schemaname, tablename, rowsecurity, hasoids 
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'analytics_events';

-- Option 1: Create proper RLS policy for analytics_events (RECOMMENDED)
-- This allows service role, authenticated users, and anonymous users to insert
DROP POLICY IF EXISTS "Allow analytics inserts" ON analytics_events;

CREATE POLICY "Allow analytics inserts" 
ON analytics_events 
FOR INSERT 
TO service_role, authenticated, anon
USING (true);

-- Also allow SELECT for service role to read analytics data
DROP POLICY IF EXISTS "Allow service role select" ON analytics_events;

CREATE POLICY "Allow service role select" 
ON analytics_events 
FOR SELECT 
TO service_role
USING (true);

-- Grant necessary permissions to service role
GRANT ALL ON analytics_events TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant insert permissions to authenticated and anon roles
GRANT INSERT ON analytics_events TO authenticated;
GRANT INSERT ON analytics_events TO anon;

-- Verify the policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'analytics_events';

-- Display current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN 'Row Level Security is ENABLED'
    ELSE 'Row Level Security is DISABLED'
  END as status
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'analytics_events';

-- Show all policies on the table
\d+ analytics_events