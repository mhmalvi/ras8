
-- Temporarily disable RLS on merchants table to allow sync operations
ALTER TABLE public.merchants DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with updated policies that allow for sync operations
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Merchants can access their own data" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can access their own returns" ON public.returns;
DROP POLICY IF EXISTS "Merchants can access their own return items" ON public.return_items;
DROP POLICY IF EXISTS "Merchants can access AI suggestions for their returns" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Merchants can access their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Merchants can access their own billing records" ON public.billing_records;
DROP POLICY IF EXISTS "Users can access their merchant's user records" ON public.users;

-- Create more permissive policies for development/demo purposes
-- These allow public access for demo data creation

-- Merchants table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.merchants
FOR ALL USING (true) WITH CHECK (true);

-- Returns table - allow public read/write for demo  
CREATE POLICY "Public access for demo" ON public.returns
FOR ALL USING (true) WITH CHECK (true);

-- Return items table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.return_items  
FOR ALL USING (true) WITH CHECK (true);

-- AI suggestions table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.ai_suggestions
FOR ALL USING (true) WITH CHECK (true);

-- Analytics events table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.analytics_events
FOR ALL USING (true) WITH CHECK (true);

-- Billing records table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.billing_records
FOR ALL USING (true) WITH CHECK (true);

-- Users table - allow public read/write for demo
CREATE POLICY "Public access for demo" ON public.users
FOR ALL USING (true) WITH CHECK (true);
