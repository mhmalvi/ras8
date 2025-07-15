-- CRITICAL SECURITY FIX: Remove dangerous public access policies first
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

-- Create proper master admin role system
CREATE TYPE public.user_role AS ENUM ('merchant_admin', 'merchant_staff', 'master_admin');

-- Fix role column - first remove default, then change type
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Update profiles table to use proper roles  
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role = 'master_admin' OR email = 'aalvi.hm@gmail.com' THEN 'master_admin'::user_role
    WHEN role = 'admin' THEN 'merchant_admin'::user_role 
    ELSE 'merchant_staff'::user_role
  END;

-- Set new default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'merchant_staff'::user_role;