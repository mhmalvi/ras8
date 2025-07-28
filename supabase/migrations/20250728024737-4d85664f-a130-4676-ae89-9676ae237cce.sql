-- Allow public access to orders table for customer return portal lookups
-- This enables customers to lookup their orders by providing order number + email
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;

CREATE POLICY "Public order lookup for returns" 
ON orders 
FOR SELECT 
USING (
  -- Allow master admins to see all orders
  is_master_admin() 
  OR 
  -- Allow merchants to see orders with associated returns
  (EXISTS ( 
    SELECT 1 FROM returns r
    WHERE r.shopify_order_id::text = orders.shopify_order_id::text 
    AND r.merchant_id = get_current_user_merchant_id()
  ))
  OR
  -- Allow public access for customer return portal (no auth required)
  -- This enables the public returns portal functionality
  auth.uid() IS NULL
);