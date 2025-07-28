-- Update order_items RLS policy to allow public access for customer return portal
DROP POLICY IF EXISTS "Restricted access to order items" ON order_items;

CREATE POLICY "Public order items lookup for returns" 
ON order_items 
FOR SELECT 
USING (
  -- Allow master admins to see all order items
  is_master_admin() 
  OR 
  -- Allow merchants to see order items for orders with associated returns
  (EXISTS ( 
    SELECT 1 FROM orders o
    JOIN returns r ON r.shopify_order_id::text = o.shopify_order_id::text
    WHERE o.id = order_items.order_id 
    AND r.merchant_id = get_current_user_merchant_id()
  ))
  OR
  -- Allow public access for customer return portal (no auth required)
  -- This enables the public returns portal functionality
  auth.uid() IS NULL
);