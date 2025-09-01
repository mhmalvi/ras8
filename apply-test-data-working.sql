-- Working test data insertion based on actual table structure
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

-- Insert test merchant for test-66666666.myshopify.com with all required fields
INSERT INTO merchants (
  id, 
  shop_domain, 
  access_token, 
  plan_type, 
  created_at, 
  updated_at,
  settings
) VALUES (
  '66666666-e29b-41d4-a716-446655440000', 
  'test-66666666.myshopify.com', 
  'shpat_test_66666666_access_token_for_testing', 
  'pro',
  NOW(),
  NOW(),
  '{}'::jsonb
);

-- Verify merchant was created
SELECT 'Merchant created successfully:' as status;
SELECT id, shop_domain, plan_type, created_at FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- Insert test orders one by one
-- Test Customer 1: John Smith
INSERT INTO orders (
  id, 
  shopify_order_id, 
  customer_email, 
  total_amount, 
  status, 
  merchant_id, 
  created_at, 
  updated_at
) VALUES (
  '11111111-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-001', 
  'john.smith@test.com', 
  299.97, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

-- Insert order items for John's order
INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('11111111-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_002', 'Mechanical Keyboard', 89.99, 1),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_003', 'Gaming Mouse', 59.99, 1);

-- Test Customer 2: Sarah Johnson
INSERT INTO orders (
  id, 
  shopify_order_id, 
  customer_email, 
  total_amount, 
  status, 
  merchant_id, 
  created_at, 
  updated_at
) VALUES (
  '22222222-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-002', 
  'sarah.johnson@test.com', 
  549.95, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('22222222-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_005', 'Wireless Charging Station', 199.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_006', 'USB-C Hub Deluxe', 119.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_007', 'Laptop Stand Ergonomic', 99.98, 1);

-- Test Customer 3: Mike Chen
INSERT INTO orders (
  id, 
  shopify_order_id, 
  customer_email, 
  total_amount, 
  status, 
  merchant_id, 
  created_at, 
  updated_at
) VALUES (
  '33333333-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-003', 
  'mike.chen@test.com', 
  179.97, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('33333333-e29b-41d4-a716-446655440000', 'prod_test_008', 'Bluetooth Speaker', 79.99, 1),
('33333333-e29b-41d4-a716-446655440000', 'prod_test_009', 'Phone Case Premium', 49.99, 1),
('33333333-e29b-41d4-a716-446655440000', 'prod_test_010', 'Screen Protector Pack', 49.99, 1);

-- Test Customer 4: Emma Wilson
INSERT INTO orders (
  id, 
  shopify_order_id, 
  customer_email, 
  total_amount, 
  status, 
  merchant_id, 
  created_at, 
  updated_at
) VALUES (
  '44444444-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-004', 
  'emma.wilson@test.com', 
  129.98, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('44444444-e29b-41d4-a716-446655440000', 'prod_test_011', 'Wireless Earbuds', 89.99, 1),
('44444444-e29b-41d4-a716-446655440000', 'prod_test_012', 'Car Mount Universal', 39.99, 1);

-- Test Customer 5: David Brown
INSERT INTO orders (
  id, 
  shopify_order_id, 
  customer_email, 
  total_amount, 
  status, 
  merchant_id, 
  created_at, 
  updated_at
) VALUES (
  '55555555-e29b-41d4-a716-446655440000', 
  'ORD-2024-TEST-005', 
  'david.brown@test.com', 
  699.95, 
  'completed', 
  '66666666-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('55555555-e29b-41d4-a716-446655440000', 'prod_test_013', 'Monitor 4K Professional', 299.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_014', 'Webcam HD Pro', 159.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_015', 'Desk Lamp LED', 129.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_016', 'Cable Management Kit', 109.98, 1);

-- Add sample returns
INSERT INTO returns (
  id, 
  shopify_order_id, 
  customer_email, 
  reason, 
  status, 
  total_amount, 
  merchant_id
) VALUES 
('77777777-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-001', 'john.smith@test.com', 'Product defective', 'requested', 149.99, '66666666-e29b-41d4-a716-446655440000'),
('88888888-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 'Wrong size', 'approved', 129.99, '66666666-e29b-41d4-a716-446655440000');

-- Add return items
INSERT INTO return_items (return_id, product_id, product_name, price, quantity, action) VALUES 
('77777777-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1, 'refund'),
('88888888-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1, 'exchange');

-- Final verification - show all created data
SELECT 'SUMMARY - Data created successfully!' as status;

SELECT 'Merchants:' as table_name, COUNT(*) as records 
FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
UNION ALL
SELECT 'Orders:', COUNT(*) FROM orders WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000'
UNION ALL  
SELECT 'Order Items:', COUNT(*) FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
WHERE o.merchant_id = '66666666-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Returns:', COUNT(*) FROM returns WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000';

-- Show the test users and their orders
SELECT 'TEST USERS AND ORDERS:' as info;
SELECT 
  customer_email, 
  shopify_order_id, 
  total_amount, 
  status,
  created_at::date as order_date
FROM orders 
WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000'
ORDER BY shopify_order_id;