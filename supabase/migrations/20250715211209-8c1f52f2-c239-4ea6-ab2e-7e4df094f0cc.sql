-- CRITICAL SECURITY FIX: Remove dangerous public access policies
DROP POLICY IF EXISTS "Public access for demo" ON ai_suggestions;
DROP POLICY IF EXISTS "Public access for demo" ON analytics_events; 
DROP POLICY IF EXISTS "Public access for demo" ON billing_records;
DROP POLICY IF EXISTS "Public access for demo" ON merchants;
DROP POLICY IF EXISTS "Public access for demo" ON return_items;
DROP POLICY IF EXISTS "Public access for demo" ON returns;
DROP POLICY IF EXISTS "Public access for demo" ON users;
DROP POLICY IF EXISTS "Public access for webhook activity demo" ON webhook_activity;

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Public read access for orders" ON orders;
DROP POLICY IF EXISTS "Public read access for order_items" ON order_items;
DROP POLICY IF EXISTS "Customers can view orders by email" ON orders;

-- Make merchant_id columns NOT NULL where they should be
ALTER TABLE analytics_events ALTER COLUMN merchant_id SET NOT NULL;
ALTER TABLE billing_records ALTER COLUMN merchant_id SET NOT NULL;
ALTER TABLE returns ALTER COLUMN merchant_id SET NOT NULL;
ALTER TABLE webhook_activity ALTER COLUMN merchant_id SET NOT NULL;

-- Create proper master admin role system
CREATE TYPE public.user_role AS ENUM ('merchant_admin', 'merchant_staff', 'master_admin');

-- Update profiles table to use proper roles
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role = 'master_admin' OR email = 'aalvi.hm@gmail.com' THEN 'master_admin'::user_role
    WHEN role = 'admin' THEN 'merchant_admin'::user_role 
    ELSE 'merchant_staff'::user_role
  END;

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

-- Secure orders table - only allow customer access with email verification
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
USING (
  -- Allow if they're querying by their own email (for customer portal)
  customer_email = current_setting('request.jwt.claims', true)::json->>'email'
  OR 
  -- Allow master admins
  public.is_master_admin()
  OR
  -- Allow merchants to see their orders (when we add merchant_id to orders)
  EXISTS (
    SELECT 1 FROM public.returns r 
    WHERE r.shopify_order_id = orders.shopify_order_id 
    AND r.merchant_id = get_current_user_merchant_id()
  )
);

-- Secure order_items table  
CREATE POLICY "Restricted access to order items"
ON public.order_items FOR SELECT
USING (
  public.is_master_admin()
  OR
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.customer_email = current_setting('request.jwt.claims', true)::json->>'email'
      OR EXISTS (
        SELECT 1 FROM public.returns r 
        WHERE r.shopify_order_id = o.shopify_order_id 
        AND r.merchant_id = get_current_user_merchant_id()
      )
    )
  )
);