-- Fix analytics_events RLS to allow anonymous access for analytics tracking
-- This is needed because analytics events are created before user authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Merchants can access their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Secure analytics access" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view their merchant's analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can create analytics for their merchant" ON public.analytics_events;

-- Create new policy to allow anonymous analytics collection
CREATE POLICY "Allow anonymous analytics collection" ON public.analytics_events
FOR INSERT WITH CHECK (true);

-- Allow reading for authenticated users only (security for dashboard)
CREATE POLICY "Authenticated users can read analytics" ON public.analytics_events
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow updating for service role only
CREATE POLICY "Service role can update analytics" ON public.analytics_events
FOR UPDATE USING (auth.role() = 'service_role');

-- Allow deleting for service role only  
CREATE POLICY "Service role can delete analytics" ON public.analytics_events
FOR DELETE USING (auth.role() = 'service_role');