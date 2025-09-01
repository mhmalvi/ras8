-- Auto-UUID approach - let PostgreSQL generate all UUIDs
-- Run this in the Supabase SQL Editor

-- Clean slate approach
DELETE FROM return_items WHERE return_id IN (
  SELECT r.id FROM returns r 
  JOIN merchants m ON r.merchant_id = m.id 
  WHERE m.shop_domain = 'test-66666666.myshopify.com'
);

DELETE FROM returns WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
);

DELETE FROM order_items WHERE order_id IN (
  SELECT o.id FROM orders o 
  JOIN merchants m ON o.merchant_id = m.id 
  WHERE m.shop_domain = 'test-66666666.myshopify.com'
);

DELETE FROM orders WHERE merchant_id IN (
  SELECT id FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
);

DELETE FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';

-- Create merchant with auto-generated UUID
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

-- Create a temporary table to store the merchant ID for reference
DO $$
DECLARE
    merchant_uuid UUID;
    order1_uuid UUID;
    order2_uuid UUID;
    order3_uuid UUID;
    order4_uuid UUID;
    order5_uuid UUID;
    return1_uuid UUID;
    return2_uuid UUID;
BEGIN
    -- Get the merchant UUID
    SELECT id INTO merchant_uuid FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';
    
    -- Create orders with auto-generated UUIDs
    order1_uuid := gen_random_uuid();
    INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
    VALUES (order1_uuid, 'ORD-2024-TEST-001', 'john.smith@test.com', 299.97, 'completed', merchant_uuid);
    
    order2_uuid := gen_random_uuid();
    INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
    VALUES (order2_uuid, 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 549.95, 'completed', merchant_uuid);
    
    order3_uuid := gen_random_uuid();
    INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
    VALUES (order3_uuid, 'ORD-2024-TEST-003', 'mike.chen@test.com', 179.97, 'completed', merchant_uuid);
    
    order4_uuid := gen_random_uuid();
    INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
    VALUES (order4_uuid, 'ORD-2024-TEST-004', 'emma.wilson@test.com', 129.98, 'completed', merchant_uuid);
    
    order5_uuid := gen_random_uuid();
    INSERT INTO orders (id, shopify_order_id, customer_email, total_amount, status, merchant_id) 
    VALUES (order5_uuid, 'ORD-2024-TEST-005', 'david.brown@test.com', 699.95, 'completed', merchant_uuid);
    
    -- Insert order items
    INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES 
    -- John's items
    (order1_uuid, 'prod_test_001', 'Gaming Headset Pro', 149.99, 1),
    (order1_uuid, 'prod_test_002', 'Mechanical Keyboard', 89.99, 1),
    (order1_uuid, 'prod_test_003', 'Gaming Mouse', 59.99, 1),
    -- Sarah's items
    (order2_uuid, 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1),
    (order2_uuid, 'prod_test_005', 'Wireless Charging Station', 199.99, 1),
    (order2_uuid, 'prod_test_006', 'USB-C Hub Deluxe', 119.99, 1),
    (order2_uuid, 'prod_test_007', 'Laptop Stand Ergonomic', 99.98, 1),
    -- Mike's items
    (order3_uuid, 'prod_test_008', 'Bluetooth Speaker', 79.99, 1),
    (order3_uuid, 'prod_test_009', 'Phone Case Premium', 49.99, 1),
    (order3_uuid, 'prod_test_010', 'Screen Protector Pack', 49.99, 1),
    -- Emma's items
    (order4_uuid, 'prod_test_011', 'Wireless Earbuds', 89.99, 1),
    (order4_uuid, 'prod_test_012', 'Car Mount Universal', 39.99, 1),
    -- David's items
    (order5_uuid, 'prod_test_013', 'Monitor 4K Professional', 299.99, 1),
    (order5_uuid, 'prod_test_014', 'Webcam HD Pro', 159.99, 1),
    (order5_uuid, 'prod_test_015', 'Desk Lamp LED', 129.99, 1),
    (order5_uuid, 'prod_test_016', 'Cable Management Kit', 109.98, 1);
    
    -- Create sample returns
    return1_uuid := gen_random_uuid();
    INSERT INTO returns (id, shopify_order_id, customer_email, reason, status, total_amount, merchant_id) 
    VALUES (return1_uuid, 'ORD-2024-TEST-001', 'john.smith@test.com', 'Product defective', 'requested', 149.99, merchant_uuid);
    
    return2_uuid := gen_random_uuid();
    INSERT INTO returns (id, shopify_order_id, customer_email, reason, status, total_amount, merchant_id) 
    VALUES (return2_uuid, 'ORD-2024-TEST-002', 'sarah.johnson@test.com', 'Wrong size', 'approved', 129.99, merchant_uuid);
    
    -- Create return items
    INSERT INTO return_items (return_id, product_id, product_name, price, quantity, action) VALUES 
    (return1_uuid, 'prod_test_001', 'Gaming Headset Pro', 149.99, 1, 'refund'),
    (return2_uuid, 'prod_test_004', 'MacBook Pro Case Premium', 129.99, 1, 'exchange');
    
END $$;

-- Show results
SELECT '🎉 SUCCESS! All test data created!' as result;

-- Verification
SELECT 'MERCHANT:' as type, shop_domain, plan_type as details FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com'
UNION ALL
SELECT 'ORDERS:', COUNT(*)::text || ' test customers', 'Ready for testing' FROM orders o 
JOIN merchants m ON o.merchant_id = m.id WHERE m.shop_domain = 'test-66666666.myshopify.com';

-- Show all test users
SELECT '👥 TEST CUSTOMERS FOR test-66666666.myshopify.com' as header;
SELECT 
  customer_email as "📧 Email", 
  shopify_order_id as "🛍️ Order", 
  '$' || total_amount as "💰 Total"
FROM orders o
JOIN merchants m ON o.merchant_id = m.id 
WHERE m.shop_domain = 'test-66666666.myshopify.com'
ORDER BY shopify_order_id;