-- Secure orders table - only allow appropriate access
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
USING (
  -- Allow master admins to see all orders
  public.is_master_admin()
  OR
  -- Allow merchants to see orders related to their returns
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
  -- Allow master admins to see all order items
  public.is_master_admin()
  OR
  -- Allow merchants to see order items for their returns
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.returns r ON r.shopify_order_id = o.shopify_order_id
    WHERE o.id = order_items.order_id
    AND r.merchant_id = get_current_user_merchant_id()
  )
);

-- Update get_current_user_merchant_id to be more secure
CREATE OR REPLACE FUNCTION public.get_current_user_merchant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT merchant_id FROM public.profiles 
  WHERE id = auth.uid() 
  AND merchant_id IS NOT NULL;
$$;