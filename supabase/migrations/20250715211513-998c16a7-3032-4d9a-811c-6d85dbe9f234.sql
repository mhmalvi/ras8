-- Create security definer function to check master admin access
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'master_admin'
  );
$$;

-- Create master admin policies for merchants table
CREATE POLICY "Master admins can view all merchants"
ON public.merchants FOR SELECT
USING (public.is_master_admin());

CREATE POLICY "Master admins can update all merchants"
ON public.merchants FOR UPDATE
USING (public.is_master_admin());

-- Create master admin policies for returns table  
CREATE POLICY "Master admins can view all returns"
ON public.returns FOR SELECT
USING (public.is_master_admin());

-- Create master admin policies for analytics_events
CREATE POLICY "Master admins can view all analytics"
ON public.analytics_events FOR SELECT
USING (public.is_master_admin());

-- Create master admin policies for webhook_activity
CREATE POLICY "Master admins can view all webhook activity"
ON public.webhook_activity FOR SELECT  
USING (public.is_master_admin());

-- Create master admin policies for ai_suggestions
CREATE POLICY "Master admins can view all ai suggestions"
ON public.ai_suggestions FOR SELECT
USING (public.is_master_admin());

-- Create master admin policies for return_items
CREATE POLICY "Master admins can view all return items"
ON public.return_items FOR SELECT
USING (public.is_master_admin());

-- Create master admin policies for billing_records
CREATE POLICY "Master admins can view all billing records"
ON public.billing_records FOR SELECT
USING (public.is_master_admin());