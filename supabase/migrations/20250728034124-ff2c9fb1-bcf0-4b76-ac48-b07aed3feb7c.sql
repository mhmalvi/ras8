-- Fix all remaining function search path security warnings

-- Update get_current_user_merchant_id function
CREATE OR REPLACE FUNCTION public.get_current_user_merchant_id()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT merchant_id FROM public.profiles 
  WHERE id = auth.uid() 
  AND merchant_id IS NOT NULL;
$$;

-- Update is_master_admin function  
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'master_admin'
  );
$$;