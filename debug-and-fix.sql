-- Debug and fix the merchant creation issue
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Check what merchants exist
SELECT 'EXISTING MERCHANTS:' as info;
SELECT id, shop_domain, plan_type FROM merchants WHERE shop_domain LIKE '%test%' OR shop_domain LIKE '%66666666%';

-- STEP 2: Try to find our test merchant
SELECT 'OUR TEST MERCHANT:' as info;
SELECT id, shop_domain, plan_type FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- STEP 3: Delete the merchant if it exists (to start fresh)
DELETE FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- STEP 4: Insert merchant with fresh UUID
INSERT INTO merchants (
  id, 
  shop_domain, 
  access_token, 
  plan_type, 
  created_at, 
  updated_at,
  settings
) VALUES (
  gen_random_uuid(), 
  'test-66666666.myshopify.com', 
  'shpat_test_66666666_access_token_for_testing', 
  'pro',
  NOW(),
  NOW(),
  '{}'::jsonb
);

-- STEP 5: Get the actual merchant ID that was created
SELECT 'MERCHANT CREATED WITH ID:' as info;
SELECT id, shop_domain, plan_type FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- STEP 6: Store the merchant ID in a variable and create orders
-- (You'll need to copy the actual ID from step 5 and use it below)
-- Replace 'MERCHANT_ID_FROM_STEP_5' with the actual UUID from the result above

/*
-- STEP 7: Once you have the merchant ID, run this with the real ID:

-- Test Customer 1: John Smith  
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES (gen_random_uuid(), 'ORD-2024-TEST-001', 'john.smith@test.com', 299.97, 'completed', 'MERCHANT_ID_FROM_STEP_5');

-- Get the order ID that was just created for order items
SELECT 'ORDER CREATED:' as info;
SELECT id, customer_email, shopify_order_id FROM orders WHERE shopify_order_id = 'ORD-2024-TEST-001';

-- Add order items (replace ORDER_ID_HERE with actual order ID)
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('ORDER_ID_HERE', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1),
('ORDER_ID_HERE', 'prod_test_002', 'Mechanical Keyboard', 89.99, 1),
('ORDER_ID_HERE', 'prod_test_003', 'Gaming Mouse', 59.99, 1);
*/

SELECT 'NEXT STEPS:' as info;
SELECT '1. Copy the merchant ID from above' as step
UNION ALL
SELECT '2. Use it to create orders manually' 
UNION ALL
SELECT '3. Or I can create a script with the real ID';