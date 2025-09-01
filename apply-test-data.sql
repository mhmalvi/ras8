-- Apply test shop domain and users data directly to Supabase
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql

-- Insert test merchant for test-66666666.myshopify.com
INSERT INTO merchants (id, shop_domain, access_token, plan_type) VALUES 
('test-66666666-e29b-41d4-a716-446655440000', 'test-66666666.myshopify.com', 'test_access_token_66666666', 'pro')
ON CONFLICT (shop_domain) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  plan_type = EXCLUDED.plan_type;

-- Add test customers/users for the shop
-- Test Customer 1: John Smith - Frequent returner
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) VALUES 
('test1-8400-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-001', 'john.smith@test.com', 299.97, 'completed', 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT (shopify_order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('test1-8400-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1),
('test1-8400-e29b-41d4-a716-446655440000', 'prod_test_002', 'Mechanical Keyboard', 89.99, 1),
('test1-8400-e29b-41d4-a716-446655440000', 'prod_test_003', 'Gaming Mouse', 59.99, 1)
ON CONFLICT DO NOTHING;

-- Test Customer 2: Sarah Johnson - Premium customer
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) VALUES 
('test2-8400-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 549.95, 'completed', 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT (shopify_order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('test2-8400-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1),
('test2-8400-e29b-41d4-a716-446655440000', 'prod_test_005', 'Wireless Charging Station', 199.99, 1),
('test2-8400-e29b-41d4-a716-446655440000', 'prod_test_006', 'USB-C Hub Deluxe', 119.99, 1),
('test2-8400-e29b-41d4-a716-446655440000', 'prod_test_007', 'Laptop Stand Ergonomic', 99.98, 1)
ON CONFLICT DO NOTHING;

-- Test Customer 3: Mike Chen - Regular customer
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) VALUES 
('test3-8400-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-003', 'mike.chen@test.com', 179.97, 'completed', 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT (shopify_order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('test3-8400-e29b-41d4-a716-446655440000', 'prod_test_008', 'Bluetooth Speaker', 79.99, 1),
('test3-8400-e29b-41d4-a716-446655440000', 'prod_test_009', 'Phone Case Premium', 49.99, 1),
('test3-8400-e29b-41d4-a716-446655440000', 'prod_test_010', 'Screen Protector Pack', 49.99, 1)
ON CONFLICT DO NOTHING;

-- Test Customer 4: Emma Wilson - New customer
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) VALUES 
('test4-8400-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-004', 'emma.wilson@test.com', 129.98, 'completed', 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT (shopify_order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('test4-8400-e29b-41d4-a716-446655440000', 'prod_test_011', 'Wireless Earbuds', 89.99, 1),
('test4-8400-e29b-41d4-a716-446655440000', 'prod_test_012', 'Car Mount Universal', 39.99, 1)
ON CONFLICT DO NOTHING;

-- Test Customer 5: David Brown - High-value customer
INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) VALUES 
('test5-8400-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-005', 'david.brown@test.com', 699.95, 'completed', 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT (shopify_order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
('test5-8400-e29b-41d4-a716-446655440000', 'prod_test_013', 'Monitor 4K Professional', 299.99, 1),
('test5-8400-e29b-41d4-a716-446655440000', 'prod_test_014', 'Webcam HD Pro', 159.99, 1),
('test5-8400-e29b-41d4-a716-446655440000', 'prod_test_015', 'Desk Lamp LED', 129.99, 1),
('test5-8400-e29b-41d4-a716-446655440000', 'prod_test_016', 'Cable Management Kit', 109.98, 1)
ON CONFLICT DO NOTHING;

-- Add some sample returns for testing return workflows
INSERT INTO returns (id, shopify_order_id, customer_email, reason, status, total_amount, merchant_id) VALUES 
('testret1-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-001', 'john.smith@test.com', 'Product defective', 'requested', 149.99, 'test-66666666-e29b-41d4-a716-446655440000'),
('testret2-e29b-41d4-a716-446655440000', 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 'Wrong size', 'approved', 129.99, 'test-66666666-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Add return items
INSERT INTO return_items (return_id, product_id, product_name, price, quantity, action) VALUES 
('testret1-e29b-41d4-a716-446655440000', 'prod_test_001', 'Gaming Headset Pro', 149.99, 1, 'refund'),
('testret2-e29b-41d4-a716-446655440000', 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1, 'exchange')
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'Merchant Count' as table_name, COUNT(*) as records FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
UNION ALL
SELECT 'Orders Count', COUNT(*) FROM orders WHERE merchant_id = 'test-66666666-e29b-41d4-a716-446655440000'
UNION ALL  
SELECT 'Order Items Count', COUNT(*) FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
WHERE o.merchant_id = 'test-66666666-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Returns Count', COUNT(*) FROM returns WHERE merchant_id = 'test-66666666-e29b-41d4-a716-446655440000';

-- Show sample data
SELECT 'Test Users and Orders:' as info;
SELECT customer_email, shopify_order_id, total_amount, status 
FROM orders 
WHERE merchant_id = 'test-66666666-e29b-41d4-a716-446655440000'
ORDER BY shopify_order_id;