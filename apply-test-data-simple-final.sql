-- Simplified test data insertion - only essential columns
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

-- Upsert test merchant (update if exists, insert if not)
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
)
ON CONFLICT (shop_domain) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token,
  plan_type = EXCLUDED.plan_type,
  updated_at = NOW();

-- Clean existing test data
DELETE FROM return_items WHERE return_id IN (
  SELECT id FROM returns WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000'
);
DELETE FROM returns WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000';
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000'
);
DELETE FROM orders WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000';

-- Insert test orders with only essential columns
-- Test Customer 1: John Smith
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES ('11111111-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-001', 'john.smith@test.com', 299.97, 'completed', '66666666-e29b-41d4-a716-446655440000');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('11111111-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_002', 'Mechanical Keyboard', 89.99, 1),
('11111111-e29b-41d4-a716-446655440000', 'prod_test_003', 'Gaming Mouse', 59.99, 1);

-- Test Customer 2: Sarah Johnson
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES ('22222222-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 549.95, 'completed', '66666666-e29b-41d4-a716-446655440000');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('22222222-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_005', 'Wireless Charging Station', 199.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_006', 'USB-C Hub Deluxe', 119.99, 1),
('22222222-e29b-41d4-a716-446655440000', 'prod_test_007', 'Laptop Stand Ergonomic', 99.98, 1);

-- Test Customer 3: Mike Chen
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES ('33333333-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-003', 'mike.chen@test.com', 179.97, 'completed', '66666666-e29b-41d4-a716-446655440000');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('33333333-e29b-41d4-a716-446655440000', 'prod_test_008', 'Bluetooth Speaker', 79.99, 1),
('33333333-e29b-41d4-a716-446655440000', 'prod_test_009', 'Phone Case Premium', 49.99, 1),
('33333333-e29b-41d4-a716-446655440000', 'prod_test_010', 'Screen Protector Pack', 49.99, 1);

-- Test Customer 4: Emma Wilson
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES ('44444444-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-004', 'emma.wilson@test.com', 129.98, 'completed', '66666666-e29b-41d4-a716-446655440000');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('44444444-e29b-41d4-a716-446655440000', 'prod_test_011', 'Wireless Earbuds', 89.99, 1),
('44444444-e29b-41d4-a716-446655440000', 'prod_test_012', 'Car Mount Universal', 39.99, 1);

-- Test Customer 5: David Brown
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
VALUES ('55555555-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-005', 'david.brown@test.com', 699.95, 'completed', '66666666-e29b-41d4-a716-446655440000');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('55555555-e29b-41d4-a716-446655440000', 'prod_test_013', 'Monitor 4K Professional', 299.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_014', 'Webcam HD Pro', 159.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_015', 'Desk Lamp LED', 129.99, 1),
('55555555-e29b-41d4-a716-446655440000', 'prod_test_016', 'Cable Management Kit', 109.98, 1);

-- Add sample returns
INSERT INTO returns (id, shopify_order_id, customer_email, reason, status, total_amount, merchant_id) VALUES 
('77777777-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-001', 'john.smith@test.com', 'Product defective', 'requested', 149.99, '66666666-e29b-41d4-a716-446655440000'),
('88888888-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 'Wrong size', 'approved', 129.99, '66666666-e29b-41d4-a716-446655440000');

-- Add return items
INSERT INTO return_items (return_id, product_id, product_name, price, quantity, action) VALUES 
('77777777-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1, 'refund'),
('88888888-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1, 'exchange');

-- SUCCESS! Show results
SELECT '🎉 TEST DATA CREATED SUCCESSFULLY!' as result;

-- Verification queries
SELECT 'DATA SUMMARY:' as info;
SELECT 
  'Merchant' as type, 
  shop_domain as identifier,
  plan_type as details,
  '✅' as status
FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
UNION ALL
SELECT 
  'Test Users', 
  COUNT(*)::text || ' customers', 
  'With orders & items',
  '✅'
FROM orders WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000';

-- Show all test users
SELECT 
  ROW_NUMBER() OVER (ORDER BY shopify_order_id) as "#",
  customer_email as "📧 Email", 
  shopify_order_id as "🛍️ Order ID", 
  '$' || total_amount as "💰 Total",
  status as "Status"
FROM orders 
WHERE merchant_id = '66666666-e29b-41d4-a716-446655440000'
ORDER BY shopify_order_id;

-- Show URLs for testing
SELECT '🔗 TESTING URLS:' as info;
SELECT 
  'Install URL' as type,
  'https://ras-8.vercel.app/install?shop=test-66666666.myshopify.com' as url
UNION ALL
SELECT 
  'Customer Portal',
  'https://ras-8.vercel.app/customer-portal?email=john.smith@test.com'
UNION ALL
SELECT 
  'OAuth Start',
  'https://ras-8.vercel.app/auth/start?shop=test-66666666.myshopify.com';