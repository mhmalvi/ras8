-- Step-by-step test data insertion with checks
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

-- STEP 1: Check existing merchants table structure
SELECT 'Current merchants:' as step;
SELECT id, shop_domain, plan_type FROM merchants LIMIT 3;

-- STEP 2: Insert test merchant (try simple insert first)
INSERT INTO merchants (id, shop_domain, access_token, plan_type, created_at, updated_at) 
VALUES (
  '66666666-e29b-41d4-a716-446655440000', 
  'test-66666666.myshopify.com', 
  'test_access_token_66666666', 
  'pro',
  NOW(),
  NOW()
);

-- STEP 3: Verify merchant was created
SELECT 'Merchant created:' as step;
SELECT id, shop_domain, plan_type FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- STEP 4: Insert first test order
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id, created_at, updated_at) 
VALUES (
  '11111111-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-001', 
  'john.smith@test.com', 
  299.97, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

-- STEP 5: Insert order items for first order
INSERT INTO order_items (order_id, product_id, product_name, price, quantity, created_at, updated_at) VALUES 
('11111111-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1, NOW(), NOW()),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_002', 'Mechanical Keyboard', 89.99, 1, NOW(), NOW()),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_003', 'Gaming Mouse', 59.99, 1, NOW(), NOW());

-- STEP 6: Verify first order was created
SELECT 'First order created:' as step;
SELECT customer_email, shopify_order_id, total_amount FROM orders WHERE id = '11111111-e29b-41d4-a716-446655440000';

-- Continue with remaining orders only if first one succeeds...